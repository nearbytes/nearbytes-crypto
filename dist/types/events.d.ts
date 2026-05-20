import { ValidationError } from './errors.js';
/**
 * Branded type for SHA-256 hashes (64-character hex string)
 */
export type Hash = string & {
    readonly __brand: 'Hash';
};
/**
 * Empty hash constant retained for compatibility (e.g., legacy tests).
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
 * Content descriptor for file content references.
 * Identifies the ciphertext block(s) storing the file data.
 */
export type ContentDescriptor = {
    readonly protocol: 'nb.content.single.v1';
    readonly blockHash: Hash;
} | {
    readonly protocol: 'nb.content.manifest.v1';
    readonly manifestHash: Hash;
};
/**
 * Inner payload for CREATE_FILE events (file-events-v0.3).
 */
export interface CreateFilePayload {
    readonly type: EventType.CREATE_FILE;
    /** Filename within the volume */
    readonly filename: string;
    /** Content descriptor identifying the ciphertext block(s) */
    readonly content: ContentDescriptor;
    /** Data encryption key wrapped with the volume key */
    readonly wrappedKey: EncryptedData;
    /** Creation timestamp (ms since epoch) */
    readonly createdAt: number;
    readonly mimeType?: string;
}
/**
 * Inner payload for DELETE_FILE events (file-events-v0.3).
 * blockRefs on the outer envelope SHOULD be empty.
 */
export interface DeleteFilePayload {
    readonly type: EventType.DELETE_FILE;
    readonly filename: string;
    /** Deletion timestamp (ms since epoch) */
    readonly deletedAt: number;
}
/**
 * Inner payload for RENAME_FILE events (file-events-v0.3).
 * blockRefs on the outer envelope SHOULD be empty.
 */
export interface RenameFilePayload {
    readonly type: EventType.RENAME_FILE;
    readonly filename: string;
    readonly toFilename: string;
    /** Rename timestamp (ms since epoch) */
    readonly renamedAt: number;
}
/**
 * Inner payload for DECLARE_IDENTITY events (app layer).
 */
export interface DeclareIdentityPayload {
    readonly type: EventType.DECLARE_IDENTITY;
    readonly record?: string;
    readonly authorPublicKey?: string;
    readonly publishedAt?: number;
}
/**
 * Inner payload for CHAT_MESSAGE events (app layer).
 */
export interface ChatMessagePayload {
    readonly type: EventType.CHAT_MESSAGE;
    readonly message?: string;
    readonly authorPublicKey?: string;
    readonly publishedAt?: number;
}
/**
 * Inner payload for APP_RECORD events (app layer).
 */
export interface AppRecordPayload {
    readonly type: EventType.APP_RECORD;
    readonly protocol: string;
    readonly record: string;
    readonly authorPublicKey: string;
    readonly publishedAt: number;
}
/**
 * Discriminated union of all inner encrypted event payload types.
 */
export type EventPayload = CreateFilePayload | DeleteFilePayload | RenameFilePayload | DeclareIdentityPayload | ChatMessagePayload | AppRecordPayload;
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
 * JSON-serializable inner event payload (binary fields base64-encoded).
 * Used only in trusted local APIs and tests.
 */
export type SerializedEventPayload = Record<string, unknown>;
export declare class InvalidHashError extends ValidationError {
    constructor(message: string);
}
//# sourceMappingURL=events.d.ts.map