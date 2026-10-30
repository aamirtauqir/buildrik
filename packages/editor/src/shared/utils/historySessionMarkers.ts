/**
 * The two session events the History › Session list draws between its steps
 * (2L9 B7-H01 `230:12999`): "— Opened {page} —" and "— Undo history cleared
 * HH:MM —". The undo stack records neither, so this keeps them, one log per
 * Composer, for as long as the editor is open (a reload clears it, as it
 * clears the stack the markers sit in).
 *
 * Both are recorded only from facts:
 * - a page open is PAGE_CHANGED, checked after the current task settles —
 *   undo/redo re-imports the project, which flips to the first page and back
 *   synchronously; only a page that is still active afterwards, and differs
 *   from the last one recorded, was opened;
 * - a clear is recorded by the user's own clear actions (`recordHistoryCleared`)
 *   and not off HISTORY_CLEARED, which the editor's bootstrap also emits when
 *   it wipes its loading states — that is not something the user did.
 *
 * @license BSD-3-Clause
 */

import type { Composer } from "@/engine";
import { EVENTS } from "../constants/events";

export type HistorySessionMarker =
  | { kind: "page"; pageId: string; pageName: string; at: number }
  | { kind: "cleared"; at: number };

interface MarkerLog {
  markers: HistorySessionMarker[];
  listeners: Set<() => void>;
}

const logs = new WeakMap<Composer, MarkerLog>();
/* One empty list, so a store read with no log yet is referentially stable. */
const NONE: readonly HistorySessionMarker[] = [];

function notify(log: MarkerLog): void {
  log.markers = [...log.markers];
  log.listeners.forEach((fn) => fn());
}

function recordActivePage(composer: Composer, log: MarkerLog): void {
  const page = composer.elements?.getActivePage?.();
  if (!page) return;
  const last = [...log.markers].reverse().find((m) => m.kind === "page");
  if (last?.kind === "page" && last.pageId === page.id) return;
  log.markers.push({ kind: "page", pageId: page.id, pageName: page.name, at: Date.now() });
  notify(log);
}

/**
 * Starts the log for this Composer (idempotent). The history bridge calls it,
 * so it runs from the moment the editor header mounts.
 */
export function trackHistorySessionMarkers(composer: Composer): void {
  if (logs.has(composer)) return;
  const log: MarkerLog = { markers: [], listeners: new Set() };
  logs.set(composer, log);
  recordActivePage(composer, log);
  composer.on?.(EVENTS.PAGE_CHANGED, () => {
    setTimeout(() => recordActivePage(composer, log), 0);
  });
}

/**
 * Called by the user's clear actions, right before `history.clear()`. The
 * steps before the clear are gone, so the page opens before it go too —
 * except the page still open, which heads the steps made after the clear.
 */
export function recordHistoryCleared(composer: Composer): void {
  trackHistorySessionMarkers(composer);
  const log = logs.get(composer)!;
  const current = [...log.markers].reverse().find((m) => m.kind === "page");
  log.markers = current ? [current] : [];
  log.markers.push({ kind: "cleared", at: Date.now() });
  notify(log);
}

export function getHistorySessionMarkers(composer: Composer): readonly HistorySessionMarker[] {
  return logs.get(composer)?.markers ?? NONE;
}

export function subscribeHistorySessionMarkers(composer: Composer, fn: () => void): () => void {
  trackHistorySessionMarkers(composer);
  const log = logs.get(composer)!;
  log.listeners.add(fn);
  return () => log.listeners.delete(fn);
}
