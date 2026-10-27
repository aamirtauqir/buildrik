/**
 * Whether the publish tray is open, and what it lists — design-2l9 Task 1.7.
 *
 * The tray's toggle is the topbar's Publish (StudioHeader); the tray itself
 * docks in the inspector column (StudioPanels), where the canvas column can
 * make room for it. The two are siblings under AquibraStudio, so they share
 * this store rather than threading state through the shell — the same shape
 * as `cms/cmsWorkspaceStore.ts`.
 *
 * `issues` rides here too: the site's issue list is derived once
 * (`useIssuesFeed`) and handed to StudioHeader only. The header writes it in;
 * the tray reads it. One list, so the tray's count and the lifecycle's
 * `errorCount` cannot disagree.
 *
 * `opener` is the element focus returns to when the tray closes (Esc, ✕).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Issue } from "./hooks/useStudioState";

export interface PublishTrayState {
  open: boolean;
  issues: Issue[];
}

let state: PublishTrayState = { open: false, issues: [] };
let opener: HTMLElement | null = null;
const listeners = new Set<() => void>();

function set(next: PublishTrayState): void {
  state = next;
  listeners.forEach((l) => l());
}

export const publishTray = {
  get: (): PublishTrayState => state,
  subscribe(l: () => void): () => void {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
  open(from?: HTMLElement | null): void {
    if (from) opener = from;
    if (!state.open) set({ ...state, open: true });
  },
  /** Close, and hand focus back to whatever opened the tray. */
  close(): void {
    if (!state.open) return;
    set({ ...state, open: false });
    const back = opener;
    opener = null;
    if (back?.isConnected) back.focus();
  },
  toggle(from?: HTMLElement | null): void {
    if (state.open) publishTray.close();
    else publishTray.open(from);
  },
  /** Same rows in the same order is no change — a caller's fresh `[]`
   *  default must not wake every subscriber. */
  setIssues(issues: Issue[]): void {
    const prev = state.issues;
    if (issues.length === prev.length && issues.every((issue, i) => issue === prev[i])) return;
    set({ ...state, issues });
  },
};

export function usePublishTray(): PublishTrayState {
  return React.useSyncExternalStore(publishTray.subscribe, publishTray.get, publishTray.get);
}

/** Just the open flag — for the toggle, which must not re-render when the
 *  issue list it feeds in changes. */
export function usePublishTrayOpen(): boolean {
  const getOpen = () => state.open;
  return React.useSyncExternalStore(publishTray.subscribe, getOpen, getOpen);
}
