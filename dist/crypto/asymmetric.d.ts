import type { Secret, KeyPair, PrivateKey, PublicKey, SymmetricKey } from '../types/keys.js';
import type { Signature } from '../types/events.js';
/**
 * Derives a deterministic key pair from a secret using PBKDF2
 * Public key derivation uses direct P-256 point multiplication from the private
 * scalar so the result stays deterministic across engines without depending on
 * browser-specific PKCS#8 import behavior.
 * @param secret - Channel secret string
 * @returns KeyPair with public and private keys
 * @throws KeyDerivationError if key derivation fails
 */
export declare function deriveKeys(secret: Secret): Promise<KeyPair>;
/**
 * Signs data using ECDSA P-256
 * @param data - Data to sign
 * @param privateKey - Private key scalar (32 bytes)
 * @returns Signature
 * @throws SigningError if signing fails
 */
export declare function signPR(data: Uint8Array, privateKey: PrivateKey): Promise<Signature>;
/**
 * Verifies a signature using ECDSA P-256
 * @param data - Original data
 * @param signature - Signature to verify
 * @param publicKey - Public key (65 bytes: 0x04 + x + y)
 * @returns True if signature is valid
 * @throws VerificationError if verification fails
 */
export declare function verifyPU(data: Uint8Array, signature: Signature, publicKey: PublicKey): Promise<boolean>;
/**
 * Derives a symmetric key from a private key using HKDF
 * @param privateKey - Private key scalar
 * @returns 32-byte symmetric key
 * @throws KeyDerivationError if derivation fails
 */
export declare function deriveSymKey(privateKey: PrivateKey): Promise<SymmetricKey>;
//# sourceMappingURL=asymmetric.d.ts.map