import type { Hash } from '../types/events.js';
/**
 * Computes SHA-256 hash of the input data
 * @param data - Data to hash
 * @returns 64-character hexadecimal hash string
 * @throws HashError if hashing fails
 */
export declare function computeHash(data: Uint8Array): Promise<Hash>;
//# sourceMappingURL=hash.d.ts.map