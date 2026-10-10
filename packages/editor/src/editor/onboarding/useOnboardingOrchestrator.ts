/**
 * useOnboardingOrchestrator — the editor's Getting-started state.
 *
 * L1-015 (owner, 2026-10-10): progress is SERVER state per user × site, read
 * through one computed view that the rail pill and the checklist both render.
 * It used to be one global `localStorage` key shared by every site, so a
 * brand-new site's pill said "Done · 7 of 7" while Site menu → Getting started
 * (which reset the list) said 0/7. Now:
 *   - steps come from `onboarding.editorState` (recorded events ∪ what the
 *     site's own rows prove) plus this session's not-yet-confirmed ticks;
 *   - a completion records the milestone the editor saw happen;
 *   - dismissal is its own stored fact and never touches progress;
 *   - "done" is derived (dismissed, or every step done) — nothing stores it.
 *
 * Without a site (the standalone demo) or a reachable server it still works,
 * in memory for the session; nothing is written to browser storage.
 *
 * @license BSD-3-Clause
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { EDITOR_TASK_IDS, type EditorOnboardingView, type EditorTaskId } from "@buildrik/shared/schemas/onboarding";
import { DEFAULT_ONBOARDING_STEPS, type OnboardingStep } from "@/shared/constants/onboardingSteps";
import {
  fetchEditorOnboarding,
  recordEditorMilestone,
  setEditorChecklistDismissed,
} from "@/services/OnboardingService";

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Achievement prompt auto-dismiss duration. Single source of truth — the
 * orchestrator's setTimeout AND AchievementPrompt's progress-bar countdown
 * both consume this value so the bar reaches 100% exactly when the modal
 * dismisses (audit Pattern D — see docs/audits/2026-05-07-codebase-audit.md).
 */
export const ACHIEVEMENT_AUTO_DISMISS_MS = 4000;

// ── Types ────────────────────────────────────────────────────────────────────

/** `loading` = this site's state has not answered yet; nothing is shown. */
export type OnboardingPhase = "loading" | "active" | "done";

export interface AchievementPromptState {
  completedStep: OnboardingStep;
  nextStep: OnboardingStep | null;
  isLastStep: boolean;
}

export interface OnboardingOrchestratorState {
  phase: OnboardingPhase;
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  /** Which step id is currently expanded in the checklist */
  activeStepId: string | null;
  achievement: AchievementPromptState | null;
  isMinimized: boolean;
  /** `silent`: a step seeded from the loaded project — recorded, no achievement. */
  completeStep: (stepId: string, opts?: { silent?: boolean }) => void;
  setActiveStepId: (id: string | null) => void;
  /** Close the checklist on this site (stored; completes nothing). */
  dismiss: () => void;
  /** Site menu → Getting started: show it again, expanded, progress as it is. */
  reopen: () => void;
  dismissAchievement: () => void;
  minimize: () => void;
  restore: () => void;
}

const isTaskId = (id: string): id is EditorTaskId => (EDITOR_TASK_IDS as readonly string[]).includes(id);

function doneIds(view: EditorOnboardingView | null, local: ReadonlySet<string>): Set<string> {
  const done = new Set(local);
  if (view) for (const id of EDITOR_TASK_IDS) if (view.steps[id]) done.add(id);
  return done;
}

const stepsFrom = (done: ReadonlySet<string>): OnboardingStep[] =>
  DEFAULT_ONBOARDING_STEPS.map((d) => ({ ...d, completed: done.has(d.id) }));

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboardingOrchestrator(siteId: string | null): OnboardingOrchestratorState {
  const [view, setView] = useState<EditorOnboardingView | null>(null);
  const [loaded, setLoaded] = useState(siteId === null);
  /* Completions this session that the server has not (yet) confirmed. The
     union with the server view means a slow or failed write never un-ticks a
     step the user can see. */
  const [local, setLocal] = useState<ReadonlySet<string>>(() => new Set());
  const [dismissed, setDismissed] = useState(false);
  const [reopened, setReopened] = useState(false);
  const [achievement, setAchievement] = useState<AchievementPromptState | null>(null);
  // Redesign P6 (calm first load): always starts as the minimized pill.
  const [isMinimized, setIsMinimized] = useState(true);
  const [activeStepId, setActiveStepIdState] = useState<string | null>(null);
  const activeTouched = useRef(false);

  /* The AUTHORITATIVE working copy of "what is done", written at commit time
     so two completions in one synchronous turn (one user action can emit two
     step signals inline) both land — never re-assigned during render. */
  const doneRef = useRef<Set<string>>(new Set());
  const achievementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const adopt = useCallback((next: EditorOnboardingView | null) => {
    if (!next) return;
    for (const id of EDITOR_TASK_IDS) if (next.steps[id]) doneRef.current.add(id);
    setView(next);
    setDismissed(next.dismissed);
  }, []);

  useEffect(() => {
    if (!siteId) return;
    let cancelled = false;
    void fetchEditorOnboarding(siteId).then((v) => {
      if (cancelled) return;
      adopt(v);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [siteId, adopt]);

  const steps = stepsFrom(doneIds(view, local));

  // The first open step is expanded until the user picks one.
  const firstOpen = steps.find((s) => !s.completed)?.id ?? null;
  const effectiveActive = activeTouched.current ? activeStepId : firstOpen;

  const setActiveStepId = useCallback((id: string | null) => {
    activeTouched.current = true;
    setActiveStepIdState(id);
  }, []);

  const completeStep = useCallback(
    (stepId: string, opts: { silent?: boolean } = {}) => {
      if (doneRef.current.has(stepId)) return;
      const nextDone = new Set(doneRef.current).add(stepId);
      doneRef.current = nextDone;
      setLocal((prev) => new Set(prev).add(stepId));

      if (siteId && isTaskId(stepId)) void recordEditorMilestone(siteId, stepId).then(adopt);

      const next = stepsFrom(nextDone);
      const completedIndex = next.findIndex((s) => s.id === stepId);
      const nextStep = next.slice(completedIndex + 1).find((s) => !s.completed) ?? null;
      setActiveStepId(nextStep?.id ?? null);
      if (opts.silent || completedIndex < 0) return;

      setAchievement({ completedStep: next[completedIndex], nextStep, isLastStep: next.every((s) => s.completed) });
      if (achievementTimer.current) clearTimeout(achievementTimer.current);
      achievementTimer.current = setTimeout(() => setAchievement(null), ACHIEVEMENT_AUTO_DISMISS_MS);
    },
    [siteId, adopt, setActiveStepId],
  );

  const dismissAchievement = useCallback(() => {
    if (achievementTimer.current) clearTimeout(achievementTimer.current);
    setAchievement(null);
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setReopened(false);
    if (siteId) void setEditorChecklistDismissed(siteId, true).then(adopt);
  }, [siteId, adopt]);

  const reopen = useCallback(() => {
    setDismissed(false);
    setReopened(true);
    setIsMinimized(false);
    if (siteId) void setEditorChecklistDismissed(siteId, false).then(adopt);
  }, [siteId, adopt]);

  const minimize = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;
  const phase: OnboardingPhase = !loaded
    ? "loading"
    : dismissed || (allDone && !reopened && !achievement)
      ? "done"
      : "active";

  return {
    phase,
    steps,
    completedCount,
    totalCount: steps.length,
    activeStepId: effectiveActive,
    achievement,
    isMinimized,
    completeStep,
    setActiveStepId,
    dismiss,
    reopen,
    dismissAchievement,
    minimize,
    restore,
  };
}

export default useOnboardingOrchestrator;
