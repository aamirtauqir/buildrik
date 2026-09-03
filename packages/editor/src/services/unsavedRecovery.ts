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

/** Keep a snapshot the server refused. Best-effort: a full state is large and
 *  can exceed quota, and failing to keep it must never break the editor the
 *  user is still holding the work in. */
export function keepUnsaved(siteId: string, project: ProjectData): void {
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
  try {
    localStorage.removeItem(keyFor(siteId));
  } catch {
    /* nothing to do — a stale record only ever causes an offer, never a write */
  }
}
