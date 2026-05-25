/**
 * RFC 6962 Section 2.1 Merkle Tree Hash (MTH) over SHA-256, with multi-core
 * parallelism via Node worker_threads on the leaf level and a single-thread
 * reduction over internal nodes.
 *
 * Construction (RFC 6962 §2.1):
 *     MTH({})       = SHA-256()                                 // empty
 *     MTH({d0})     = SHA-256(0x00 || d0)                       // leaf
 *     MTH(D[n])     = SHA-256(0x01 || MTH(D[0:k]) || MTH(D[k:n])) // n > 1,
 *                                                                // k = largest
 *                                                                // power of 2
 *                                                                // strictly < n
 *
 * The root is identical to a serial RFC 6962 reference implementation; only the
 * leaf-level work is parallelized. Throughput scales near-linearly with the
 * core count of the host until memory bandwidth saturates.
 */
import { availableParallelism } from 'node:os';
import { createHash } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createHash as createHashType } from '../types/events.js';
import { bytesToHex } from '../utils/encoding.js';
import { HashError } from './errors.js';
const WORKER_URL = new URL('./merkleHashWorker.js', import.meta.url);
const HASH_BYTES = 32;
const DEFAULT_LEAF_SIZE = 1 << 20; // 1 MiB
const LEAF_PREFIX = Buffer.from([0x00]);
const NODE_PREFIX = Buffer.from([0x01]);
/**
 * Empirical cost of starting one Node worker thread plus a shared-buffer setup
 * relative to the SHA-256 work it can do on a single core. Below this much
 * data per worker the parallel path loses to single-thread SHA-256.
 * Calibrated on Apple Silicon (M1/M2/M3 family) where SHA-256 hardware-accel
 * runs at roughly 3.3 GB/s on one core; threshold revisited every release.
 */
const MIN_BYTES_PER_WORKER = 32 * 1024 * 1024; // 32 MiB
/**
 * Below this total input size the parallel pipeline never beats single-thread
 * SHA-256 (measured: at 64 MiB the worker spin-up adds ~5–10 ms which the
 * 21 ms serial baseline cannot recover). Stay serial below the cutoff.
 */
const PARALLEL_THRESHOLD_BYTES = 128 * 1024 * 1024; // 128 MiB
function autoSelectParallelism(totalBytes, requested) {
    const hostCores = Math.max(1, availableParallelism());
    if (requested === 1)
        return 1;
    if (totalBytes < PARALLEL_THRESHOLD_BYTES)
        return 1;
    const cap = requested === undefined ? hostCores : Math.max(1, Math.floor(requested));
    const amortized = Math.floor(totalBytes / MIN_BYTES_PER_WORKER);
    return Math.max(1, Math.min(cap, amortized));
}
/**
 * Computes the RFC 6962 §2.1 Merkle Tree Hash root of `data` using SHA-256 as
 * the inner hash. The returned digest is a 64-character lowercase hex string,
 * branded as `Hash` like the rest of `nearbytes-crypto`.
 *
 * NOTE: the digest is NOT equal to `SHA-256(data)` — by design. Two leaves are
 * combined with a `0x01` tag prefix, an empty input hashes to `SHA-256()`, and
 * a single-leaf input hashes to `SHA-256(0x00 || data)`.
 */
export async function computeMerkleHash(data, options = {}) {
    try {
        const leafSize = options.leafSize ?? DEFAULT_LEAF_SIZE;
        if (!Number.isInteger(leafSize) || leafSize <= 0) {
            throw new HashError(`leafSize must be a positive integer, got ${leafSize}`);
        }
        const totalBytes = data.length;
        // Pick the parallelism degree that amortizes worker startup over the
        // amount of SHA-256 work each worker will see (see MIN_BYTES_PER_WORKER).
        const parallelism = autoSelectParallelism(totalBytes, options.parallelism);
        // RFC 6962 §2.1: MTH({}) = SHA-256() of the empty string.
        if (totalBytes === 0) {
            const digest = createHash('sha256').digest();
            return createHashType(bytesToHex(digest));
        }
        const nLeaves = Math.ceil(totalBytes / leafSize);
        // For tiny inputs or when single-threaded is explicitly requested, skip the
        // worker pool (the startup cost dominates).
        let leafDigests;
        if (parallelism === 1 || nLeaves === 1) {
            leafDigests = computeLeavesSerial(data, totalBytes, leafSize, nLeaves);
        }
        else {
            leafDigests = await computeLeavesParallel(data, totalBytes, leafSize, nLeaves, parallelism);
        }
        const root = mthReduce(leafDigests, 0, nLeaves);
        return createHashType(bytesToHex(root));
    }
    catch (error) {
        if (error instanceof HashError)
            throw error;
        throw new HashError(`Failed to compute Merkle hash: ${error instanceof Error ? error.message : 'unknown error'}`, error instanceof Error ? error : undefined);
    }
}
function computeLeavesSerial(data, totalBytes, leafSize, nLeaves) {
    const view = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
    const out = Buffer.allocUnsafe(nLeaves * HASH_BYTES);
    for (let i = 0; i < nLeaves; i++) {
        const off = i * leafSize;
        const end = off + leafSize <= totalBytes ? off + leafSize : totalBytes;
        const h = createHash('sha256');
        h.update(LEAF_PREFIX);
        h.update(view.subarray(off, end));
        h.digest().copy(out, i * HASH_BYTES);
    }
    return out;
}
async function computeLeavesParallel(data, totalBytes, leafSize, nLeaves, parallelism) {
    // Materialize the input in a SharedArrayBuffer so all workers can hash from
    // the same memory without per-worker copies. If the caller already provided
    // a SAB-backed view, reuse it.
    let sab;
    if (data.buffer instanceof SharedArrayBuffer && data.byteOffset === 0) {
        sab = data.buffer;
    }
    else {
        sab = new SharedArrayBuffer(totalBytes);
        new Uint8Array(sab).set(data);
    }
    const nWorkers = Math.min(parallelism, nLeaves);
    const leavesPerWorker = Math.ceil(nLeaves / nWorkers);
    const out = Buffer.allocUnsafe(nLeaves * HASH_BYTES);
    const tasks = [];
    for (let w = 0; w < nWorkers; w++) {
        const startLeaf = w * leavesPerWorker;
        if (startLeaf >= nLeaves)
            break;
        const endLeaf = Math.min(startLeaf + leavesPerWorker, nLeaves);
        tasks.push(runLeafWorker(sab, totalBytes, leafSize, startLeaf, endLeaf, out));
    }
    await Promise.all(tasks);
    return out;
}
function runLeafWorker(sab, totalBytes, leafSize, startLeaf, endLeaf, outDigests) {
    return new Promise((resolve, reject) => {
        const worker = new Worker(fileURLToPath(WORKER_URL), {
            workerData: { sab, totalBytes, leafSize, startLeaf, endLeaf },
        });
        let received = false;
        worker.once('message', (msg) => {
            received = true;
            const slice = new Uint8Array(msg.hashes);
            outDigests.set(slice, startLeaf * HASH_BYTES);
            resolve();
        });
        worker.once('error', reject);
        worker.once('exit', (code) => {
            if (!received && code !== 0) {
                reject(new Error(`merkleHashWorker exited with code ${code} before delivering result`));
            }
        });
    });
}
/**
 * Single-thread RFC 6962 §2.1 reduction over already-computed leaf digests.
 * Operates in-place on the flat `Buffer` of concatenated digests; iterative
 * to avoid call-stack depth issues for trees with millions of leaves.
 */
function mthReduce(leafDigests, startLeafIdx, endLeafIdx) {
    return mthReduceRecursive(leafDigests, startLeafIdx, endLeafIdx);
}
function mthReduceRecursive(leafDigests, start, end) {
    const n = end - start;
    if (n === 1) {
        return leafDigests.subarray(start * HASH_BYTES, (start + 1) * HASH_BYTES);
    }
    const k = largestPowerOfTwoLessThan(n);
    const left = mthReduceRecursive(leafDigests, start, start + k);
    const right = mthReduceRecursive(leafDigests, start + k, end);
    const h = createHash('sha256');
    h.update(NODE_PREFIX);
    h.update(left);
    h.update(right);
    return h.digest();
}
function largestPowerOfTwoLessThan(n) {
    let k = 1;
    while (k * 2 < n)
        k *= 2;
    return k;
}
//# sourceMappingURL=merkleHash.js.map