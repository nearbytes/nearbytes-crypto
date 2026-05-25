export interface StreamingHasher {
    /** Copies and transfers `buf` to the worker (zero-copy after the copy). */
    update(buf: Uint8Array): void;
    /**
     * Transfers `ab` directly to the worker; the caller MUST NOT touch `ab`
     * after the call (it detaches on this side). The number of valid bytes
     * is `ab.byteLength`.
     */
    updateTransfer(ab: ArrayBuffer): void;
    /** Finalize the current stream and release the worker back to the pool. */
    finalize(): Promise<string>;
}
export interface HashWorkerPool {
    /** Maximum number of concurrently-active streaming hashers. */
    readonly capacity: number;
    /** Block until a worker is free, then return a fresh streaming hasher. */
    acquire(): Promise<StreamingHasher>;
    /** Shut down all workers; pool is unusable afterwards. */
    close(): Promise<void>;
}
export interface HashWorkerPoolOptions {
    /** Number of worker threads to spawn; defaults to `availableParallelism()`. */
    readonly capacity?: number;
}
export declare function createHashWorkerPool(options?: HashWorkerPoolOptions): HashWorkerPool;
//# sourceMappingURL=hashWorkerPool.d.ts.map