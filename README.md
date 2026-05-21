# nearbytes-crypto

Core cryptographic primitives for the Nearbytes protocol.

## What's inside

- **Branded types** — `Hash`, `EncryptedData`, `Signature`, `SymmetricKey`, `PrivateKey`, `PublicKey`, `Secret`
- **`CryptoOperations`** — interface covering hashing (SHA-256), symmetric encryption (AES-256-GCM), asymmetric signing (ECDSA P-256), and key derivation (PBKDF2/HKDF)
- **`createCryptoOperations()`** — factory backed by the Web Crypto API; works in both browser and Node.js ≥ 18
- **Event payload types** — discriminated union `EventPayload` (`CreateFilePayload`, `DeleteFilePayload`, `RenameFilePayload`, …)
- **Encoding utilities** — `bytesToHex`, `hexToBytes`, `bytesToBase64`, `base64ToBytes`, and URL-safe variants

## Install

```sh
yarn add nearbytes/nearbytes-crypto#main
```

## Quick start

```ts
import { createCryptoOperations, createSecret } from 'nearbytes-crypto';

const crypto = createCryptoOperations();
const keyPair = await crypto.deriveKeys(createSecret('myvol:password'));
console.log(keyPair.publicKey); // Uint8Array (65 bytes, uncompressed P-256)
```

## Package structure

```
src/
  types/
    keys.ts      — SymmetricKey, PrivateKey, PublicKey, Secret, KeyPair
    events.ts    — Hash, EncryptedData, Signature, EventPayload union, EventEnvelope, SignedEvent
    errors.ts    — DomainError, CryptoError, StorageError, ValidationError
  crypto/
    index.ts     — CryptoOperations interface + createCryptoOperations()
    asymmetric.ts — deriveKeys, signPR, verifyPU, deriveSymKey
    symmetric.ts — generateSymmetricKey, encryptSym, decryptSym
    hash.ts      — computeHash
    errors.ts    — KeyDerivationError, EncryptionError, DecryptionError, …
  utils/
    encoding.ts  — bytesToHex/Hex, bytesToBase64/Url, base64ToBytes/Url
```
