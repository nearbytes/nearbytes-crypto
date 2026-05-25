/**
 * Worker for parallel RFC 6962 Section 2.1 Merkle Tree Hash leaf computation.
 *
 * Each worker is given a SharedArrayBuffer-backed view of the input data and a
 * leaf index range. It computes SHA-256(0x00 || leaf_i) for every leaf in its
 * range using Node's hardware-accelerated `node:crypto` and returns the
 * resulting digests as a single concatenated Uint8Array (transferable).
 */
export {};
//# sourceMappingURL=merkleHashWorker.d.ts.map