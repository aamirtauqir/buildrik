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

const INITIAL: CmsWorkspaceState = { collectionId: null, tab: "records", recordId: null };

let state: CmsWorkspaceState = INITIAL;
const listeners = new Set<() => void>();

function set(next: CmsWorkspaceState): void {
  state = next;
  listeners.forEach((l) => l());
}

export const cmsWorkspace = {
  get: (): CmsWorkspaceState => state,
  openCollection: (collectionId: string | null, tab: CmsTab = "records"): void =>
    set({ collectionId, tab, recordId: null }),
  setTab: (tab: CmsTab): void => set({ ...state, tab, recordId: null }),
  openRecord: (recordId: string | null): void => set({ ...state, tab: "records", recordId }),
  reset: (): void => set(INITIAL),
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useCmsWorkspace(): CmsWorkspaceState {
  return React.useSyncExternalStore(cmsWorkspace.subscribe, cmsWorkspace.get, cmsWorkspace.get);
}
