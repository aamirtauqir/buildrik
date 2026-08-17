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

/** Board 162:2's row title. */
export function versionDisplayName(name: string): string {
  return /^Auto:\s/.test(name) ? "Auto-save" : name;
}
