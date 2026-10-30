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

/** A collection's four tabs as the boards name them (165:2, 165:520). */
export const CMS_TAB_LABEL: Record<CmsTab, string> = {
  records: "Records",
  fields: "Fields",
  "dynamic-pages": "Dynamic pages",
  settings: "Collection settings",
};

export interface CmsWorkspaceState {
  /** null → the workspace root ("CMS · <site>"). */
  collectionId: string | null;
  tab: CmsTab;
  /** The record open in the side sheet; "new" for an unsaved one. */
  recordId: string | null;
  /** Where this visit came from, in the words of its way back ("Heading ·
   *  Title binding", 173:16169). Kept across moves inside the workspace;
   *  cleared when the workspace closes. */
  origin: string | null;
  /** A Save and leave back to the origin is in flight: the header's way back
   *  reads "Saving record…" (173:16635, Play F2.09). */
  returning?: boolean;
  /** design-2l9 122:43815: the Pages drawer was opened over the workspace
   *  with a record open — the workspace (and the draft) stays up beside it,
   *  and opening a page asks the record first. */
  overPages?: boolean;
  /** A Data page in the workspace instead of a collection — 2L9 B5-V01
   *  `260:235689` draws Site variables as a full page, not a drawer subview. */
  page?: "variables";
}

/** `ui:cms-open` (EVENTS.UI_CMS_OPEN) — open a collection's table, and with
 *  `recordId` its side sheet on that record (⌘K jumps here). `tab` lands on
 *  a specific tab instead of records (FC-1: Pages' "+N from collections"
 *  row opens straight to Dynamic pages). */
export interface CmsOpenRequest {
  collectionId: string;
  recordId?: string;
  tab?: CmsTab;
  /** The element door's own name for the way back (Play F2.06). */
  origin?: string;
}

const INITIAL: CmsWorkspaceState = { collectionId: null, tab: "records", recordId: null, origin: null };

let state: CmsWorkspaceState = INITIAL;
const listeners = new Set<() => void>();

function set(next: CmsWorkspaceState): void {
  state = next;
  listeners.forEach((l) => l());
}

/** Asked before a move that closes the open record; returns true when it
 *  took the move over (it calls `go` itself once the person agrees). `next`
 *  is where the move lands, so the guard can name it ("before opening
 *  Fields", 168:21408). */
export type CmsLeaveGuard = (go: () => void, next: CmsWorkspaceState) => boolean;
let leaveGuard: CmsLeaveGuard | null = null;
/** Asked before the workspace itself is left — for the element it was opened
 *  from (the header's "‹ {origin}"), or for a page picked in the Pages drawer
 *  over it (`page`, 122:44151); true when it took the exit over. */
export interface CmsExitPage {
  /** The page's name, as the guard says it ("You asked to open About"). */
  name: string;
  /** Still a page of the site? Checked when the leave would land (126:36751). */
  exists: () => boolean;
  /** The page already on the canvas — the guard still asks (125:35603). */
  isCurrent?: boolean;
}
type CmsExitGuard = (go: () => void, page?: CmsExitPage) => boolean;
let exitGuard: CmsExitGuard | null = null;
let visitHolders = 0;

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
  if (closesRecord && leaveGuard?.(() => set(next), next)) return;
  set(next);
}

export const cmsWorkspace = {
  get: (): CmsWorkspaceState => state,
  openCollection: (collectionId: string | null, tab: CmsTab = "records"): void =>
    navigate({ ...state, collectionId, tab, recordId: null, page: undefined }),
  /** Site variables as the workspace's page (B5-V01). */
  openVariables: (): void => navigate({ ...state, collectionId: null, recordId: null, page: "variables" }),
  setTab: (tab: CmsTab): void => navigate({ ...state, tab, recordId: null }),
  openRecord: (recordId: string | null): void => navigate({ ...state, tab: "records", recordId }),
  /** One write for both, so the table never renders a frame without its sheet. */
  openRequest: ({ collectionId, recordId, tab, origin }: CmsOpenRequest): void =>
    navigate({ collectionId, tab: tab ?? "records", recordId: recordId ?? null, origin: origin ?? state.origin, page: undefined }),
  /** A mounted workspace holds the visit open; the release ends it — and
   *  its way back — unless another mount took over in the meantime (React's
   *  StrictMode mounts, unmounts and remounts once in development, which
   *  cleared the origin on the first render). */
  holdVisit: (): (() => void) => {
    visitHolders++;
    return () => {
      visitHolders--;
      queueMicrotask(() => {
        if (visitHolders === 0 && state.origin !== null) set({ ...state, origin: null });
      });
    };
  },
  /** The open record's guard (RecordSheet); returns its release. */
  setLeaveGuard: (guard: CmsLeaveGuard): (() => void) => {
    leaveGuard = guard;
    return () => {
      if (leaveGuard === guard) leaveGuard = null;
    };
  },
  setReturning: (returning: boolean): void => {
    if (Boolean(state.returning) !== returning) set({ ...state, returning });
  },
  /** The open record's guard on leaving the workspace; returns its release. */
  setExitGuard: (guard: CmsExitGuard): (() => void) => {
    exitGuard = guard;
    return () => {
      if (exitGuard === guard) exitGuard = null;
    };
  },
  /** Leave the workspace — through the open record's guard when there is one. */
  exit: (go: () => void, page?: CmsExitPage): void => {
    if (!exitGuard?.(go, page)) go();
  },
  setOverPages: (overPages: boolean): void => {
    if (Boolean(state.overPages) !== overPages) set({ ...state, overPages });
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
