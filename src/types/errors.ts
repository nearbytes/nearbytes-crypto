/**
 * Base error class for all domain errors
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error thrown when cryptographic operations fail
 */
export class CryptoError extends DomainError {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends DomainError {
  public readonly cause?: Error;
  constructor(message: string, cause?: Error) {
    super(message);
    this.cause = cause;
  }
}

/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
  }
}

