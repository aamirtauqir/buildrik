/**
 * layersPersistence - localStorage persistence for layer states
 *
 * Handles saving/loading hidden, locked, and custom name states
 * to localStorage. States are stored per-page using the page ID.
 *
 * Storage format:
 * - `aqb-layers-{pageId}-hidden`: string[] (array of hidden element IDs)
 * - `aqb-layers-{pageId}-locked`: string[] (array of locked element IDs)
 * - `aqb-layers-{pageId}-names`: Record<string, string> (custom names map)
 *
 * @license BSD-3-Clause
 */

const STORAGE_PREFIX = "aqb-layers";

/** Get storage key for a specific page and data type */
export function getStorageKey(
  pageId: string,
  type: "hidden" | "locked" | "names" | "expanded"
): string {
  return `${STORAGE_PREFIX}-${pageId}-${type}`;
}

/** Safely load Set from localStorage */
export function loadSetFromStorage(
  pageId: string,
  type: "hidden" | "locked" | "expanded"
): Set<string> {
  try {
    const stored = localStorage.getItem(getStorageKey(pageId, type));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch {
    // Silently fail - return empty set
  }
  return new Set();
}

/** Safely load Map from localStorage */
export function loadMapFromStorage(pageId: string): Map<string, string> {
  try {
    const stored = localStorage.getItem(getStorageKey(pageId, "names"));
    if (stored) {
      const parsed = JSON.parse(stored);
      if (typeof parsed === "object" && parsed !== null) {
        return new Map(Object.entries(parsed));
      }
    }
  } catch {
    // Silently fail - return empty map
  }
  return new Map();
}

/** Save Set to localStorage */
export function saveSetToStorage(
  pageId: string,
  type: "hidden" | "locked" | "expanded",
  data: Set<string>
): void {
  try {
    localStorage.setItem(getStorageKey(pageId, type), JSON.stringify([...data]));
  } catch {
    // localStorage might be full or disabled - silently fail
  }
}

/** Save Map to localStorage */
export function saveMapToStorage(pageId: string, data: Map<string, string>): void {
  try {
    localStorage.setItem(getStorageKey(pageId, "names"), JSON.stringify(Object.fromEntries(data)));
  } catch {
    // localStorage might be full or disabled - silently fail
  }
}

/** Apply stored hidden/locked states to canvas DOM elements */
export function applyStoredStatesToDOM(hiddenIds: Set<string>, lockedIds: Set<string>): void {
  hiddenIds.forEach((id) => {
    const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
    if (el) el.setAttribute("data-hidden", "true");
  });
  lockedIds.forEach((id) => {
    const el = document.querySelector(`[data-aqb-id="${id}"]`) as HTMLElement;
    if (el) el.setAttribute("data-locked", "true");
  });
}
