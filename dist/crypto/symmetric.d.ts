import type { SymmetricKey } from '../types/keys.js';
import type { EncryptedData as EncryptedDataType } from '../types/events.js';
/**
 * Generates a random 32-byte symmetric key
 * @returns SymmetricKey
 * @throws EncryptionError if key generation fails
 */
export declare function generateSymmetricKey(): Promise<SymmetricKey>;
/**
 * Encrypts data using AES-256-GCM
 * Format: [IV (12 bytes)][ciphertext][auth tag (16 bytes)]
 * @param data - Plaintext data to encrypt
 * @param key - 32-byte symmetric key
 * @returns EncryptedData with IV, ciphertext, and auth tag
 * @throws EncryptionError if encryption fails
 */
export declare function encryptSym(data: Uint8Array, key: SymmetricKey): Promise<EncryptedDataType>;
/**
 * Decrypts data using AES-256-GCM
 * @param encrypted - EncryptedData containing IV, ciphertext, and auth tag
 * @param key - 32-byte symmetric key
 * @returns Decrypted plaintext data
 * @throws DecryptionError if decryption fails (wrong key, tampered data, etc.)
 */
export declare function decryptSym(encrypted: EncryptedDataType, key: SymmetricKey): Promise<Uint8Array>;
//# sourceMappingURL=symmetric.d.ts.map