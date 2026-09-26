/**
 * shellDirtyRegistry — the ONE place every navigation guard reads to know
 * whether ANY shell-owned surface has a staged-but-unsaved edit (B-1).
 *
 * Settings (SettingsTab), Brand (StudioHeader's BRAND_DIRTY_CHANGED
 * listener) and a CMS record sheet (RecordSheet) are
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

let state: Record<DirtyDomain, boolean> = {
  settings: false,
  brand: false,
  "cms-record": false,
};
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export const shellDirty = {
  /** True when ANY registered domain is dirty — what leaving the editor
   *  (exit, beforeunload) would lose. */
  get: (): boolean => state.settings || state.brand || state["cms-record"],
  /** True when a left-panel tab switch would lose work: the surfaces a switch
   *  UNMOUNTS (Settings' screen buffers, an open record's fields). Brand is
   *  left out on purpose — its staged edits live in TokenRegistryProvider,
   *  above the panels, and are still staged after a switch. */
  blocksTabSwitch: (): boolean => state.settings || state["cms-record"],
  /** Each producer owns its own entry: it sets it from its dirty state and
   *  clears it when its surface unmounts or discards — never anyone else. */
  set: (domain: DirtyDomain, dirty: boolean): void => {
    if (state[domain] === dirty) return;
    state = { ...state, [domain]: dirty };
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
