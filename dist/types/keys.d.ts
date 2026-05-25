import { ValidationError } from './errors.js';
/**
 * Branded type for symmetric encryption keys (32 bytes)
 */
export type SymmetricKey = Uint8Array & {
    readonly __brand: 'SymmetricKey';
};
/**
 * Branded type for private keys
 */
export type PrivateKey = Uint8Array & {
    readonly __brand: 'PrivateKey';
};
/**
 * Branded type for public keys
 */
export type PublicKey = Uint8Array & {
    readonly __brand: 'PublicKey';
};
/**
 * Branded type for channel secrets
 */
export type Secret = string & {
    readonly __brand: 'Secret';
};
/**
 * Key pair structure for asymmetric cryptography
 */
export interface KeyPair {
    readonly publicKey: PublicKey;
    readonly privateKey: PrivateKey;
}
/**
 * Creates a symmetric key from a byte array with validation
 * @param bytes - 32-byte array
 * @returns Branded SymmetricKey
 * @throws InvalidKeyError if bytes length is not 32
 */
export declare function createSymmetricKey(bytes: Uint8Array): SymmetricKey;
/**
 * Creates a secret from a string with validation
 * @param input - Secret string (e.g., "channelname:password")
 * @returns Branded Secret
 * @throws InvalidSecretError if secret is empty
 */
export declare function createSecret(input: string): Secret;
/**
 * Creates a private key from a byte array
 * @param bytes - Private key bytes
 * @returns Branded PrivateKey
 */
export declare function createPrivateKey(bytes: Uint8Array): PrivateKey;
/**
 * Creates a public key from a byte array
 * @param bytes - Public key bytes
 * @returns Branded PublicKey
 */
export declare function createPublicKey(bytes: Uint8Array): PublicKey;
/**
 * Error thrown when a key is invalid
 */
export declare class InvalidKeyError extends ValidationError {
    constructor(message: string);
}
/**
 * Error thrown when a secret is invalid
 */
export declare class InvalidSecretError extends ValidationError {
    constructor(message: string);
}
//# sourceMappingURL=keys.d.ts.map