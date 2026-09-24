/**
 * Recently-run ⌘K commands (S3.14, restored 2026-09-24 under the owner's
 * "never silently remove a capability" rule). A small localStorage MRU of
 * palette row ids, newest first, so the empty palette can lead with what you
 * just did. safeStorage keeps private-mode / quota failures silent.
 *
 * @license BSD-3-Clause
 */
import { safeGet, safeSet } from "@/shared/utils/safeStorage";

const KEY = "buildrick:command-recents";
const MAX = 5;

/** The most-recently-run command ids, newest first. Empty on any parse failure. */
export function getRecentCommandIds(): string[] {
  const raw = safeGet(KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

/** Record a command as just-run: move it to the front, dedupe, cap at MAX. */
export function recordCommandRun(id: string): void {
  if (!id) return;
  const next = [id, ...getRecentCommandIds().filter((x) => x !== id)].slice(0, MAX);
  safeSet(KEY, JSON.stringify(next));
}
