/**
 * useOnboardingOrchestrator — Single source of truth for onboarding state
 *
 * Drives one linear checklist flow: active → done.
 * Replaces the old 3-phase model (modal/tour/checklist/done).
 * Achievement prompts fire on each step completion.
 *
 * @license BSD-3-Clause
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { STORAGE_KEYS } from "../../shared/constants/storageKeys";
import { DASHBOARD_URL } from "../../shared/utils/runtimeEnv";
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

// ── Schema migration ─────────────────────────────────────────────────────────

/* A schema bump changes what the steps ARE (v5 replaced the tool-framed list
   with the agency-framed one), so it must reset the whole story — progress,
   phase, and the dismissed flag. Clearing only progress left a v4 user whose
   phase said "done" permanently done: the new list would never show. Codex
   caught it at plan review. Idempotent — the version stamp is written first,
   so the second call in the same render (StrictMode double-invoke, and both
   loaders below call this) is a no-op. */
function migrateOnboardingSchema(): void {
  try {
    const storedVersion = parseInt(
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION) ?? "0",
      10
    );
    if (storedVersion >= ONBOARDING_SCHEMA_VERSION) return;
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
      String(ONBOARDING_SCHEMA_VERSION)
    );
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PHASE);
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_DISMISSED);
    localStorage.removeItem("aquibra-onboarding-dismissed");
  } catch {
    /* storage unavailable — the loaders fall back to defaults anyway */
  }
}

// ── Phase loader ─────────────────────────────────────────────────────────────

function loadInitialPhase(): OnboardingPhase {
  migrateOnboardingSchema();
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

/**
 * Mirror one completed step to `OnboardingState.editorTasks`.
 *
 * The column and the intent both pre-date this: the onboarding router carried
 * a comment reserving it "for when an editor tour is actually built". The
 * checklist was built and never used it.
 */
async function mirrorEditorTask(taskId: string): Promise<void> {
  try {
    const { createBuildrikApiClient } = await import("@/services/api-client");
    const client = createBuildrikApiClient(DASHBOARD_URL);
    await client.onboarding.completeEditorTask.mutate({ taskId: taskId as never });
  } catch {
    /* Offline, signed out, or the dashboard is unreachable. The local write
       stands and the next completion re-sends the set. */
  }
}

/**
 * Server-recorded steps, or null when they cannot be read.
 *
 * Null is deliberately distinct from "none completed": a failed read must not
 * erase ticks the user can see, so the caller falls back to local state rather
 * than treating an unreachable server as an empty checklist.
 */
async function loadServerEditorTasks(): Promise<string[] | null> {
  try {
    const { createBuildrikApiClient } = await import("@/services/api-client");
    const client = createBuildrikApiClient(DASHBOARD_URL);
    const state = (await client.onboarding.getState.query()) as { editorTasks?: unknown } | null;
    return Array.isArray(state?.editorTasks) ? (state.editorTasks as string[]) : null;
  } catch {
    return null;
  }
}

// ── Steps loader ─────────────────────────────────────────────────────────────

function loadInitialSteps(): OnboardingStep[] {
  migrateOnboardingSchema();
  try {
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
  // never the full bottom-right panel — one small, expandable nudge that doesn't
  // fight the canvas. Users open it on demand via the pill (restore). Previously a
  // brand-new visit started EXPANDED — multiple onboarding surfaces on first paint.
  const [isMinimized, setIsMinimized] = useState(true);

  // Start expanded on the first incomplete step
  const [activeStepId, setActiveStepId] = useState<string | null>(() => {
    const first = loadInitialSteps().find((s) => !s.completed);
    return first?.id ?? null;
  });

  /* `stepsRef` is the AUTHORITATIVE working copy, written at commit time by the
     callbacks below — never re-assigned during render.

     It used to be `stepsRef.current = steps` here, and that lost a step whenever
     two completions landed in one synchronous turn: no render can interleave
     inside one JS turn, so both calls read the same pre-render value and the
     second `setSteps` (and the second localStorage write) clobbered the first.
     Not a batching artefact — `EventEmitter.emit` calls its handlers inline, and
     `OnboardingMount` registers three step signals on the same composer, so one
     user action really can complete two steps. The counter was the visible half;
     `activeStepId`, the achievement payload and `isLastStep` were all derived
     from the stale value too.

     Every writer must keep the ref in step — see `replayAll`. */
  const stepsRef = useRef<OnboardingStep[]>(steps);

  /* Hydrate from the server once, so a user who activated on another device or
     in another browser is not told they have done nothing. The union is
     deliberate: server ticks are ADDED to local ones and never subtracted, so
     a stale or unreachable server cannot un-complete a step the user just did,
     and a local-only completion still shows while its mirror is in flight. */
  useEffect(() => {
    let cancelled = false;
    void loadServerEditorTasks().then((serverDone) => {
      if (cancelled || !serverDone || serverDone.length === 0) return;
      const merged = stepsRef.current.map((s) =>
        s.completed || serverDone.includes(s.id) ? { ...s, completed: true } : s,
      );
      if (merged.every((s, i) => s.completed === stepsRef.current[i].completed)) return;
      stepsRef.current = merged;
      setSteps(merged);
      try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);
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
      /* Commit to the ref FIRST so a second completion in this same turn reads
         this one's result rather than the value both started from. */
      stepsRef.current = next;
      setSteps(next);

      try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(next));
      } catch {
        /* ignore */
      }

      /* And to the server, because localStorage does not travel. This state is
         the one artefact built to prove a user activated, and it did not
         survive them changing device, browser or clearing a cache: a step
         completed in one context read back as not-done in another, for the
         same site and the same logged-in user.

         Fire-and-forget on purpose. The local write above already succeeded, so
         a failed mirror must not undo a completion the user can see ticked —
         the next completion re-sends the whole set, and `completeEditorTask`
         is a set-union, so a dropped call self-heals rather than corrupting. */
      void mirrorEditorTask(stepId);

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
    /* The ref is written here too. It used to self-heal on the next render via
       the render-time assignment that is now gone — without this line, a replay
       followed by a completion would resurrect the pre-replay list. */
    stepsRef.current = fresh;
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
