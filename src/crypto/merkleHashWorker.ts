/**
 * Worker for parallel RFC 6962 Section 2.1 Merkle Tree Hash leaf computation.
 *
 * Each worker is given a SharedArrayBuffer-backed view of the input data and a
 * leaf index range. It computes SHA-256(0x00 || leaf_i) for every leaf in its
 * range using Node's hardware-accelerated `node:crypto` and returns the
 * resulting digests as a single concatenated Uint8Array (transferable).
 */

import { createHash } from 'node:crypto';
import { parentPort, workerData } from 'node:worker_threads';

interface WorkerInput {
  readonly sab: SharedArrayBuffer;
  readonly totalBytes: number;
  readonly leafSize: number;
  readonly startLeaf: number;
  readonly endLeaf: number; // exclusive
}

if (!parentPort) {
  throw new Error('merkleHashWorker must be loaded as a worker');
}

const { sab, totalBytes, leafSize, startLeaf, endLeaf } = workerData as WorkerInput;
const view = Buffer.from(sab, 0, totalBytes);

const LEAF_PREFIX = Buffer.from([0x00]);
const HASH_BYTES = 32;
const nLeaves = endLeaf - startLeaf;
const out = Buffer.allocUnsafe(nLeaves * HASH_BYTES);

for (let i = 0; i < nLeaves; i++) {
  const leafIdx = startLeaf + i;
  const off = leafIdx * leafSize;
  const end = off + leafSize <= totalBytes ? off + leafSize : totalBytes;
  const h = createHash('sha256');
  h.update(LEAF_PREFIX);
  h.update(view.subarray(off, end));
  h.digest().copy(out, i * HASH_BYTES);
}

const arrayBuffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
parentPort.postMessage({ hashes: arrayBuffer }, [arrayBuffer]);
parentPort.close();
