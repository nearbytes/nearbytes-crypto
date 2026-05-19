import { computeHash } from './hash.js';
import { generateSymmetricKey, encryptSym, decryptSym } from './symmetric.js';
import { deriveKeys, signPR, verifyPU, deriveSymKey } from './asymmetric.js';
/**
 * Gets the Web Crypto API SubtleCrypto instance
 * Works in both browser and Node.js environments
 */
function getCryptoSubtle() {
    // Try globalThis.crypto first (browser, Node.js 18+)
    if (globalThis.crypto?.subtle) {
        return globalThis.crypto.subtle;
    }
    throw new Error('Web Crypto API not available');
}
/**
 * Creates a concrete implementation of CryptoOperations using Web Crypto API
 * @returns CryptoOperations implementation
 * @throws Error if Web Crypto API is not available
 */
export function createCryptoOperations() {
    // Verify Web Crypto API is available (should be set up by test setup file in test env)
    const crypto = getCryptoSubtle();
    if (!crypto) {
        throw new Error('Web Crypto API not available');
    }
    return {
        computeHash,
        generateSymmetricKey,
        encryptSym,
        decryptSym,
        deriveKeys,
        signPR,
        verifyPU,
        deriveSymKey,
    };
}
//# sourceMappingURL=index.js.map