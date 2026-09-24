/**
 * layersPersistence - where layer states live.
 *
 * A layer's custom NAME and its LOCK belong to the element and are saved with
 * the project (C5 G2-061 / G2-065): the name in `data.layerName`, the lock in
 * `locked`. `getLayerName` is the one reader, `renameElement` the one writer.
 *
 * Per-browser view state stays in localStorage, per page:
 * - `buildrick-layers-{pageId}-hidden`: string[] (dimmed-in-editor ids)
 * - `buildrick-layers-{pageId}-expanded`: string[] (open tree rows)
 * The old `-locked` and `-names` keys are read once, to migrate them into the
 * elements, then removed (`takeLegacyLayerState`).
 *
 * @license BSD-3-Clause
 */

import { EVENTS } from "@/shared/constants/events";

const STORAGE_PREFIX = "buildrick-layers";

/** Get storage key for a specific page and data type */
export function getStorageKey(
  pageId: string,
  type: "hidden" | "locked" | "names" | "expanded"
): string {
  return `${STORAGE_PREFIX}-${pageId}-${type}`;
}

/** Whether this page has a stored set of that type at all (vs. an empty one). */
export function hasStoredSet(pageId: string, type: "hidden" | "expanded"): boolean {
  try {
    return localStorage.getItem(getStorageKey(pageId, type)) !== null;
  } catch {
    return false;
  }
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

/** The element-data key that holds a layer's custom name. */
export const LAYER_NAME_KEY = "layerName";

/** A layer's custom name, or undefined — read from the element's own data. */
export function getLayerName(el: { getCustomData(key: string): unknown } | null | undefined): string | undefined {
  const v = el?.getCustomData(LAYER_NAME_KEY);
  return typeof v === "string" && v ? v : undefined;
}

/** The one writer of a layer's custom name (Layers' rename and the inspector
 *  header's, G2-139): trimmed, empty clears it back to the type label, saved
 *  with the project, and announced so every surface showing the name follows. */
export function renameElement(
  composer: {
    elements: { getElement(id: string): { setData(key: string, value: unknown): void } | null | undefined };
    markDirty(): void;
    emit(event: string, payload: unknown): void;
  } | null | undefined,
  id: string,
  name: string,
): void {
  if (!composer) return;
  const trimmed = name.trim();
  const el = composer.elements.getElement(id);
  if (el) {
    el.setData(LAYER_NAME_KEY, trimmed || undefined);
    composer.markDirty();
  }
  composer.emit(EVENTS.ELEMENT_RENAMED, { id, name: trimmed || null });
}

/** Read and REMOVE the pre-G2-061 per-browser names / locked keys. */
export function takeLegacyLayerState(pageId: string): { names: Map<string, string>; locked: Set<string> } {
  const names = loadMapFromStorage(pageId);
  const locked = loadSetFromStorage(pageId, "locked");
  try {
    localStorage.removeItem(getStorageKey(pageId, "names"));
    localStorage.removeItem(getStorageKey(pageId, "locked"));
  } catch {
    // storage disabled — nothing to remove
  }
  return { names, locked };
}

/** Safely load Map from localStorage */
function loadMapFromStorage(pageId: string): Map<string, string> {
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

/** Apply stored hidden/locked states to canvas DOM elements */
export function applyStoredStatesToDOM(hiddenIds: Set<string>, lockedIds: Set<string>): void {
  hiddenIds.forEach((id) => {
    const el = document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement;
    if (el) el.setAttribute("data-hidden", "true");
  });
  lockedIds.forEach((id) => {
    const el = document.querySelector(`[data-buildrick-id="${id}"]`) as HTMLElement;
    if (el) el.setAttribute("data-locked", "true");
  });
}
