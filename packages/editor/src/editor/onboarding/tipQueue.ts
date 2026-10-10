/**
 * The editor's ONE tip queue (L1-029, owner 2026-10-10).
 *
 * Tips used to fire from independent triggers: the rail coach on first paint,
 * one Add-panel tip on every Add open ("Tip 3 of 4" during keyboard work), each
 * a `role="dialog"` — which also made Escape stop deselecting. Every automatic
 * tip now asks this queue, which grants:
 *   - at most ONE automatic tip per session (this tab, across editor reloads);
 *   - only while the user is idle — no input for TIP_IDLE_MS, no pointer held
 *     (a drag), no editor popup open (`hasOpenEscapeSurface`);
 *   - only a tip this site has not shown before — seen/dismissed live with the
 *     L1-015 per-user × site state (`onboarding.markEditorTip`).
 * The queue never moves focus, and closing a tip completes no checklist step.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { EditorTipId } from "@buildrik/shared/schemas/onboarding";
import { hasOpenEscapeSurface } from "@/shared/utils/openEscapeSurface";
import { markEditorTip } from "@/services/OnboardingService";

/** How long the user must have done nothing before a tip may appear. */
export const TIP_IDLE_MS = 1500;
const POLL_MS = 250;
const SESSION_KEY = "bk-auto-tip-shown";

interface QueueState {
  siteId: string | null;
  /** Tips this site already showed. `null` = not loaded yet: show nothing. */
  seen: Set<EditorTipId> | null;
  current: EditorTipId | null;
  usedThisSession: boolean;
}

let state: QueueState = { siteId: null, seen: null, current: null, usedThisSession: false };
const listeners = new Set<() => void>();

function set(next: Partial<QueueState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function sessionUsed(): boolean {
  if (state.usedThisSession) return true;
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markSessionUsed() {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    /* storage unavailable — the in-memory flag still holds for this load */
  }
}

/** Called once this site's onboarding state has loaded (`null` site = in memory only). */
export function primeTipQueue(siteId: string | null, seen: readonly EditorTipId[]): void {
  set({ siteId, seen: new Set(seen) });
}

export function resetTipQueueForTests(opts: { keepSession?: boolean } = {}): void {
  state = { siteId: null, seen: null, current: null, usedThisSession: false };
  if (!opts.keepSession) {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const snapshot = () => state;

export interface AutoTip {
  /** The tip on screen for this caller, or null. */
  tipId: EditorTipId | null;
  /** The user closed it ("Got it", Escape, a click elsewhere). */
  close: () => void;
}

/**
 * Ask the queue for the first unseen tip of `candidates`. While `enabled`, it
 * waits for idle and, if the session's one automatic tip is still unspent,
 * shows it. The caller renders a non-modal, non-focusing surface for `tipId`.
 */
export function useAutoTip(candidates: readonly EditorTipId[], enabled: boolean): AutoTip {
  const q = React.useSyncExternalStore(subscribe, snapshot, snapshot);
  const next = q.seen ? candidates.find((id) => !q.seen?.has(id)) ?? null : null;
  const mine = q.current !== null && candidates.includes(q.current) ? q.current : null;
  const waiting = enabled && next !== null && q.current === null && !sessionUsed();

  React.useEffect(() => {
    if (!waiting || !next) return;
    let lastInput = Date.now();
    let held = false;
    const onInput = () => {
      lastInput = Date.now();
    };
    const onDown = () => {
      held = true;
      lastInput = Date.now();
    };
    const onUp = () => {
      held = false;
      lastInput = Date.now();
    };
    const events: Array<[string, () => void]> = [
      ["keydown", onInput],
      ["wheel", onInput],
      ["pointerdown", onDown],
      ["pointerup", onUp],
      ["pointercancel", onUp],
    ];
    events.forEach(([e, h]) => document.addEventListener(e, h, true));
    const timer = window.setInterval(() => {
      if (held || Date.now() - lastInput < TIP_IDLE_MS || hasOpenEscapeSurface()) return;
      if (state.current !== null || sessionUsed()) return;
      markSessionUsed();
      const seen = new Set(state.seen ?? []).add(next);
      set({ current: next, seen, usedThisSession: true });
      if (state.siteId) void markEditorTip(state.siteId, next, "seen");
    }, POLL_MS);
    return () => {
      window.clearInterval(timer);
      events.forEach(([e, h]) => document.removeEventListener(e, h, true));
    };
  }, [waiting, next]);

  const candidatesRef = React.useRef(candidates);
  candidatesRef.current = candidates;
  const close = React.useCallback(() => {
    const shown = state.current;
    if (!shown || !candidatesRef.current.includes(shown)) return;
    set({ current: null });
    if (state.siteId) void markEditorTip(state.siteId, shown, "dismissed");
  }, []);

  return { tipId: mine, close };
}
