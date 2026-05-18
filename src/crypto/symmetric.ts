import type { SymmetricKey } from '../types/keys.js';
import type { EncryptedData as EncryptedDataType } from '../types/events.js';
import { createSymmetricKey } from '../types/keys.js';
import { createEncryptedData } from '../types/events.js';
import { EncryptionError, DecryptionError } from './errors.js';

const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits for authentication tag
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Generates a random 32-byte symmetric key
 * @returns SymmetricKey
 * @throws EncryptionError if key generation fails
 */
export async function generateSymmetricKey(): Promise<SymmetricKey> {
  try {
    const crypto = globalThis.crypto?.subtle;
    if (!crypto) {
      throw new EncryptionError('Web Crypto API not available');
    }

    const key = await crypto.generateKey(
      {
        name: ALGORITHM,
        length: KEY_LENGTH,
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );

    const keyBytes = new Uint8Array(await crypto.exportKey('raw', key));
    return createSymmetricKey(keyBytes);
  } catch (error) {
    throw new EncryptionError(
      `Failed to generate symmetric key: ${error instanceof Error ? error.message : 'unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Encrypts data using AES-256-GCM
 * Format: [IV (12 bytes)][ciphertext][auth tag (16 bytes)]
 * @param data - Plaintext data to encrypt
 * @param key - 32-byte symmetric key
 * @returns EncryptedData with IV, ciphertext, and auth tag
 * @throws EncryptionError if encryption fails
 */
export async function encryptSym(
  data: Uint8Array,
  key: SymmetricKey
): Promise<EncryptedDataType> {
  try {
    const crypto = globalThis.crypto?.subtle;
    if (!crypto) {
      throw new EncryptionError('Web Crypto API not available');
    }

    // Generate random IV
    const iv = new Uint8Array(IV_LENGTH);
    globalThis.crypto.getRandomValues(iv);

    // Import key
    const keyArray = new Uint8Array(key);
    const cryptoKey = await crypto.importKey(
      'raw',
      keyArray,
      { name: ALGORITHM, length: KEY_LENGTH },
      false, // not extractable
      ['encrypt']
    );

    // Encrypt
    const dataArray = new Uint8Array(data);
    const encryptedBuffer = await crypto.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH * 8, // in bits
      },
      cryptoKey,
      dataArray
    );

    const encrypted = new Uint8Array(encryptedBuffer);

    // Combine IV + ciphertext (which includes auth tag at the end)
    // The Web Crypto API appends the tag automatically
    const result = new Uint8Array(IV_LENGTH + encrypted.length);
    result.set(iv, 0);
    result.set(encrypted, IV_LENGTH);

    return createEncryptedData(result);
  } catch (error) {
    throw new EncryptionError(
      `Failed to encrypt data: ${error instanceof Error ? error.message : 'unknown error'}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Decrypts data using AES-256-GCM
 * @param encrypted - EncryptedData containing IV, ciphertext, and auth tag
 * @param key - 32-byte symmetric key
 * @returns Decrypted plaintext data
 * @throws DecryptionError if decryption fails (wrong key, tampered data, etc.)
 */
export async function decryptSym(
  encrypted: EncryptedDataType,
  key: SymmetricKey
): Promise<Uint8Array> {
  try {
    const crypto = globalThis.crypto?.subtle;
    if (!crypto) {
      throw new DecryptionError('Web Crypto API not available');
    }

    // Validate minimum length
    if (encrypted.length < IV_LENGTH + TAG_LENGTH) {
      throw new DecryptionError(
        `Encrypted data too short: expected at least ${IV_LENGTH + TAG_LENGTH} bytes, got ${encrypted.length}`
      );
    }

    // Extract IV and ciphertext (with tag)
    const iv = encrypted.slice(0, IV_LENGTH);
    const ciphertext = encrypted.slice(IV_LENGTH);

    // Import key
    const keyArray = new Uint8Array(key);
    const cryptoKey = await crypto.importKey(
      'raw',
      keyArray,
      { name: ALGORITHM, length: KEY_LENGTH },
      false, // not extractable
      ['decrypt']
    );

    // Decrypt
    const decryptedBuffer = await crypto.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
        tagLength: TAG_LENGTH * 8, // in bits
      },
      cryptoKey,
      ciphertext
    );

    return new Uint8Array(decryptedBuffer);
  } catch (error) {
    if (error instanceof DecryptionError) {
      throw error;
    }
    throw new DecryptionError(
      `Failed to decrypt data: ${error instanceof Error ? error.message : 'unknown error'}. This may indicate wrong key or tampered data.`,
      error instanceof Error ? error : undefined
    );
  }
}

