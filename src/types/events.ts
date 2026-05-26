import { ValidationError } from './errors.js';

/**
 * Branded type for SHA-256 hashes (64-character hex string)
 */
export type Hash = string & { readonly __brand: 'Hash' };

/**
 * Empty hash constant retained for compatibility (e.g., legacy tests).
 */
export const EMPTY_HASH: Hash = '0000000000000000000000000000000000000000000000000000000000000000' as Hash;

/**
 * Branded type for encrypted data
 */
export type EncryptedData = Uint8Array & { readonly __brand: 'EncryptedData' };

/**
 * Branded type for cryptographic signatures
 */
export type Signature = Uint8Array & { readonly __brand: 'Signature' };

export const EVENT_ENVELOPE_VERSION = '0.2' as const;
export type EventEnvelopeVersion = typeof EVENT_ENVELOPE_VERSION;

/**
 * Creates a hash from a hex string with validation
 */
export function createHash(hex: string): Hash {
  const normalized = hex.toLowerCase().trim();
  if (!/^[0-9a-f]{64}$/.test(normalized)) {
    throw new InvalidHashError(
      `Hash must be 64-character hex string, got: ${hex.substring(0, 20)}...`
    );
  }
  return normalized as Hash;
}

export function createEncryptedData(bytes: Uint8Array): EncryptedData {
  return bytes as EncryptedData;
}

export function createSignature(bytes: Uint8Array): Signature {
  return bytes as Signature;
}

/**
 * Inner semantic event type discriminator.
 *
 * File-system primitives (CREATE_FILE / MKDIR / DELETE / RENAME) are pure
 * syntax: each event carries one full path and no implicit dependencies.
 * The materializer is the sole site of cascade semantics — see
 * `application/file-events-v0.4.md` for the wire schema and replay rules.
 */
export enum EventType {
  CREATE_FILE = 'CREATE_FILE',
  MKDIR = 'MKDIR',
  DELETE = 'DELETE',
  RENAME = 'RENAME',
  DECLARE_IDENTITY = 'DECLARE_IDENTITY',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  APP_RECORD = 'APP_RECORD',
}

/**
 * Content descriptor for file content references.
 * Identifies the ciphertext block(s) storing the file data.
 */
export type ContentDescriptor =
  | { readonly protocol: 'nb.content.single.v1'; readonly blockHash: Hash }
  | { readonly protocol: 'nb.content.manifest.v1'; readonly manifestHash: Hash };

/**
 * Inner payload for CREATE_FILE events (file-events-v0.4).
 * `path` is a `/`-separated string; the protocol does not validate it
 * structurally beyond rejecting the empty string and leading/trailing `/`
 * — the materializer (`nearbytes-files`) enforces the namespace rules.
 */
export interface CreateFilePayload {
  readonly type: EventType.CREATE_FILE;
  /** Full path within the volume (may contain `/`). */
  readonly path: string;
  /** Content descriptor identifying the ciphertext block(s). */
  readonly content: ContentDescriptor;
  /** Data encryption key wrapped with the volume key. */
  readonly wrappedKey: EncryptedData;
  /** Creation timestamp (ms since epoch). */
  readonly createdAt: number;
  readonly mimeType?: string;
}

/**
 * Inner payload for MKDIR events (file-events-v0.4).
 * Creates an *explicit* directory entry at `path`. The materializer
 * cascades by creating every missing ancestor as a directory too;
 * conflicts (an ancestor already a file) reject the whole MKDIR.
 * blockRefs on the outer envelope SHOULD be empty.
 */
export interface MkdirPayload {
  readonly type: EventType.MKDIR;
  readonly path: string;
  readonly createdAt: number;
}

/**
 * Inner payload for DELETE events (file-events-v0.4).
 * Single primitive for both files and directories. When `path` is a
 * directory, the materializer cascades to every descendant (file or dir);
 * confirmation / empty-vs-non-empty is a CLI concern.
 * blockRefs on the outer envelope SHOULD be empty.
 */
export interface DeletePayload {
  readonly type: EventType.DELETE;
  readonly path: string;
  readonly deletedAt: number;
}

/**
 * Inner payload for RENAME events (file-events-v0.4).
 * Single primitive for files and directories. When `fromPath` is a
 * directory, the materializer prefix-swaps every descendant from
 * `fromPath/` to `toPath/`. Conflicts (target exists as different kind,
 * or as a non-empty dir of same kind) reject the rename.
 * blockRefs on the outer envelope SHOULD be empty.
 */
export interface RenamePayload {
  readonly type: EventType.RENAME;
  readonly fromPath: string;
  readonly toPath: string;
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
export type EventPayload =
  | CreateFilePayload
  | MkdirPayload
  | DeletePayload
  | RenamePayload
  | DeclareIdentityPayload
  | ChatMessagePayload
  | AppRecordPayload;

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

export class InvalidHashError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidHashError';
  }
}
