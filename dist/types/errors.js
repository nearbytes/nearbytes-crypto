/**
 * Base error class for all domain errors
 */
export class DomainError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
/**
 * Error thrown when cryptographic operations fail
 */
export class CryptoError extends DomainError {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}
/**
 * Error thrown when storage operations fail
 */
export class StorageError extends DomainError {
    constructor(message, cause) {
        super(message);
        this.cause = cause;
    }
}
/**
 * Error thrown when validation fails
 */
export class ValidationError extends DomainError {
    constructor(message) {
        super(message);
    }
}
//# sourceMappingURL=errors.js.map