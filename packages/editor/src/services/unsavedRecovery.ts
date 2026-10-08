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

/** The load path found kept work it did not apply. */
export function markUnsavedOffScreen(siteId: string): void {
  offScreen.add(siteId);
}

/** The kept work to restore, once; null when none is waiting off screen. */
export function takeOffScreenUnsaved(siteId: string): UnsavedWork | null {
  if (!offScreen.delete(siteId)) return null;
  return readUnsaved(siteId);
}

/** Keep a snapshot the server refused. Best-effort: a full state is large and
 *  can exceed quota, and failing to keep it must never break the editor the
 *  user is still holding the work in. A no-op once the user discarded this
 *  site's copy (`discardUnsaved`). */
export function keepUnsaved(siteId: string, project: ProjectData): void {
  if (discarded.has(siteId) || offScreen.has(siteId)) return;
  try {
    localStorage.setItem(keyFor(siteId), JSON.stringify({ project, at: new Date().toISOString() }));
  } catch {
    /* quota or storage disabled — the tab still holds the work, and the load
       path simply has nothing extra to report. */
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
  offScreen.delete(siteId);
  clearUnsaved(siteId);
}

/** The discard did not happen after all (the reload was cancelled and the user
 *  chose Overwrite, or a new conflict was raised): keep refused work again.
 *  One site is open per page, so every latch is lifted. */
export function resumeKeepingUnsaved(): void {
  discarded.clear();
}
