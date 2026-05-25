/**
 * Base error class for all domain errors
 */
export declare class DomainError extends Error {
    constructor(message: string);
}
/**
 * Error thrown when cryptographic operations fail
 */
export declare class CryptoError extends DomainError {
    readonly cause?: Error;
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when storage operations fail
 */
export declare class StorageError extends DomainError {
    readonly cause?: Error;
    constructor(message: string, cause?: Error);
}
/**
 * Error thrown when validation fails
 */
export declare class ValidationError extends DomainError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map