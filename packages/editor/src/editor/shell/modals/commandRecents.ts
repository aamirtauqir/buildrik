/**
 * Recently-run command tracking for the command palette (S3.14). A small
 * localStorage-backed MRU list of command ids, so ⌘K can surface "what you just
 * did" before you type. Read/write go through safeStorage (private-mode /
 * quota-safe). Kept separate from CommandPalette so the palette component stays
 * pure UI and this is unit-testable without a DOM render.
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
    const parsed = JSON.parse(raw);
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
