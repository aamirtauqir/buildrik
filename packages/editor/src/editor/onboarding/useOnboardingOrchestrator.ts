/**
 * useOnboardingOrchestrator — Single source of truth for onboarding state
 *
 * Drives one linear checklist flow: active → done.
 * Replaces the old 3-phase model (modal/tour/checklist/done).
 * Achievement prompts fire on each step completion.
 *
 * @license BSD-3-Clause
 */

import { useState, useCallback, useRef } from "react";
import { STORAGE_KEYS } from "../../shared/constants/storageKeys";
import {
  DEFAULT_ONBOARDING_STEPS,
  ONBOARDING_SCHEMA_VERSION,
  type OnboardingStep,
} from "../../shared/constants/onboardingSteps";

// ── Constants ────────────────────────────────────────────────────────────────

/**
 * Achievement prompt auto-dismiss duration. Single source of truth — the
 * orchestrator's setTimeout AND AchievementPrompt's progress-bar countdown
 * both consume this value so the bar reaches 100% exactly when the modal
 * dismisses (audit Pattern D — see docs/audits/2026-05-07-codebase-audit.md).
 */
export const ACHIEVEMENT_AUTO_DISMISS_MS = 4000;

// ── Types ────────────────────────────────────────────────────────────────────

export type OnboardingPhase = "active" | "done";

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
  // Actions
  completeStep: (stepId: string) => void;
  setActiveStepId: (id: string | null) => void;
  skipAll: () => void;
  dismissAchievement: () => void;
  replayAll: () => void;
  minimize: () => void;
  restore: () => void;
}

// ── Phase loader ─────────────────────────────────────────────────────────────

function loadInitialPhase(): OnboardingPhase {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PHASE);
    if (stored === "done") return "done";
    // Migrate old 4-phase values → "active"
    if (stored === "modal" || stored === "tour" || stored === "checklist") return "active";
    // Migrate old boolean dismiss flags
    const wasDismissed =
      localStorage.getItem("aquibra-onboarding-dismissed") === "true" ||
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED) === "true";
    if (wasDismissed) return "done";
    return "active";
  } catch {
    return "active";
  }
}

// ── Steps loader ─────────────────────────────────────────────────────────────

function loadInitialSteps(): OnboardingStep[] {
  try {
    const storedVersion = parseInt(
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION) ?? "0",
      10
    );
    if (storedVersion < ONBOARDING_SCHEMA_VERSION) {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
      localStorage.setItem(
        STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
        String(ONBOARDING_SCHEMA_VERSION)
      );
      return DEFAULT_ONBOARDING_STEPS;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    if (saved) {
      const parsed = JSON.parse(saved) as OnboardingStep[];
      // Length guard: if step count changed, reset
      if (parsed.length !== DEFAULT_ONBOARDING_STEPS.length) {
        localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
        return DEFAULT_ONBOARDING_STEPS;
      }
      return DEFAULT_ONBOARDING_STEPS.map((d) => ({
        ...d,
        completed: parsed.find((s) => s.id === d.id)?.completed ?? false,
      }));
    }
    return DEFAULT_ONBOARDING_STEPS;
  } catch {
    return DEFAULT_ONBOARDING_STEPS;
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboardingOrchestrator(): OnboardingOrchestratorState {
  const [phase, setPhase] = useState<OnboardingPhase>(loadInitialPhase);
  const [steps, setSteps] = useState<OnboardingStep[]>(loadInitialSteps);
  const [achievement, setAchievement] = useState<AchievementPromptState | null>(null);
  // Redesign P6 (calm first load): the checklist always starts as a minimized pill,
  // never the full bottom-right panel. New users meet the WelcomeModal first; the
  // pill is then one small, expandable nudge that doesn't fight the canvas. Users
  // open it on demand via the pill (restore). Previously a brand-new visit started
  // EXPANDED — three onboarding surfaces competing on first paint.
  const [isMinimized, setIsMinimized] = useState(true);

  // Start expanded on the first incomplete step
  const [activeStepId, setActiveStepId] = useState<string | null>(() => {
    const first = loadInitialSteps().find((s) => !s.completed);
    return first?.id ?? null;
  });

  // Refs so callbacks always read current state without stale closures
  const stepsRef = useRef<OnboardingStep[]>(steps);
  stepsRef.current = steps;
  const achievementRef = useRef<AchievementPromptState | null>(null);
  achievementRef.current = achievement;

  const achievementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── persistPhase ───────────────────────────────────────────────────────────
  const persistPhase = useCallback((p: OnboardingPhase) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, p);
    } catch {
      /* ignore */
    }
    setPhase(p);
  }, []);

  // ── completeStep ───────────────────────────────────────────────────────────
  const completeStep = useCallback(
    (stepId: string) => {
      const prev = stepsRef.current;
      if (prev.find((s) => s.id === stepId)?.completed) return; // already done

      const next = prev.map((s) => (s.id === stepId ? { ...s, completed: true } : s));
      setSteps(next);

      try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(next));
      } catch {
        /* ignore */
      }

      // Advance activeStepId to the next incomplete step
      const completedIndex = next.findIndex((s) => s.id === stepId);
      const nextIncomplete = next.slice(completedIndex + 1).find((s) => !s.completed);
      setActiveStepId(nextIncomplete?.id ?? null);

      // Build achievement data
      const completedStep = next[completedIndex];
      const nextStep = next.slice(completedIndex + 1).find((s) => !s.completed) ?? null;
      const isLastStep = next.every((s) => s.completed);

      setAchievement({ completedStep, nextStep, isLastStep });

      if (achievementTimer.current) clearTimeout(achievementTimer.current);
      achievementTimer.current = setTimeout(() => {
        setAchievement(null);
        if (isLastStep) persistPhase("done");
      }, ACHIEVEMENT_AUTO_DISMISS_MS);
    },
    [persistPhase]
  );

  // ── dismissAchievement ─────────────────────────────────────────────────────
  const dismissAchievement = useCallback(() => {
    if (achievementTimer.current) clearTimeout(achievementTimer.current);
    const current = achievementRef.current;
    setAchievement(null);
    if (current?.isLastStep) persistPhase("done");
  }, [persistPhase]);

  // ── skipAll ────────────────────────────────────────────────────────────────
  const skipAll = useCallback(() => {
    persistPhase("done");
  }, [persistPhase]);

  // ── replayAll ──────────────────────────────────────────────────────────────
  const replayAll = useCallback(() => {
    const fresh = DEFAULT_ONBOARDING_STEPS;
    setSteps(fresh);
    setActiveStepId(fresh[0]?.id ?? null);
    setIsMinimized(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
      localStorage.setItem(
        STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
        String(ONBOARDING_SCHEMA_VERSION)
      );
    } catch {
      /* ignore */
    }
    persistPhase("active");
  }, [persistPhase]);

  // ── minimize / restore ─────────────────────────────────────────────────────
  const minimize = useCallback(() => setIsMinimized(true), []);
  const restore = useCallback(() => setIsMinimized(false), []);

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;

  return {
    phase,
    steps,
    completedCount,
    totalCount,
    activeStepId,
    achievement,
    isMinimized,
    completeStep,
    setActiveStepId,
    skipAll,
    dismissAchievement,
    replayAll,
    minimize,
    restore,
  };
}

export default useOnboardingOrchestrator;
