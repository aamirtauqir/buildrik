/**
 * cmsWorkspaceStore — which collection (and which of its tabs / records) the
 * CMS workspace shows.
 *
 * Board 4428:140486: rail CMS keeps the CMS drawer on the left and replaces
 * the canvas + inspector with the workspace. The drawer's COLLECTIONS rows
 * choose what the workspace shows, and the two live in different shell slots
 * (LeftSidebar vs the canvas column), so the choice is held here rather than
 * threaded through StudioPanels → LeftSidebar → TabRouter → ContentTab.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export type CmsTab = "records" | "fields" | "dynamic-pages" | "settings";

export interface CmsWorkspaceState {
  /** null → the workspace root ("CMS · <site>"). */
  collectionId: string | null;
  tab: CmsTab;
  /** The record open in the side sheet; "new" for an unsaved one. */
  recordId: string | null;
}

/** `ui:cms-open` (EVENTS.UI_CMS_OPEN) — open a collection's table, and with
 *  `recordId` its side sheet on that record (⌘K jumps here). `tab` lands on
 *  a specific tab instead of records (FC-1: Pages' "+N from collections"
 *  row opens straight to Dynamic pages). */
export interface CmsOpenRequest {
  collectionId: string;
  recordId?: string;
  tab?: CmsTab;
}

const INITIAL: CmsWorkspaceState = { collectionId: null, tab: "records", recordId: null };

let state: CmsWorkspaceState = INITIAL;
const listeners = new Set<() => void>();

function set(next: CmsWorkspaceState): void {
  state = next;
  listeners.forEach((l) => l());
}

/** Asked before a move that closes the open record; returns true when it
 *  took the move over (it calls `go` itself once the person agrees). */
export type CmsLeaveGuard = (go: () => void) => boolean;
let leaveGuard: CmsLeaveGuard | null = null;

/**
 * Every move goes through here (UI-02). A move that closes the open record —
 * another record, another collection, a tab, ⌘K's jump, the drawer's
 * collection rows — first asks the record's guard, so unsaved edits get the
 * discard question whichever door was used. Before, the sheet guarded only
 * its own buttons and three doors dropped the edits silently.
 */
function navigate(next: CmsWorkspaceState): void {
  const closesRecord =
    state.recordId !== null && (next.recordId !== state.recordId || next.collectionId !== state.collectionId);
  if (closesRecord && leaveGuard?.(() => set(next))) return;
  set(next);
}

export const cmsWorkspace = {
  get: (): CmsWorkspaceState => state,
  openCollection: (collectionId: string | null, tab: CmsTab = "records"): void =>
    navigate({ collectionId, tab, recordId: null }),
  setTab: (tab: CmsTab): void => navigate({ ...state, tab, recordId: null }),
  openRecord: (recordId: string | null): void => navigate({ ...state, tab: "records", recordId }),
  /** One write for both, so the table never renders a frame without its sheet. */
  openRequest: ({ collectionId, recordId, tab }: CmsOpenRequest): void =>
    navigate({ collectionId, tab: tab ?? "records", recordId: recordId ?? null }),
  /** The open record's guard (RecordSheet); returns its release. */
  setLeaveGuard: (guard: CmsLeaveGuard): (() => void) => {
    leaveGuard = guard;
    return () => {
      if (leaveGuard === guard) leaveGuard = null;
    };
  },
  reset: (): void => set(INITIAL),
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCmsWorkspace(): CmsWorkspaceState {
  return React.useSyncExternalStore(cmsWorkspace.subscribe, cmsWorkspace.get, cmsWorkspace.get);
}
