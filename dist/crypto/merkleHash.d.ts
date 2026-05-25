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
import type { Hash } from '../types/events.js';
export interface MerkleHashOptions {
    /**
     * Leaf size in bytes. The last leaf may be shorter. Default: 1 MiB.
     * Smaller leaves give finer parallelism granularity but a deeper tree.
     */
    readonly leafSize?: number;
    /**
     * Number of worker threads used for leaf-level hashing. Default: number of
     * logical cores on the host (`os.availableParallelism()`). Set to 1 to force
     * a single-threaded computation in the calling thread.
     */
    readonly parallelism?: number;
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
export declare function computeMerkleHash(data: Uint8Array, options?: MerkleHashOptions): Promise<Hash>;
//# sourceMappingURL=merkleHash.d.ts.map