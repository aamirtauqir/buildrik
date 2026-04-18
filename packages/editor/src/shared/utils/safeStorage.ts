/**
 * safeStorage — localStorage wrappers that never throw.
 * Guards against: SSR (no window), storage disabled, quota exceeded, JSON corruption upstream.
 * Returns null/false on any failure instead of bubbling exceptions.
 *
 * @license BSD-3-Clause
 */

const hasStorage = (): boolean => {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
};

export function safeGet(key: string): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function safeSet(key: string, value: string): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key: string): boolean {
  if (!hasStorage()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}
