/**
 * What a saved version is CALLED on screen.
 *
 * Auto-checkpoints are stored as `Auto: ${eventName}` — the engine's own event
 * id — so the Saves list printed rows reading "Auto: project:loaded" at users.
 * That is an internal identifier, and the same one seven times in a row on a
 * session with seven opens. Board 162:2 calls every auto-save "Auto-save" and
 * distinguishes them by their time and change count, which is what a person
 * can actually use.
 *
 * Display-only: the stored name keeps the trigger, so the engine has not lost
 * anything and a support question about WHICH event fired is still answerable
 * from storage.
 *
 * @license BSD-3-Clause
 */

/**
 * Board 162:2's row title.
 *
 * Reads the MODEL, not the string. This sniffed `/^Auto:\s/` until 2026-08-24,
 * which meant a version a person deliberately named "Auto: launch checklist"
 * was silently relabelled "Auto-save" — a user's own words overwritten because
 * they happened to start with a prefix the engine also uses. `NamedVersion`
 * carries `isAutoCheckpoint`, so the guess was never needed. Codex caught the
 * collapse while reviewing the label fix; the prefix test was the real bug
 * underneath it.
 */
export function versionDisplayName(version: {
  name: string;
  isAutoCheckpoint?: boolean;
}): string {
  return version.isAutoCheckpoint ? "Auto-save" : version.name;
}
