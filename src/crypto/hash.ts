import type { Hash } from '../types/events.js';
import { createHash as createHashType } from '../types/events.js';
import { bytesToHex } from '../utils/encoding.js';
import { HashError } from './errors.js';

/**
 * Computes SHA-256 hash of the input data
 * @param data - Data to hash
 * @returns 64-character hexadecimal hash string
 * @throws HashError if hashing fails
 */
export async function computeHash(data: Uint8Array): Promise<Hash> {
  try {
    const crypto = globalThis.crypto?.subtle;
    if (!crypto) {
      throw new HashError('Web Crypto API not available');
    }

    const dataArray = new Uint8Array(data);
    const hashBuffer = await crypto.digest('SHA-256', dataArray);
    const hashBytes = new Uint8Array(hashBuffer);
    const hashHex = bytesToHex(hashBytes);

    return createHashType(hashHex);
  } catch (error) {
    throw new HashError(
      `Failed to compute hash: ${error instanceof Error ? error.message : 'unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

