/**
 * Converts a Uint8Array to a hexadecimal string
 * @param bytes - Byte array to convert
 * @returns Hexadecimal string (lowercase)
 */
export declare function bytesToHex(bytes: Uint8Array): string;
/**
 * Converts a hexadecimal string to a Uint8Array
 * @param hex - Hexadecimal string
 * @returns Byte array
 * @throws Error if hex string is invalid
 */
export declare function hexToBytes(hex: string): Uint8Array;
/**
 * Converts a Uint8Array to a base64 string
 * @param bytes - Byte array to convert
 * @returns Base64 string
 */
export declare function bytesToBase64(bytes: Uint8Array): string;
/**
 * Converts a Uint8Array to a base64url string without padding.
 * @param bytes - Byte array to convert
 * @returns Base64url string
 */
export declare function bytesToBase64Url(bytes: Uint8Array): string;
/**
 * Converts a base64 string to a Uint8Array
 * @param base64 - Base64 string
 * @returns Byte array
 * @throws Error if base64 string is invalid
 */
export declare function base64ToBytes(base64: string): Uint8Array;
/**
 * Converts a base64url string to a Uint8Array
 * @param base64url - Base64url string (uses - and _ instead of + and /)
 * @returns Byte array
 * @throws Error if base64url string is invalid
 */
export declare function base64UrlToBytes(base64url: string): Uint8Array;
//# sourceMappingURL=encoding.d.ts.map