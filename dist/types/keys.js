import { ValidationError } from './errors.js';
/**
 * Creates a symmetric key from a byte array with validation
 * @param bytes - 32-byte array
 * @returns Branded SymmetricKey
 * @throws InvalidKeyError if bytes length is not 32
 */
export function createSymmetricKey(bytes) {
    if (bytes.length !== 32) {
        throw new InvalidKeyError(`Symmetric key must be 32 bytes, got ${bytes.length}`);
    }
    return bytes;
}
/**
 * Creates a secret from a string with validation
 * @param input - Secret string (e.g., "channelname:password")
 * @returns Branded Secret
 * @throws InvalidSecretError if secret is empty
 */
export function createSecret(input) {
    if (input.length < 1) {
        throw new InvalidSecretError('Secret is required');
    }
    return input;
}
/**
 * Creates a private key from a byte array
 * @param bytes - Private key bytes
 * @returns Branded PrivateKey
 */
export function createPrivateKey(bytes) {
    return bytes;
}
/**
 * Creates a public key from a byte array
 * @param bytes - Public key bytes
 * @returns Branded PublicKey
 */
export function createPublicKey(bytes) {
    return bytes;
}
/**
 * Error thrown when a key is invalid
 */
export class InvalidKeyError extends ValidationError {
    constructor(message) {
        super(message);
        this.name = 'InvalidKeyError';
    }
}
/**
 * Error thrown when a secret is invalid
 */
export class InvalidSecretError extends ValidationError {
    constructor(message) {
        super(message);
        this.name = 'InvalidSecretError';
    }
}
//# sourceMappingURL=keys.js.map