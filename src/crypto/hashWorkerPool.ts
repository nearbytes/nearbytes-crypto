/**
 * Streaming SHA-256 worker pool with K long-lived `worker_threads`.
 *
 * Each worker maintains an open `Hash` and serves any number of streaming
 * sessions ("acquirers") sequentially. The pool keeps every worker pre-warmed
 * so a fresh acquire pays only a queue dequeue and one `postMessage`, never
 * a worker spawn. Bytes are handed off via transferable `ArrayBuffer`s for
 * zero-copy delivery.
 *
 * Design properties:
 *   - Capacity defaults to `os.availableParallelism()` and is the upper bound
 *     on simultaneously-active streaming hashes; additional `acquire()` calls
 *     suspend on an internal FIFO until a worker is released by `finalize`.
 *   - One in-flight `finalize` per worker; the worker auto-resets after
 *     emitting the digest, so the very next acquirer reuses the same warm
 *     V8 heap and `node:crypto` `Hash` allocation. This is the long-lived
 *     equivalent of pre-spawning a fresh worker per block, but without the
 *     ~5–10 ms spawn cost on Apple Silicon (and similar on Linux).
 *   - `update()` accepts a Uint8Array and transfers an exact-fit
 *     `ArrayBuffer` clone to the worker. Callers who already hold a
 *     detachable `ArrayBuffer` should pass it via `updateTransfer()` to skip
 *     the extra copy.
 *
 * The pool is intentionally process-global friendly: instantiate it once at
 * process start, share it across all peer sessions, and let it own the
 * worker lifetime. Calling `close()` cleanly shuts every worker down.
 */
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { Worker } from 'node:worker_threads';

const WORKER_URL = new URL('./hashWorkerStream.js', import.meta.url);

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

interface PooledWorker {
  readonly worker: Worker;
  finalizeId: number;
  pending: {
    resolve: (hex: string) => void;
    reject: (err: Error) => void;
  } | null;
}

interface PoolWaiter {
  resolve(worker: PooledWorker): void;
  reject(err: Error): void;
}

export interface HashWorkerPoolOptions {
  /** Number of worker threads to spawn; defaults to `availableParallelism()`. */
  readonly capacity?: number;
}

export function createHashWorkerPool(options: HashWorkerPoolOptions = {}): HashWorkerPool {
  const capacity = Math.max(1, options.capacity ?? availableParallelism());
  const free: PooledWorker[] = [];
  const waiters: PoolWaiter[] = [];
  let closed = false;
  let opIdCounter = 0;

  const spawn = (): PooledWorker => {
    const w = new Worker(fileURLToPath(WORKER_URL));
    const pw: PooledWorker = { worker: w, finalizeId: 0, pending: null };
    w.on('message', (msg: { type: 'digest'; id: number; hex: string }) => {
      if (msg.type !== 'digest') return;
      const pending = pw.pending;
      if (!pending || pw.finalizeId !== msg.id) return;
      pw.pending = null;
      pending.resolve(msg.hex);
      releaseWorker(pw);
    });
    w.on('error', (err) => {
      const pending = pw.pending;
      pw.pending = null;
      if (pending) pending.reject(err);
    });
    return pw;
  };

  const releaseWorker = (pw: PooledWorker): void => {
    if (closed) return;
    const waiter = waiters.shift();
    if (waiter) {
      waiter.resolve(pw);
      return;
    }
    free.push(pw);
  };

  const takeWorker = (): Promise<PooledWorker> => {
    if (closed) return Promise.reject(new Error('hash worker pool is closed'));
    const cached = free.pop();
    if (cached) return Promise.resolve(cached);
    return new Promise<PooledWorker>((resolve, reject) => {
      waiters.push({ resolve, reject });
    });
  };

  for (let i = 0; i < capacity; i++) {
    free.push(spawn());
  }

  const acquire = async (): Promise<StreamingHasher> => {
    const pw = await takeWorker();
    let finished = false;

    const ensureLive = (): void => {
      if (finished) {
        throw new Error('streaming hasher already finalized');
      }
    };

    const update = (buf: Uint8Array): void => {
      ensureLive();
      const ab = new ArrayBuffer(buf.byteLength);
      new Uint8Array(ab).set(buf);
      pw.worker.postMessage({ type: 'chunk', buf: ab }, [ab]);
    };

    const updateTransfer = (ab: ArrayBuffer): void => {
      ensureLive();
      pw.worker.postMessage({ type: 'chunk', buf: ab }, [ab]);
    };

    const finalize = (): Promise<string> => {
      ensureLive();
      finished = true;
      const id = ++opIdCounter;
      pw.finalizeId = id;
      return new Promise<string>((resolve, reject) => {
        pw.pending = { resolve, reject };
        pw.worker.postMessage({ type: 'finalize', id });
      });
    };

    return { update, updateTransfer, finalize };
  };

  const close = async (): Promise<void> => {
    if (closed) return;
    closed = true;
    while (waiters.length > 0) {
      const w = waiters.shift();
      w?.reject(new Error('hash worker pool is closed'));
    }
    const all = [...free];
    free.length = 0;
    await Promise.all(
      all.map((pw) => {
        pw.worker.postMessage({ type: 'shutdown' });
        return new Promise<void>((resolve) => {
          pw.worker.once('exit', () => resolve());
        });
      }),
    );
  };

  return { capacity, acquire, close };
}
