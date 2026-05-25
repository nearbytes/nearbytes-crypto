/**
 * Streaming SHA-256 with transparent K-worker pooling.
 *
 * Public API:
 *   - `acquireSha256Stream(): Promise<Sha256Stream>` — get a streaming hasher
 *     that runs off the main thread on one of K long-lived workers. When all
 *     K workers are busy, the call queues on a FIFO and resumes as workers
 *     release.
 *
 * Everything below the function signature is implementation detail: workers
 * are spawned lazily on first call, kept alive for the lifetime of the
 * process, `unref()`-ed so they never block clean exit, and load-balanced
 * across acquirers. Callers never see the pool.
 *
 * Capacity defaults to `os.availableParallelism()` and can be pinned with
 * `NEARBYTES_HASH_POOL_CAPACITY=<n>` at process start (read once on first
 * `acquireSha256Stream` call). The env var exists so benchmarks can sweep
 * K across spawned subprocesses; production code never needs to set it.
 *
 * Why not fold this into `computeHash`?
 *   `computeHash(data)` is one-shot over a fully-materialized buffer and is
 *   already async + parallel via Web Crypto / libuv. The streaming case
 *   (bytes arriving as a series of chunks, hash must update incrementally
 *   without blocking the event loop) has no native async API in Node or the
 *   browser, so a worker is the only off-thread option. The two APIs solve
 *   different problems; only this one needs a pool.
 */
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';
const WORKER_URL = new URL('./hashWorkerStream.js', import.meta.url);
let pool = null;
function readEnvCapacity() {
    const raw = process.env['NEARBYTES_HASH_POOL_CAPACITY'];
    if (raw === undefined || raw.trim() === '') {
        return Math.max(1, availableParallelism());
    }
    const n = Math.floor(Number(raw));
    if (!Number.isFinite(n) || n < 1) {
        return Math.max(1, availableParallelism());
    }
    return n;
}
function createPool(capacity) {
    const free = [];
    const waiters = [];
    let closed = false;
    let opIdCounter = 0;
    const spawn = () => {
        const w = new Worker(fileURLToPath(WORKER_URL));
        // Idle workers must not keep the event loop alive — a process that has
        // nothing left to do except idle pool workers should exit cleanly.
        // The matching `ref()` in `takeWorker` re-arms the worker while it has
        // an outstanding finalize, so the loop stays alive waiting for the
        // digest response.
        w.unref();
        const pw = { worker: w, finalizeId: 0, pending: null };
        w.on('message', (msg) => {
            if (msg.type !== 'digest')
                return;
            const pending = pw.pending;
            if (!pending || pw.finalizeId !== msg.id)
                return;
            pw.pending = null;
            pending.resolve(msg.hex);
            releaseWorker(pw);
        });
        w.on('error', (err) => {
            const pending = pw.pending;
            pw.pending = null;
            if (pending)
                pending.reject(err);
        });
        return pw;
    };
    const releaseWorker = (pw) => {
        if (closed)
            return;
        const waiter = waiters.shift();
        if (waiter) {
            // Hand the worker straight to the next acquirer — it stays ref'd
            // because it's about to do more work.
            waiter.resolve(pw);
            return;
        }
        // No waiters: return the worker to the idle pool and let the process
        // exit if nothing else is keeping the loop alive.
        pw.worker.unref();
        free.push(pw);
    };
    const takeWorker = () => {
        if (closed)
            return Promise.reject(new Error('sha256 stream pool is closed'));
        const cached = free.pop();
        if (cached) {
            // Worker is about to be busy: keep the event loop alive until the
            // matching finalize lands.
            cached.worker.ref();
            return Promise.resolve(cached);
        }
        return new Promise((resolve, reject) => {
            waiters.push({ resolve, reject });
        });
    };
    for (let i = 0; i < capacity; i++) {
        free.push(spawn());
    }
    const acquire = async () => {
        const pw = await takeWorker();
        let finished = false;
        const ensureLive = () => {
            if (finished) {
                throw new Error('sha256 stream already finalized');
            }
        };
        const update = (buf) => {
            ensureLive();
            const ab = new ArrayBuffer(buf.byteLength);
            new Uint8Array(ab).set(buf);
            pw.worker.postMessage({ type: 'chunk', buf: ab }, [ab]);
        };
        const updateTransfer = (ab) => {
            ensureLive();
            pw.worker.postMessage({ type: 'chunk', buf: ab }, [ab]);
        };
        const finalize = () => {
            ensureLive();
            finished = true;
            const id = ++opIdCounter;
            pw.finalizeId = id;
            return new Promise((resolve, reject) => {
                pw.pending = { resolve, reject };
                pw.worker.postMessage({ type: 'finalize', id });
            });
        };
        return { update, updateTransfer, finalize };
    };
    const closeForTesting = async () => {
        if (closed)
            return;
        closed = true;
        while (waiters.length > 0) {
            const w = waiters.shift();
            w?.reject(new Error('sha256 stream pool is closed'));
        }
        const all = [...free];
        free.length = 0;
        await Promise.all(all.map((pw) => {
            pw.worker.postMessage({ type: 'shutdown' });
            return new Promise((resolve) => {
                pw.worker.once('exit', () => resolve());
            });
        }));
    };
    return { capacity, acquire, closeForTesting };
}
function getPool() {
    if (!pool) {
        pool = createPool(readEnvCapacity());
    }
    return pool;
}
/**
 * Acquire a streaming SHA-256 hasher. The implementation routes the work
 * to one of K long-lived worker threads (K = `NEARBYTES_HASH_POOL_CAPACITY`
 * or `os.availableParallelism()`). When all workers are busy, the returned
 * promise resolves as soon as one releases via `finalize()`.
 */
export async function acquireSha256Stream() {
    return getPool().acquire();
}
/**
 * @internal Reset the pool. Intended for tests and microbenchmarks that
 * need to vary the capacity within one process. Production code MUST NOT
 * call this — it terminates every in-flight worker.
 */
export async function _closeSha256StreamPoolForTesting() {
    const p = pool;
    pool = null;
    if (p)
        await p.closeForTesting();
}
//# sourceMappingURL=sha256Stream.js.map