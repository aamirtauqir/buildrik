/**
 * shellDirtyRegistry — the ONE place every navigation guard reads to know
 * whether ANY shell-owned surface has a staged-but-unsaved edit (B-1).
 *
 * Settings (SettingsTab) and a CMS record sheet (RecordSheet) are
 * sibling surfaces with no common parent closer than AquibraStudio —
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

export type DirtyDomain = "settings" | "cms-record";

let state: Record<DirtyDomain, boolean> = {
  settings: false,
  "cms-record": false,
};
/* A producer whose unsaved work really is thrown away by "Leave anyway"
   registers how to throw it away (Settings rolls its live composer writes
   back; a record sheet resets its fields). One that cannot registers
   nothing, and the confirm then must not promise the edits are lost. Not part of the
   subscribed snapshot: nothing renders from it. */
const discards: Partial<Record<DirtyDomain, () => void>> = {};
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

const DOMAINS: DirtyDomain[] = ["settings", "cms-record"];
const dirtyDomains = (): DirtyDomain[] => DOMAINS.filter((d) => state[d]);

export const shellDirty = {
  /** True when ANY registered domain is dirty — what leaving the editor
   *  (exit, beforeunload) or switching a left-panel tab can lose. */
  get: (): boolean => dirtyDomains().length > 0,
  /** Each producer owns its own entry: it sets it from its dirty state and
   *  clears it when its surface unmounts or discards — never anyone else. */
  set: (domain: DirtyDomain, dirty: boolean): void => {
    if (state[domain] === dirty) return;
    state = { ...state, [domain]: dirty };
    emit();
  },
  /** Register (or with null, drop) this domain's discard. */
  setDiscard: (domain: DirtyDomain, discard: (() => void) | null): void => {
    if (discard) discards[domain] = discard;
    else delete discards[domain];
  },
  /** True when every dirty domain can actually discard its work. */
  everyDirtyDiscards: (): boolean => dirtyDomains().every((d) => d in discards),
  /** "Leave anyway": each dirty domain that registered a discard runs it.
   *  One that throws does not stop the others; it stays dirty (so exit and
   *  beforeunload still warn about it) and is returned for the caller to
   *  report. */
  discardDirty: (): DirtyDomain[] => {
    const failed: DirtyDomain[] = [];
    for (const d of dirtyDomains()) {
      const discard = discards[d];
      if (!discard) continue;
      try {
        discard();
      } catch (err) {
        console.error(`[shellDirty] discard failed for "${d}"`, err);
        failed.push(d);
      }
    }
    failed.forEach((d) => shellDirty.set(d, true));
    return failed;
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
