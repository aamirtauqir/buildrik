/**
 * Storage Keys - Re-export from config.ts for backward compatibility
 * @deprecated Import STORAGE_KEYS from constants/config.ts instead
 * @license BSD-3-Clause
 */

// Re-export from canonical location
export { STORAGE_KEYS, type StorageKey } from "./storageKeys";

/**
 * Helper to get typed item from localStorage
 */
export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

/**
 * Helper to set typed item in localStorage
 */
export function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail if localStorage is full or disabled
  }
}

/**
 * Helper to remove item from localStorage
 */
export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}
