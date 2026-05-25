import { CryptoError } from '../types/errors.js';
/**
 * Error thrown when hash computation fails
 */
export declare class HashError extends CryptoError {
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when encryption fails
 */
export declare class EncryptionError extends CryptoError {
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when decryption fails
 */
export declare class DecryptionError extends CryptoError {
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when signing fails
 */
export declare class SigningError extends CryptoError {
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when signature verification fails
 */
export declare class VerificationError extends CryptoError {
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when key derivation fails
 */
export declare class KeyDerivationError extends CryptoError {
    constructor(message: string, cause?: Error);
}
//# sourceMappingURL=errors.d.ts.map