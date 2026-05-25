/**
 * Long-lived streaming SHA-256 worker.
 *
 * Each worker keeps a single open `Hash` and serves an arbitrary number of
 * acquire/finalize cycles initiated from the main thread. Bytes are received
 * via transferable `ArrayBuffer`s (zero-copy hand-off; the source buffer
 * detaches on the main side). After `finalize`, the hasher resets so the
 * worker is immediately ready for the next acquirer.
 *
 * Protocol (main → worker):
 *   { type: 'chunk', buf: ArrayBuffer }          // transferred
 *   { type: 'finalize', id: number }
 *   { type: 'shutdown' }
 *
 * Protocol (worker → main):
 *   { type: 'digest', id: number, hex: string }
 */
import { createHash } from 'node:crypto';
import { parentPort } from 'node:worker_threads';
if (!parentPort) {
    throw new Error('hashWorkerStream must be loaded as a worker');
}
let hasher = createHash('sha256');
parentPort.on('message', (msg) => {
    if (msg.type === 'chunk') {
        hasher.update(Buffer.from(msg.buf));
        return;
    }
    if (msg.type === 'finalize') {
        const hex = hasher.digest('hex');
        hasher = createHash('sha256');
        parentPort.postMessage({ type: 'digest', id: msg.id, hex });
        return;
    }
    if (msg.type === 'shutdown') {
        parentPort.close();
        return;
    }
});
//# sourceMappingURL=hashWorkerStream.js.map