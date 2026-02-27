/**
 * Aquibra Helpers - ID Generation
 * Utilities for generating unique identifiers
 *
 * @module utils/helpers/id
 * @license BSD-3-Clause
 */

// =============================================================================
// CORE ID GENERATION
// =============================================================================

/**
 * Core ID generator with cryptographic randomness
 * All other ID functions delegate to this
 */
export function generateId(prefix: string = "aqb"): string {
  const timestamp = Date.now().toString(36);
  let random: string;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    random = array[0].toString(36) + array[1].toString(36).substring(0, 4);
  } else {
    random = Math.random().toString(36).substring(2, 8);
  }
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate UUID v4 - use when you need standard UUID format
 */
export function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generate nano ID (shorter, URL-safe) - use for compact IDs
 */
export function nanoId(size: number = 21): string {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
  const bytes = new Uint8Array(size);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  let id = "";
  for (let i = 0; i < size; i++) {
    id += alphabet[bytes[i] & 63];
  }
  return id;
}

/**
 * Create a sequential ID generator
 */
export function createSequentialId(prefix: string = "", start: number = 1): () => string {
  let counter = start;
  return () => `${prefix}${counter++}`;
}

/**
 * Generate a short hash from a string
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
