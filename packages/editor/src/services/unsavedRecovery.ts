/**
 * Work that failed to reach the server, kept across a reload.
 *
 * A save to a dashboard-backed site is a bare RPC: nothing local is written,
 * so when it fails the edit exists only in the tab. The user IS warned at the
 * time — the topbar reads "Save failed — retry" — but that warning has no
 * persistence, and on reload the load path seeds `lastSavedAt` because "the
 * just-loaded state IS the persisted state". Measured 2026-09-03: an H2 sized
 * 24 -> 41px, the save blocked, reload, font-size back to 24 and the topbar
 * reading "Saved · just now" over an edit the product discarded.
 *
 * This keeps the snapshot so the reload has something truthful to say. It is
 * deliberately NOT applied automatically: importing a stored project over a
 * freshly loaded one is the documented data-loss precondition in this codebase
 * (a failed load plus one autosave once wiped a site), and a recovery that can
 * itself destroy work is not a recovery. The user is told and chooses.
 *
 * @license BSD-3-Clause
 */

import type { ProjectData } from "@shared/types";

const KEY_PREFIX = "bk-unsaved-v1-";

/* Keyed by site. Sharing one slot across sites is the same defect the page
   folders had, and here it would offer one site's work to another. */
const keyFor = (siteId: string) => KEY_PREFIX + siteId;

export interface UnsavedWork {
  project: ProjectData;
  /** When the save that failed was attempted. */
  at: string;
  /** The server's `lastEditedAt` these edits were made on top of (the CAS
   *  token at the time). Absent on records written before it existed. */
  base?: string | null;
}

/**
 * How the kept work relates to the server copy that just loaded (OV-1, R1):
 *   unchanged     — the server is still the version the edits were based on,
 *                   so restoring them loses nobody's work;
 *   server-newer  — someone saved since: restoring would replace their work;
 *   unknown       — a record with no base (older shape) or no loaded token:
 *                   treated as possibly conflicting (always ask).
 * The attempt time (`at`) is never the test: a teammate can save after it.
 */
export type KeptVsServer = "unchanged" | "server-newer" | "unknown";

export function compareKeptToServer(kept: UnsavedWork, loadedToken: string | null): KeptVsServer {
  if (!kept.base || !loadedToken) return "unknown";
  return Date.parse(loadedToken) === Date.parse(kept.base) ? "unchanged" : "server-newer";
}

/* Sites whose kept copy the user threw away in this page (conflict → Reload
   latest / Save a backup). The reload is not instant: a debounced autosave
   still inside its conflict hold can fire between the choice and the unload
   and would keep the behind copy again — which the reload then offers back,
   and Restore would save over the teammate's work with the fresh token.
   The reload CAN be cancelled (the unsaved-changes prompt) and the page lives
   on, so the latch is lifted again by `resumeKeepingUnsaved` — on Overwrite
   and on any new conflict — or a failed Overwrite would have nowhere to keep
   the tab-only edit. */
const discarded = new Set<string>();

/* L5-074: sites whose kept copy came from an earlier page load and is not on
   screen — the screen is the server's copy. A save of the screen is not a
   save of this work: it must neither clear the copy ("on the server now") nor
   overwrite it with the screen, or Retry / the next autosave deletes the
   edits. The copy is handed over once (`takeOffScreenUnsaved`) to be restored
   and saved; after that the usual rules apply. */
const offScreen = new Set<string>();

/* EDT-018: whoever offers the off-screen copy back ("Restore my edits") hears
   when that offer is spent — the copy handed over or thrown away — so the
   offer does not outlive it. */
const settledListeners = new Map<string, Set<() => void>>();

function settleOffScreen(siteId: string): boolean {
  if (!offScreen.delete(siteId)) return false;
  const listeners = settledListeners.get(siteId);
  settledListeners.delete(siteId);
  listeners?.forEach((l) => l());
  return true;
}

/** Run `onSettled` once this site's off-screen copy is handed over or
 *  discarded. Returns an unsubscribe. */
export function onOffScreenSettled(siteId: string, onSettled: () => void): () => void {
  let listeners = settledListeners.get(siteId);
  if (!listeners) settledListeners.set(siteId, (listeners = new Set()));
  listeners.add(onSettled);
  return () => {
    settledListeners.get(siteId)?.delete(onSettled);
  };
}

/** The load path found kept work it did not apply. */
export function markUnsavedOffScreen(siteId: string): void {
  offScreen.add(siteId);
}

/** Asks the shell to offer this site's off-screen copy back (the restore
 *  variant of ConflictModal). detail: { siteId }. */
export const RESTORE_OFFER_EVENT = "buildrik:restore-offer";

/** The kept work waiting off screen, without handing it over; null if none. */
export function peekOffScreenUnsaved(siteId: string): UnsavedWork | null {
  return offScreen.has(siteId) ? readUnsaved(siteId) : null;
}

/** The kept work to restore, once; null when none is waiting off screen. */
export function takeOffScreenUnsaved(siteId: string): UnsavedWork | null {
  if (!settleOffScreen(siteId)) return null;
  return readUnsaved(siteId);
}

/** Fired on `window` when a refused snapshot could not be kept (quota or
 *  storage disabled). detail: { siteId }. The shell tells the user the work
 *  now lives only in this tab. */
export const UNSAVED_KEEP_FAILED_EVENT = "buildrik:unsaved-keep-failed";

/** Keep a snapshot the server refused. Best-effort: a full state is large and
 *  can exceed quota, and failing to keep it must never break the editor the
 *  user is still holding the work in — but it is reported, because the user
 *  is then one closed tab away from losing it. A no-op once the user discarded
 *  this site's copy (`discardUnsaved`). */
export function keepUnsaved(siteId: string, project: ProjectData, base: string | null): void {
  if (discarded.has(siteId) || offScreen.has(siteId)) return;
  try {
    const record: UnsavedWork = { project, at: new Date().toISOString(), base };
    localStorage.setItem(keyFor(siteId), JSON.stringify(record));
  } catch {
    window.dispatchEvent(new CustomEvent(UNSAVED_KEEP_FAILED_EVENT, { detail: { siteId } }));
  }
}

export function readUnsaved(siteId: string): UnsavedWork | null {
  try {
    const raw = localStorage.getItem(keyFor(siteId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UnsavedWork;
    /* A half-written or older-shaped record is not work, and offering to
       restore one would be worse than saying nothing. */
    return parsed?.project?.pages ? parsed : null;
  } catch {
    return null;
  }
}

export function clearUnsaved(siteId: string): void {
  if (offScreen.has(siteId)) return;
  try {
    localStorage.removeItem(keyFor(siteId));
  } catch {
    /* nothing to do — a stale record only ever causes an offer, never a write */
  }
}

/** The user chose to throw this site's local copy away: remove the kept
 *  record, and refuse to keep another for the rest of this page's life. */
export function discardUnsaved(siteId: string): void {
  discarded.add(siteId);
  settleOffScreen(siteId);
  clearUnsaved(siteId);
}

/** The discard did not happen after all (the reload was cancelled and the user
 *  chose Overwrite, or a new conflict was raised): keep refused work again.
 *  One site is open per page, so every latch is lifted. */
export function resumeKeepingUnsaved(): void {
  discarded.clear();
}
