export interface Sha256Stream {
    /**
     * Hash the given bytes. The buffer is copied into a fresh `ArrayBuffer`
     * and transferred to the worker (zero-copy after the copy).
     */
    update(buf: Uint8Array): void;
    /**
     * Transfer `ab` directly to the worker; the caller MUST NOT touch `ab`
     * after this call (its `ArrayBuffer` detaches on the main side). The
     * number of valid bytes is `ab.byteLength`.
     */
    updateTransfer(ab: ArrayBuffer): void;
    /**
     * Finalize the digest as 64-char lowercase hex and release the worker
     * back to the internal pool.
     */
    finalize(): Promise<string>;
}
/**
 * Acquire a streaming SHA-256 hasher. The implementation routes the work
 * to one of K long-lived worker threads (K = `NEARBYTES_HASH_POOL_CAPACITY`
 * or `os.availableParallelism()`). When all workers are busy, the returned
 * promise resolves as soon as one releases via `finalize()`.
 */
export declare function acquireSha256Stream(): Promise<Sha256Stream>;
/**
 * @internal Reset the pool. Intended for tests and microbenchmarks that
 * need to vary the capacity within one process. Production code MUST NOT
 * call this — it terminates every in-flight worker.
 */
export declare function _closeSha256StreamPoolForTesting(): Promise<void>;
//# sourceMappingURL=sha256Stream.d.ts.map