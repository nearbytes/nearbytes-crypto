import { CryptoError } from '../types/errors.js';

/**
 * Error thrown when hash computation fails
 */
export class HashError extends CryptoError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when encryption fails
 */
export class EncryptionError extends CryptoError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when decryption fails
 */
export class DecryptionError extends CryptoError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when signing fails
 */
export class SigningError extends CryptoError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when signature verification fails
 */
export class VerificationError extends CryptoError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

/**
 * Error thrown when key derivation fails
 */
export class KeyDerivationError extends CryptoError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
  }
}

