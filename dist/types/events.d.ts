import { ValidationError } from './errors.js';
/**
 * Branded type for SHA-256 hashes (64-character hex string)
 */
export type Hash = string & {
    readonly __brand: 'Hash';
};
/**
 * Empty hash constant retained for inner compatibility payloads.
 */
export declare const EMPTY_HASH: Hash;
/**
 * Branded type for encrypted data
 */
export type EncryptedData = Uint8Array & {
    readonly __brand: 'EncryptedData';
};
/**
 * Branded type for cryptographic signatures
 */
export type Signature = Uint8Array & {
    readonly __brand: 'Signature';
};
export declare const EVENT_ENVELOPE_VERSION: "0.2";
export type EventEnvelopeVersion = typeof EVENT_ENVELOPE_VERSION;
/**
 * Creates a hash from a hex string with validation
 */
export declare function createHash(hex: string): Hash;
export declare function createEncryptedData(bytes: Uint8Array): EncryptedData;
export declare function createSignature(bytes: Uint8Array): Signature;
/**
 * Inner semantic event type discriminator.
 */
export declare enum EventType {
    CREATE_FILE = "CREATE_FILE",
    DELETE_FILE = "DELETE_FILE",
    RENAME_FILE = "RENAME_FILE",
    DECLARE_IDENTITY = "DECLARE_IDENTITY",
    CHAT_MESSAGE = "CHAT_MESSAGE",
    APP_RECORD = "APP_RECORD"
}
/**
 * Inner encrypted event payload structure.
 */
export interface EventPayload {
    readonly type: EventType;
    readonly fileName: string;
    readonly toFileName?: string;
    readonly hash: Hash;
    readonly encryptedKey: EncryptedData;
    readonly contentType?: 'b' | 'm';
    readonly size?: number;
    readonly mimeType?: string;
    readonly createdAt?: number;
    readonly deletedAt?: number;
    readonly renamedAt?: number;
    readonly authorPublicKey?: string;
    readonly protocol?: string;
    readonly record?: string;
    readonly message?: string;
    readonly publishedAt?: number;
}
/**
 * Outer visible event envelope.
 */
export interface EventEnvelope {
    readonly version: EventEnvelopeVersion;
    readonly publicKey: string;
    readonly blockRefs: readonly Hash[];
    readonly ciphertext: EncryptedData;
}
/**
 * Stored signed event. The semantic payload is encrypted — no cleartext here.
 */
export interface SignedEvent {
    readonly envelope: EventEnvelope;
    readonly signature: Signature;
}
/**
 * In-memory decrypted event: a SignedEvent with the plaintext payload attached.
 * This type lives at the domain layer — the log never produces or consumes it.
 */
export interface DecryptedEvent extends SignedEvent {
    readonly payload: EventPayload;
}
/**
 * JSON-serializable stored event format.
 */
export interface SerializedEvent {
    readonly envelope: {
        readonly version: EventEnvelopeVersion;
        readonly publicKey: string;
        readonly blockRefs: readonly string[];
        readonly ciphertext: string;
    };
    readonly signature: string;
}
/**
 * JSON-serializable decrypted payload format used only in trusted local APIs/tests.
 */
export interface SerializedEventPayload {
    readonly type: string;
    readonly fileName: string;
    readonly toFileName?: string;
    readonly hash: string;
    readonly encryptedKey: string;
    readonly contentType?: 'b' | 'm';
    readonly size?: number;
    readonly mimeType?: string;
    readonly createdAt?: number;
    readonly deletedAt?: number;
    readonly renamedAt?: number;
    readonly authorPublicKey?: string;
    readonly protocol?: string;
    readonly record?: string;
    readonly message?: string;
    readonly publishedAt?: number;
}
export declare class InvalidHashError extends ValidationError {
    constructor(message: string);
}
//# sourceMappingURL=events.d.ts.map