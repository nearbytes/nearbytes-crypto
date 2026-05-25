import type { Hash, EncryptedData, Signature } from '../types/events.js';
import type { Secret, KeyPair, PrivateKey, PublicKey, SymmetricKey } from '../types/keys.js';
/**
 * Core cryptographic operations interface
 * Provides all cryptographic primitives needed by the Nearbytes protocol
 */
export interface CryptoOperations {
    /**
     * Computes SHA-256 hash of data
     */
    computeHash(data: Uint8Array): Promise<Hash>;
    /**
     * Generates a random 32-byte symmetric key
     */
    generateSymmetricKey(): Promise<SymmetricKey>;
    /**
     * Encrypts data using AES-256-GCM
     */
    encryptSym(data: Uint8Array, key: SymmetricKey): Promise<EncryptedData>;
    /**
     * Decrypts data using AES-256-GCM
     */
    decryptSym(encrypted: EncryptedData, key: SymmetricKey): Promise<Uint8Array>;
    /**
     * Derives a key pair from a secret (deterministic)
     */
    deriveKeys(secret: Secret): Promise<KeyPair>;
    /**
     * Signs data using ECDSA P-256
     */
    signPR(data: Uint8Array, privateKey: PrivateKey): Promise<Signature>;
    /**
     * Verifies a signature using ECDSA P-256
     */
    verifyPU(data: Uint8Array, signature: Signature, publicKey: PublicKey): Promise<boolean>;
    /**
     * Derives a symmetric key from a private key
     */
    deriveSymKey(privateKey: PrivateKey): Promise<SymmetricKey>;
}
/**
 * Creates a concrete implementation of CryptoOperations using Web Crypto API
 * @returns CryptoOperations implementation
 * @throws Error if Web Crypto API is not available
 */
export declare function createCryptoOperations(): CryptoOperations;
//# sourceMappingURL=index.d.ts.map