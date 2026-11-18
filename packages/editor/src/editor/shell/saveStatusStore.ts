/**
 * The save status the bottom bar shows (2L9 `Shell/BottomBar` 497:99485:
 * "✓ Saved just now · Details").
 *
 * The save state is derived in StudioHeader — it receives the save pipeline's
 * state from AquibraStudio — and shown by BottomBar, which StudioPanels
 * renders. The two are siblings under AquibraStudio, so they share this store
 * rather than threading the save props through a file agents may not edit
 * (the same shape as `publishTrayStore.ts`). StudioHeader writes; BottomBar
 * reads. `null` = nothing to show (view mode: nothing can become unsaved).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { SaveState, SaveStatusProps } from "@/editor/chrome-ui";

export interface ShellSaveStatus {
  state: SaveState;
  savedAt?: number;
  /** The status's own click (error → retry, conflict → recovery dialog). */
  onClick?: () => void;
  /** The tooltip for a status with nothing to click (offline). */
  hint?: string;
  /** "Details" — the History panel (what the old topbar save pill opened). */
  onDetails?: () => void;
  /** `stalled`: how long saving has been stuck (ms), and its panel. */
  stalledFor?: number;
  panel?: SaveStatusProps["panel"];
}

let current: ShellSaveStatus | null = null;
const listeners = new Set<() => void>();

export const saveStatusStore = {
  get: (): ShellSaveStatus | null => current,
  set(next: ShellSaveStatus | null): void {
    if (
      next === current ||
      (next &&
        current &&
        next.state === current.state &&
        next.savedAt === current.savedAt &&
        next.onClick === current.onClick &&
        next.hint === current.hint &&
        next.onDetails === current.onDetails &&
        next.stalledFor === current.stalledFor &&
        next.panel === current.panel)
    ) {
      return;
    }
    current = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useShellSaveStatus(): ShellSaveStatus | null {
  return React.useSyncExternalStore(saveStatusStore.subscribe, saveStatusStore.get, saveStatusStore.get);
}
