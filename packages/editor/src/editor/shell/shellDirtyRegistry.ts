/**
 * shellDirtyRegistry — the ONE place every navigation guard reads to know
 * whether ANY shell-owned surface has a staged-but-unsaved edit (B-1).
 *
 * Settings (StudioPanels' settingsDirty), Brand (StudioHeader's
 * BRAND_DIRTY_CHANGED listener) and a CMS record sheet (RecordSheet) are
 * three sibling surfaces with no common parent closer than AquibraStudio —
 * threading a boolean down through props and back up through callbacks for
 * three unrelated subtrees is exactly the coupling Composer-gateway rule 9
 * (`packages/editor/CLAUDE.md`) warns about. A tiny module-level store,
 * same shape as `cmsWorkspaceStore.ts`, lets each producer register its own
 * dirty state and lets every consumer (⌘H, ⇧A, the command palette,
 * `ui:switch-tab`, `UI_PANEL_OPEN`, the rail, `beforeunload`) read one
 * boolean without a common ancestor threading anything.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";

export type DirtyDomain = "settings" | "brand" | "cms-record";

const INITIAL: Record<DirtyDomain, boolean> = {
  settings: false,
  brand: false,
  "cms-record": false,
};

let state: Record<DirtyDomain, boolean> = { ...INITIAL };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export const shellDirty = {
  /** True when ANY registered domain is dirty. */
  get: (): boolean => state.settings || state.brand || state["cms-record"],
  getDomains: (): Record<DirtyDomain, boolean> => state,
  set: (domain: DirtyDomain, dirty: boolean): void => {
    if (state[domain] === dirty) return;
    state = { ...state, [domain]: dirty };
    emit();
  },
  /** Confirmed-leave: every domain drops back to clean so the next switch
   *  doesn't immediately re-prompt on the state a "Leave anyway" just
   *  discarded. The panel that owned the edit is responsible for resetting
   *  its own local form state when it next mounts — this registry only ever
   *  tracked "should the shell block leaving", not the edit itself. */
  reset: (): void => {
    state = { ...INITIAL };
    emit();
  },
  subscribe: (l: () => void): (() => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

/** True whenever any registered domain is dirty. Re-renders on change. */
export function useShellDirty(): boolean {
  return React.useSyncExternalStore(shellDirty.subscribe, shellDirty.get, shellDirty.get);
}
