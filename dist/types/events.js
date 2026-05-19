import { ValidationError } from './errors.js';
/**
 * Empty hash constant retained for inner compatibility payloads.
 */
export const EMPTY_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
export const EVENT_ENVELOPE_VERSION = '0.2';
/**
 * Creates a hash from a hex string with validation
 */
export function createHash(hex) {
    const normalized = hex.toLowerCase().trim();
    if (!/^[0-9a-f]{64}$/.test(normalized)) {
        throw new InvalidHashError(`Hash must be 64-character hex string, got: ${hex.substring(0, 20)}...`);
    }
    return normalized;
}
export function createEncryptedData(bytes) {
    return bytes;
}
export function createSignature(bytes) {
    return bytes;
}
/**
 * Inner semantic event type discriminator.
 */
export var EventType;
(function (EventType) {
    EventType["CREATE_FILE"] = "CREATE_FILE";
    EventType["DELETE_FILE"] = "DELETE_FILE";
    EventType["RENAME_FILE"] = "RENAME_FILE";
    EventType["DECLARE_IDENTITY"] = "DECLARE_IDENTITY";
    EventType["CHAT_MESSAGE"] = "CHAT_MESSAGE";
    EventType["APP_RECORD"] = "APP_RECORD";
})(EventType || (EventType = {}));
export class InvalidHashError extends ValidationError {
    constructor(message) {
        super(message);
        this.name = 'InvalidHashError';
    }
}
//# sourceMappingURL=events.js.map