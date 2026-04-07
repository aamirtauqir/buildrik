/**
 * Aquibra Helpers - Storage Utilities
 * Local storage with expiry and JSON support
 *
 * @module utils/helpers/storage
 * @license BSD-3-Clause
 */

// =============================================================================
// STORAGE
// =============================================================================

/**
 * Local storage with expiry and JSON support
 */
export const storage = {
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);

      // Check expiry
      if (parsed._expires && Date.now() > parsed._expires) {
        localStorage.removeItem(key);
        return defaultValue;
      }

      return parsed._value !== undefined ? parsed._value : parsed;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T, expiryMs?: number): void {
    try {
      const item = expiryMs ? { _value: value, _expires: Date.now() + expiryMs } : value;
      localStorage.setItem(key, JSON.stringify(item));
    } catch {
      // Storage full or unavailable
    }
  },

  remove(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};
