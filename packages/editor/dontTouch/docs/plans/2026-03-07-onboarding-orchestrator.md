# Onboarding Orchestrator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace three unconnected onboarding systems (OnboardingModal, TourOverlay, OnboardingProgress) with a single orchestrator that drives a linear, game-like journey: Modal → Tour → Checklist, with contextual Achievement Prompts on each step completion.

**Architecture:** A single `useOnboardingOrchestrator` hook owns all phase state and localStorage. Every onboarding component reads from this hook — nothing manages its own phase. Composer events trigger `completeStep()` inside the hook, which fires an Achievement Prompt overlay before advancing the checklist.

**Tech Stack:** React 18 + TypeScript, Emotion CSS-in-JS, Composer event system (`composer.on`), localStorage via `STORAGE_KEYS` SSOT.

---

## Current State (What Exists)

Before touching anything, understand what currently exists:

- `src/editor/onboarding/OnboardingModal.tsx` — 3-step center modal, uses `STORAGE_KEYS.ONBOARDING_MODAL`
- `src/shared/ui/TourOverlay.tsx` — 4-step spotlight tour, uses `STORAGE_KEYS.ONBOARDING_TOUR`
- `src/shared/hooks/useOnboarding.ts` — checklist hook, uses `STORAGE_KEYS.ONBOARDING_PROGRESS` / `ONBOARDING_DISMISSED`
- `src/editor/onboarding/OnboardingProgress.tsx` — checklist UI widget, calls `useOnboarding()` directly
- `src/editor/shell/AquibraStudio.tsx` — renders `<TourOverlay>` (line 451) and `<OnboardingProgress>` (line 512) independently, no coordination
- `src/shared/constants/storageKeys.ts` — SSOT for all localStorage keys (already has ONBOARDING_MODAL, ONBOARDING_TOUR, ONBOARDING_PROGRESS, ONBOARDING_DISMISSED, ONBOARDING_SCHEMA_VERSION)
- `src/shared/constants/events.ts` — composer event constants (ELEMENT_CREATED, ELEMENT_EDIT_INLINE, ELEMENT_UPDATED, etc.)

**The problem:** Each system has its own localStorage, its own show/hide logic, and no awareness of the others. They can all appear simultaneously.

---

## Phase Flow

```
"modal" ──onComplete/skip──→ "tour" ──onComplete/skip──→ "checklist" ──onComplete/dismiss──→ "done"
                                                              ↑
                                                    AchievementPrompt fires on
                                                    each composer event trigger
```

---

## Task 1: Add 3 New Storage Keys

**File:** `src/shared/constants/storageKeys.ts`
**Why:** Orchestrator needs to persist phase, tour step, and project-named flag — these don't exist yet.

**Step 1: Read the file**
Read `src/shared/constants/storageKeys.ts` and find the `// ─── Onboarding ───` section (around line 117).

**Step 2: Add 3 keys after `ONBOARDING_SCHEMA_VERSION`**

Current state of Onboarding section (already has these 5 keys from QW-1):
```ts
ONBOARDING_MODAL: "aqb-onboarding-modal",
ONBOARDING_TOUR: "aqb-onboarding-tour-v2",
ONBOARDING_PROGRESS: "aqb-onboarding-progress",
ONBOARDING_DISMISSED: "aqb-onboarding-dismissed",
ONBOARDING_SCHEMA_VERSION: "aqb-onboarding-schema-v",
```

Add after `ONBOARDING_SCHEMA_VERSION`:
```ts
/** Current onboarding phase — "modal" | "tour" | "checklist" | "done" */
ONBOARDING_PHASE: "aqb-onboarding-phase",
/** Current tour step index (0-based) — persisted so refresh resumes same step */
ONBOARDING_TOUR_STEP: "aqb-onboarding-tour-step",
/** Whether user has named their project during onboarding */
ONBOARDING_PROJECT_NAMED: "aqb-onboarding-project-named",
```

**Step 3: Verify**
File should export 8 onboarding keys total. Run: `npx tsc --noEmit` — should pass.

**Step 4: Commit**
```bash
git add src/shared/constants/storageKeys.ts
git commit -m "feat(onboarding): add phase, tour-step, project-named storage keys"
```

---

## Task 2: Create `useOnboardingOrchestrator` Hook

**File to create:** `src/editor/onboarding/useOnboardingOrchestrator.ts`
**Why:** This is the single brain of the entire onboarding system. All phase decisions, all localStorage reads/writes, all composer event wiring happen here.

**Step 1: Create the file**

```ts
/**
 * useOnboardingOrchestrator — Single source of truth for onboarding state
 *
 * Drives a linear journey: modal → tour → checklist → done
 * Achievement prompts fire on each checklist step completion.
 *
 * MIGRATION: Detects old localStorage keys (pre-orchestrator users)
 * and maps them to the correct starting phase.
 *
 * @license BSD-3-Clause
 */

import { useState, useCallback, useRef } from "react";
import { STORAGE_KEYS } from "../../shared/constants/storageKeys";
import type { OnboardingStep } from "../../shared/hooks/useOnboarding";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OnboardingPhase = "modal" | "tour" | "checklist" | "done";

export interface AchievementPromptState {
  completedStep: OnboardingStep;
  nextStep: OnboardingStep | null;
  isLastStep: boolean;
}

export interface OnboardingOrchestratorState {
  // Phase
  phase: OnboardingPhase;
  // Tour step (0-based, persisted across refresh)
  tourStep: number;
  // Checklist
  steps: OnboardingStep[];
  completedCount: number;
  totalCount: number;
  // Achievement prompt (null = not showing)
  achievement: AchievementPromptState | null;
  // Project naming
  projectNamed: boolean;
  // Actions
  advancePhase: () => void;
  skipAll: () => void;
  setTourStep: (step: number) => void;
  completeStep: (stepId: string) => void;
  dismissAchievement: () => void;
  markProjectNamed: () => void;
  replayTour: () => void;
}

// ─── Default Checklist Steps ──────────────────────────────────────────────────
// SSOT: these are the 5 steps. If you add/remove steps, bump SCHEMA_VERSION
// in useOnboarding.ts as well.

const SCHEMA_VERSION = 2;

const DEFAULT_STEPS: OnboardingStep[] = [
  {
    id: "add-element",
    label: "Add an element",
    description: "Drag an element from the Build panel to your canvas",
    completed: false,
  },
  {
    id: "edit-text",
    label: "Edit text",
    description: "Double-click any text element to edit its content",
    completed: false,
  },
  {
    id: "change-style",
    label: "Change a style",
    description: "Select an element and modify its styles in the inspector",
    completed: false,
  },
  {
    id: "preview",
    label: "Preview your site",
    description: "Click Preview to see your site across devices",
    completed: false,
  },
  {
    id: "publish",
    label: "Publish your site",
    description: "Click the Publish button at the top right to make your site live",
    completed: false,
  },
];

// ─── Migration Helper ─────────────────────────────────────────────────────────
// Detects pre-orchestrator users and returns their correct starting phase.
// Called once on hook init. Returns null if no migration needed.

function detectMigratedPhase(): OnboardingPhase | null {
  try {
    // User already completed the old modal
    const oldModalDone = localStorage.getItem("buildrik_onboarding_complete") === "true";
    // User already completed the old tour
    const oldTourDone = localStorage.getItem("buildrik_onboarding_tour_v1") === "true";
    // User dismissed the old checklist
    const oldDismissed = localStorage.getItem("aquibra-onboarding-dismissed") === "true";

    if (oldModalDone || oldTourDone || oldDismissed) {
      // Old user — skip modal + tour, start at checklist
      // (they may have partial progress; let checklist load it)
      return "checklist";
    }
  } catch {
    // localStorage unavailable
  }
  return null;
}

// ─── Load Initial Phase ───────────────────────────────────────────────────────

function loadInitialPhase(): OnboardingPhase {
  try {
    // Check if orchestrator phase already set
    const stored = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PHASE) as OnboardingPhase | null;
    if (stored && ["modal", "tour", "checklist", "done"].includes(stored)) {
      return stored;
    }
    // First time with orchestrator — check migration
    const migratedPhase = detectMigratedPhase();
    if (migratedPhase) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, migratedPhase);
      return migratedPhase;
    }
    // Fresh user — start from modal
    return "modal";
  } catch {
    return "modal";
  }
}

// ─── Load Initial Steps ───────────────────────────────────────────────────────

function loadInitialSteps(): OnboardingStep[] {
  try {
    const storedVersion = parseInt(
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION) ?? "0",
      10
    );
    if (storedVersion < SCHEMA_VERSION) {
      // Stale data — clear and use defaults
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION, String(SCHEMA_VERSION));
      return DEFAULT_STEPS;
    }
    const saved = localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS);
    if (saved) {
      const parsed = JSON.parse(saved) as OnboardingStep[];
      // Merge with defaults — handles new steps added in future updates
      return DEFAULT_STEPS.map((defaultStep) => {
        const savedStep = parsed.find((s) => s.id === defaultStep.id);
        return savedStep ?? defaultStep;
      });
    }
    return DEFAULT_STEPS;
  } catch {
    return DEFAULT_STEPS;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOnboardingOrchestrator(): OnboardingOrchestratorState {
  const [phase, setPhase] = useState<OnboardingPhase>(loadInitialPhase);
  const [tourStep, setTourStepState] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem(STORAGE_KEYS.ONBOARDING_TOUR_STEP) ?? "0", 10);
    } catch {
      return 0;
    }
  });
  const [steps, setSteps] = useState<OnboardingStep[]>(loadInitialSteps);
  const [achievement, setAchievement] = useState<AchievementPromptState | null>(null);
  const [projectNamed, setProjectNamed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROJECT_NAMED) === "true";
    } catch {
      return false;
    }
  });

  // Ref to track auto-dismiss timer for achievement prompt
  const achievementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persist phase ──────────────────────────────────────────────────────────
  const persistPhase = useCallback((p: OnboardingPhase) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, p);
    } catch { /* ignore */ }
    setPhase(p);
  }, []);

  // ── advancePhase — modal → tour → checklist → done ────────────────────────
  const advancePhase = useCallback(() => {
    setPhase((current) => {
      let next: OnboardingPhase;
      if (current === "modal") next = "tour";
      else if (current === "tour") next = "checklist";
      else next = "done";
      try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, next);
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  // ── skipAll — jump directly to done ───────────────────────────────────────
  const skipAll = useCallback(() => {
    persistPhase("done");
  }, [persistPhase]);

  // ── setTourStep — persist tour step index ─────────────────────────────────
  const setTourStep = useCallback((step: number) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_TOUR_STEP, String(step));
    } catch { /* ignore */ }
    setTourStepState(step);
  }, []);

  // ── completeStep — called by composer event wiring ─────────────────────────
  // Marks step complete, shows achievement prompt, auto-dismisses after 4s.
  // If already complete, silently returns (no double prompt).
  const completeStep = useCallback((stepId: string) => {
    setSteps((prev) => {
      const alreadyDone = prev.find((s) => s.id === stepId)?.completed;
      if (alreadyDone) return prev; // silent — no re-prompt

      const next = prev.map((s) => (s.id === stepId ? { ...s, completed: true } : s));

      // Persist updated steps
      try {
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, JSON.stringify(next));
      } catch { /* ignore */ }

      // Find completed step and next step for achievement prompt
      const completedIndex = next.findIndex((s) => s.id === stepId);
      const completedStep = next[completedIndex];
      const nextStep = next.slice(completedIndex + 1).find((s) => !s.completed) ?? null;
      const isLastStep = next.every((s) => s.completed);

      // Show achievement prompt
      setAchievement({ completedStep, nextStep, isLastStep });

      // Clear any existing timer
      if (achievementTimer.current) clearTimeout(achievementTimer.current);

      // Auto-dismiss after 4 seconds
      achievementTimer.current = setTimeout(() => {
        setAchievement(null);
        // If all steps done, advance phase to done
        if (isLastStep) {
          try {
            localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, "done");
          } catch { /* ignore */ }
          setPhase("done");
        }
      }, 4000);

      return next;
    });
  }, []);

  // ── dismissAchievement — manual dismiss of achievement card ───────────────
  const dismissAchievement = useCallback(() => {
    if (achievementTimer.current) clearTimeout(achievementTimer.current);
    setAchievement((current) => {
      if (current?.isLastStep) {
        // Last step dismissed — advance to done
        try {
          localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, "done");
        } catch { /* ignore */ }
        setPhase("done");
      }
      return null;
    });
  }, []);

  // ── markProjectNamed — called when user sets project name in tour ──────────
  const markProjectNamed = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROJECT_NAMED, "true");
    } catch { /* ignore */ }
    setProjectNamed(true);
  }, []);

  // ── replayTour — re-entry from Settings panel ─────────────────────────────
  const replayTour = useCallback(() => {
    setTourStep(0);
    persistPhase("tour");
  }, [setTourStep, persistPhase]);

  // ── Computed values ────────────────────────────────────────────────────────
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;

  return {
    phase,
    tourStep,
    steps,
    completedCount,
    totalCount,
    achievement,
    projectNamed,
    advancePhase,
    skipAll,
    setTourStep,
    completeStep,
    dismissAchievement,
    markProjectNamed,
    replayTour,
  };
}

export default useOnboardingOrchestrator;
```

**Step 2: Verify file is created correctly**
Run: `npx tsc --noEmit` — should pass with no errors.

**Step 3: Commit**
```bash
git add src/editor/onboarding/useOnboardingOrchestrator.ts
git commit -m "feat(onboarding): add useOnboardingOrchestrator — single source of truth for phase state"
```

---

## Task 3: Create `AchievementPrompt` Component

**File to create:** `src/editor/onboarding/AchievementPrompt.tsx`
**Why:** This is the "game-like" step completion overlay. When a checklist step is completed via a composer event, this card appears — dims the background, shows what was completed, previews the next step, and auto-dismisses after 4 seconds.

**Step 1: Create the file**

```tsx
/**
 * AchievementPrompt — Game-like step completion overlay
 *
 * Shown when a checklist step is completed (via composer event).
 * Dims the background, shows completed step + next step preview.
 * Auto-dismisses after 4 seconds or on manual click.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { AchievementPromptState } from "./useOnboardingOrchestrator";

export interface AchievementPromptProps extends AchievementPromptState {
  onDismiss: () => void;
}

export const AchievementPrompt: React.FC<AchievementPromptProps> = ({
  completedStep,
  nextStep,
  isLastStep,
  onDismiss,
}) => {
  // Progress bar — counts down 4s visually
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    const start = Date.now();
    const duration = 4000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Announce to screen readers
  React.useEffect(() => {
    const msg = isLastStep
      ? "Congratulations! You have completed all getting started steps."
      : `Step complete: ${completedStep.label}. Next: ${nextStep?.label ?? ""}`;
    const el = document.getElementById("aqb-achievement-live");
    if (el) el.textContent = msg;
  }, [completedStep, nextStep, isLastStep]);

  return (
    <>
      {/* Accessible live region for screen readers */}
      <div
        id="aqb-achievement-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", opacity: 0 }}
      />

      {/* Dim overlay — click to dismiss */}
      <div
        onClick={onDismiss}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          zIndex: 10000,
        }}
      />

      {/* Achievement card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="achievement-title"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 10001,
          width: 380,
          maxWidth: "calc(100vw - 48px)",
          background: "var(--aqb-bg-panel, #1c1e24)",
          border: "1px solid var(--aqb-border, rgba(255,255,255,0.1))",
          borderRadius: 16,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          overflow: "hidden",
        }}
      >
        {/* Auto-dismiss progress bar at top */}
        <div
          aria-hidden="true"
          style={{
            height: 3,
            background: "var(--aqb-primary, #3b82f6)",
            width: `${progress}%`,
            transition: "width 50ms linear",
          }}
        />

        <div style={{ padding: "24px 24px 20px" }}>
          {/* Completed step */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 20 }}>
            <div
              aria-hidden="true"
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgba(16,185,129,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                fontSize: 20,
              }}
            >
              {isLastStep ? "🎉" : "✓"}
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 4px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "var(--aqb-success, #10b981)",
                }}
              >
                {isLastStep ? "All done!" : "Step complete"}
              </p>
              <h3
                id="achievement-title"
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--aqb-text-primary, #fff)",
                }}
              >
                {isLastStep ? "You're all set!" : completedStep.label}
              </h3>
              {isLastStep && (
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--aqb-text-secondary, rgba(255,255,255,0.6))", lineHeight: 1.5 }}>
                  You've completed all the getting started steps. Go build something great.
                </p>
              )}
            </div>
          </div>

          {/* Next step preview — only if not last step */}
          {!isLastStep && nextStep && (
            <div
              style={{
                padding: "12px 14px",
                background: "rgba(255,255,255,0.04)",
                borderRadius: 10,
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  fontSize: 16,
                  color: "var(--aqb-text-tertiary, rgba(255,255,255,0.4))",
                  flexShrink: 0,
                }}
              >
                →
              </span>
              <div>
                <p
                  style={{
                    margin: "0 0 2px",
                    fontSize: 11,
                    color: "var(--aqb-text-tertiary, rgba(255,255,255,0.4))",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Next up
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "var(--aqb-text-secondary, rgba(255,255,255,0.7))", fontWeight: 500 }}>
                  {nextStep.label}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--aqb-text-tertiary, rgba(255,255,255,0.4))", lineHeight: 1.4 }}>
                  {nextStep.description}
                </p>
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            type="button"
            onClick={onDismiss}
            autoFocus
            style={{
              width: "100%",
              padding: "11px 20px",
              background: isLastStep
                ? "var(--aqb-success, #10b981)"
                : "var(--aqb-primary, #3b82f6)",
              border: "none",
              borderRadius: 10,
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            {isLastStep ? "Done" : "Continue →"}
          </button>
        </div>
      </div>
    </>
  );
};

export default AchievementPrompt;
```

**Step 2: Verify**
Run: `npx tsc --noEmit` — no errors.

**Step 3: Commit**
```bash
git add src/editor/onboarding/AchievementPrompt.tsx
git commit -m "feat(onboarding): add AchievementPrompt — game-like step completion overlay"
```

---

## Task 4: Update `TourOverlay` — Accept Orchestrator Props

**File:** `src/shared/ui/TourOverlay.tsx`
**Why:** TourOverlay currently manages its own step state internally. The orchestrator needs to control the step (so it persists across refresh). We add two optional props: `step` and `onStepChange`. Also, `onComplete` and `onSkip` now come from orchestrator instead of managing their own localStorage.

**Step 1: Read the file**
Read the full `src/shared/ui/TourOverlay.tsx`.

**Step 2: Update `TourOverlayProps` interface**

Find:
```ts
export interface TourOverlayProps {
  /** Called when user submits a project name from the naming step */
  onNameProject?: (name: string) => void;
  /** Current project name (pre-fills the input) */
  initialProjectName?: string;
}
```

Replace with:
```ts
export interface TourOverlayProps {
  /** Called when user submits a project name from the naming step */
  onNameProject?: (name: string) => void;
  /** Current project name (pre-fills the input) */
  initialProjectName?: string;
  /** Controlled step index from orchestrator — overrides internal state when provided */
  step?: number;
  /** Called when step changes — lets orchestrator persist step index */
  onStepChange?: (step: number) => void;
  /** Called when tour completes (last step Next clicked) */
  onComplete?: () => void;
  /** Called when tour is skipped */
  onSkip?: () => void;
}
```

**Step 3: Update component to use controlled step when provided**

Find the `useState` for `currentStepIndex`:
```ts
const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
```

Replace with:
```ts
const [internalStep, setInternalStep] = React.useState(0);
const currentStepIndex = props.step !== undefined ? props.step : internalStep;
const setCurrentStepIndex = React.useCallback((indexOrUpdater: number | ((prev: number) => number)) => {
  const newIndex = typeof indexOrUpdater === "function" ? indexOrUpdater(currentStepIndex) : indexOrUpdater;
  setInternalStep(newIndex);
  props.onStepChange?.(newIndex);
}, [currentStepIndex, props]);
```

Note: `props` here means the destructured props object. Adjust variable names to match the actual destructuring in the component function signature.

**Step 4: Update `handleFinish` to call `onSkip`**

Find:
```ts
const handleFinish = () => {
  localStorage.setItem(STORAGE_KEY, "true");
  setIsVisible(false);
};
```

Replace with:
```ts
const handleFinish = () => {
  localStorage.setItem(STORAGE_KEY, "true");
  setIsVisible(false);
  props.onSkip?.();
};
```

**Step 5: Update `handleNext` on last step to call `onComplete`**

Find in `handleNext`:
```ts
} else {
  handleFinish();
}
```

Replace with:
```ts
} else {
  localStorage.setItem(STORAGE_KEY, "true");
  setIsVisible(false);
  props.onComplete?.();
}
```

**Step 6: Remove the `replay-tour` window event listener**

Find and delete this entire useEffect block:
```ts
// Listen for "replay-tour" event to re-trigger the tour
React.useEffect(() => {
  const handler = () => {
    setCurrentStepIndex(0);
    setIsVisible(true);
  };
  window.addEventListener("replay-tour", handler);
  return () => window.removeEventListener("replay-tour", handler);
}, []);
```

Reason: Orchestrator's `replayTour()` now handles this by setting phase back to "tour". Window events bypass orchestrator authority.

**Step 7: Mobile viewport check — hide on small screens**

Add at the top of the component render (before the `if (!isVisible) return null` check):

```ts
// On mobile (<768px), tour targets may not exist — show centered fallback
// already handled via position fallback in calculatePosition, no extra logic needed.
// For very small screens, the 400px card will use maxWidth: "calc(100vw - 48px)"
// handled in cardStyles. No additional check needed here.
```

Note: The existing card has `width: 400` inline. Update `cardStyles`:
```ts
const cardStyles: React.CSSProperties = {
  // existing styles...
  width: 400,
  maxWidth: "calc(100vw - 48px)", // ADD THIS LINE — mobile safe
  // rest of styles...
};
```

**Step 8: Verify**
Run: `npx tsc --noEmit` — no errors.

**Step 9: Commit**
```bash
git add src/shared/ui/TourOverlay.tsx
git commit -m "feat(onboarding): TourOverlay accepts controlled step + onComplete/onSkip from orchestrator"
```

---

## Task 5: Update `OnboardingProgress` — Accept Orchestrator Props

**File:** `src/editor/onboarding/OnboardingProgress.tsx`
**Why:** Currently `OnboardingProgress` calls `useOnboarding()` directly and manages its own show/hide logic. After this change, it receives all state from the orchestrator as props. This makes it a pure display component — no internal state decisions.

**Step 1: Read the file**
Read the full `src/editor/onboarding/OnboardingProgress.tsx`.

**Step 2: Update `OnboardingProgressProps`**

Find:
```ts
export interface OnboardingProgressProps {
  /** Custom class name */
  className?: string;
}
```

Replace with:
```ts
export interface OnboardingProgressProps {
  /** All steps with completion state */
  steps: OnboardingStep[];
  /** How many steps are done */
  completedCount: number;
  /** Total step count */
  totalCount: number;
  /** Called when user clicks the dismiss (×) button */
  onDismiss: () => void;
  /** Custom class name */
  className?: string;
}

// Import OnboardingStep type
// Add at top of file imports:
// import type { OnboardingStep } from "../../shared/hooks/useOnboarding";
```

**Step 3: Update component signature and remove internal hook call**

Find:
```ts
export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ className = "" }) => {
  const { steps, completedCount, totalCount, progress, dismiss, dismissed, isComplete } =
    useOnboarding();

  const [expanded, setExpanded] = React.useState(false);

  // Don't render if dismissed or all steps complete
  if (dismissed || isComplete) return null;
```

Replace with:
```ts
export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  steps,
  completedCount,
  totalCount,
  onDismiss,
  className = "",
}) => {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const [expanded, setExpanded] = React.useState(false);
```

Note: Remove `useOnboarding` import since it's no longer called here.

**Step 4: Update the dismiss button handler**

Find:
```tsx
onClick={(e) => {
  e.stopPropagation();
  dismiss();
}}
```

Replace with:
```tsx
onClick={(e) => {
  e.stopPropagation();
  onDismiss();
}}
```

**Step 5: Verify**
Run: `npx tsc --noEmit` — no errors.

**Step 6: Commit**
```bash
git add src/editor/onboarding/OnboardingProgress.tsx
git commit -m "refactor(onboarding): OnboardingProgress is now a pure display component — receives props from orchestrator"
```

---

## Task 6: Update `OnboardingModal` — Use Orchestrator Callbacks

**File:** `src/editor/onboarding/OnboardingModal.tsx`
**Why:** `OnboardingModal` already has `onComplete` and `onSkip` props, so the interface is correct. The only remaining issue: it stores its own localStorage flag internally. After this change, that's still fine as a secondary guard — but the orchestrator is the authority. No prop interface change needed. This task is mostly verification.

**Step 1: Read the file**
Read the full `src/editor/onboarding/OnboardingModal.tsx`.

**Step 2: Verify props interface is correct**

The existing interface:
```ts
interface OnboardingModalProps {
  onComplete: () => void;
  onSkip: () => void;
}
```

This is correct. `onComplete` and `onSkip` will receive `advancePhase` and `skipAll` from the orchestrator respectively. No change needed.

**Step 3: Verify `markOnboardingComplete` is called on complete**

In `AquibraStudio`, when we wire the orchestrator, `onComplete` will be `advancePhase`. But `markOnboardingComplete()` (which sets `STORAGE_KEYS.ONBOARDING_MODAL`) should still be called for backwards compatibility (so old code paths that check this flag still work).

Ensure that the parent (AquibraStudio) calls `markOnboardingComplete()` before calling `advancePhase()`. We will handle this in Task 7.

**Step 4: No code changes needed in this file**

The file is already correct. Just verify and commit a no-op if needed, or skip the commit.

---

## Task 7: Wire Orchestrator in `AquibraStudio`

**File:** `src/editor/shell/AquibraStudio.tsx`
**Why:** This is where everything comes together. The orchestrator hook is called here, and its state drives which onboarding component renders. Composer events are subscribed here to trigger `completeStep`.

**Step 1: Read the file**
Read the full `src/editor/shell/AquibraStudio.tsx`.

**Step 2: Add imports at the top of the file**

After the existing imports, add:
```ts
import { useOnboardingOrchestrator } from "../onboarding/useOnboardingOrchestrator";
import { AchievementPrompt } from "../onboarding/AchievementPrompt";
import { OnboardingModal, markOnboardingComplete } from "../onboarding/OnboardingModal";
import type { OnboardingProgressProps } from "../onboarding/OnboardingProgress";
```

Note: `TourOverlay` is already imported at line 18. `OnboardingProgress` is imported at line 23.

**Step 3: Call the orchestrator hook**

Inside `AquibraStudioShell`, after the existing hooks (after line ~170 `useHistoryFeedback`):

```ts
// ── Onboarding Orchestrator ──────────────────────────────────────────────────
const onboarding = useOnboardingOrchestrator();
```

**Step 4: Wire composer events → completeStep**

Add a new `useEffect` after the `useHistoryFeedback` call:

```ts
// Wire composer events to onboarding checklist step completion
React.useEffect(() => {
  if (!composer) return;

  // "Add an element" — fires when any element is created on canvas
  const onElementCreated = () => onboarding.completeStep("add-element");
  // "Edit text" — fires when user starts inline text editing
  const onTextEdited = () => onboarding.completeStep("edit-text");
  // "Change a style" — fires when any element property is updated
  // Note: ELEMENT_UPDATED is broad; it fires for text edits too.
  // We only complete "change-style" if "edit-text" is already done
  // to avoid accidental premature completion.
  const onStyleChanged = () => {
    const editTextDone = onboarding.steps.find((s) => s.id === "edit-text")?.completed;
    if (editTextDone) onboarding.completeStep("change-style");
  };

  composer.on(EVENTS.ELEMENT_CREATED, onElementCreated);
  composer.on(EVENTS.ELEMENT_EDIT_INLINE, onTextEdited);
  composer.on(EVENTS.ELEMENT_UPDATED, onStyleChanged);

  return () => {
    composer.off(EVENTS.ELEMENT_CREATED, onElementCreated);
    composer.off(EVENTS.ELEMENT_EDIT_INLINE, onTextEdited);
    composer.off(EVENTS.ELEMENT_UPDATED, onStyleChanged);
  };
}, [composer, onboarding.completeStep, onboarding.steps]);
```

**Step 5: Wire Preview and Publish → completeStep**

Find `onOpenPublish` prop passed to `StudioHeader` (around line 405):
```ts
onOpenPublish={() => state.openLeftPanelToTab("publish")}
```

Wrap it to also complete the "publish" step:
```ts
onOpenPublish={() => {
  state.openLeftPanelToTab("publish");
  onboarding.completeStep("publish");
}}
```

Find the preview handler. Look for `onSetPreviewLoading` or preview-related prop in `StudioHeader`. Add:
```ts
// In the preview handler or wherever onPreview fires:
onboarding.completeStep("preview");
```

Note: Preview completion fires when the user opens the preview mode. Find the exact prop name in `StudioHeader` props — it should be something like `onPreview` or inside a preview click handler. Add `onboarding.completeStep("preview")` in that handler.

**Step 6: Replace independent onboarding renders with orchestrated renders**

Find and remove (lines 451-458):
```tsx
<TourOverlay
  onNameProject={(name) => {
    composer?.updateProjectMetadata?.({ name });
  }}
  initialProjectName={
    composer?.getProjectMetadata?.()?.name || "Untitled Project"
  }
/>
```

Find and remove (line 512):
```tsx
<OnboardingProgress />
```

Replace both with the orchestrated block at the end of the main `<div>`, just before `</div>`:

```tsx
{/* ── Orchestrated Onboarding ─────────────────────────────────────── */}
{onboarding.phase === "modal" && (
  <OnboardingModal
    onComplete={() => {
      markOnboardingComplete();
      onboarding.advancePhase();
    }}
    onSkip={onboarding.skipAll}
  />
)}

{onboarding.phase === "tour" && (
  <TourOverlay
    step={onboarding.tourStep}
    onStepChange={onboarding.setTourStep}
    onComplete={onboarding.advancePhase}
    onSkip={onboarding.skipAll}
    onNameProject={(name) => {
      composer?.updateProjectMetadata?.({ name });
      onboarding.markProjectNamed();
    }}
    initialProjectName={
      composer?.getProjectMetadata?.()?.name || "Untitled Project"
    }
  />
)}

{onboarding.phase === "checklist" && (
  <OnboardingProgress
    steps={onboarding.steps}
    completedCount={onboarding.completedCount}
    totalCount={onboarding.totalCount}
    onDismiss={onboarding.skipAll}
  />
)}

{onboarding.achievement && (
  <AchievementPrompt
    completedStep={onboarding.achievement.completedStep}
    nextStep={onboarding.achievement.nextStep}
    isLastStep={onboarding.achievement.isLastStep}
    onDismiss={onboarding.dismissAchievement}
  />
)}
```

**Step 7: Verify**
Run: `npx tsc --noEmit` — no errors.

**Step 8: Commit**
```bash
git add src/editor/shell/AquibraStudio.tsx
git commit -m "feat(onboarding): wire orchestrator in AquibraStudio — single coordinated onboarding flow"
```

---

## Task 8: Update `onboarding/index.ts` Exports

**File:** `src/editor/onboarding/index.ts`
**Why:** New components and hooks need to be exported from the barrel file so other files can import cleanly.

**Step 1: Read the file**
Read `src/editor/onboarding/index.ts`.

**Step 2: Add new exports**

Current content:
```ts
export { OnboardingProgress } from "./OnboardingProgress";
export type { OnboardingProgressProps } from "./OnboardingProgress";
export { useOnboarding } from "../../shared/hooks/useOnboarding";
export type { OnboardingStep, OnboardingState } from "../../shared/hooks/useOnboarding";
```

Add after:
```ts
export { useOnboardingOrchestrator } from "./useOnboardingOrchestrator";
export type {
  OnboardingOrchestratorState,
  OnboardingPhase,
  AchievementPromptState,
} from "./useOnboardingOrchestrator";
export { AchievementPrompt } from "./AchievementPrompt";
export type { AchievementPromptProps } from "./AchievementPrompt";
```

**Step 3: Verify**
Run: `npx tsc --noEmit` — no errors.

**Step 4: Commit**
```bash
git add src/editor/onboarding/index.ts
git commit -m "chore(onboarding): export new orchestrator + AchievementPrompt from barrel"
```

---

## Task 9: Add Re-entry Point in Settings Panel

**Why:** Users who dismiss the checklist can replay the getting-started guide from Settings. This addresses Gap 13 — "Checklist dismiss is not recoverable."

**Step 1: Find the Settings panel**
Run: `grep -r "replayTour\|Getting started\|getting started" src/editor/sidebar/ --include="*.tsx" -l`
Then look at `src/editor/sidebar/tabs/` for the Config/Settings tab component.

**Step 2: Read the Settings panel file**
Read it in full to understand the structure.

**Step 3: Add re-entry button**

Find a logical place in the Settings panel (e.g., bottom of the main settings list, or a "Help" section). Add:

```tsx
{/* Getting started guide re-entry */}
<div style={{ padding: "16px", borderTop: "1px solid var(--aqb-border)" }}>
  <button
    type="button"
    onClick={onReplayTour}
    style={{
      width: "100%",
      padding: "10px 16px",
      background: "transparent",
      border: "1px solid var(--aqb-border)",
      borderRadius: 8,
      color: "var(--aqb-text-secondary)",
      fontSize: 13,
      cursor: "pointer",
      textAlign: "left",
    }}
  >
    Restart getting started guide →
  </button>
</div>
```

**Step 4: Wire `onReplayTour` prop**

The Settings panel will need an `onReplayTour?: () => void` prop. Pass `onboarding.replayTour` from `AquibraStudio` → `StudioPanels` → Settings panel.

Trace the prop chain:
- `AquibraStudio` passes to `StudioPanels`
- `StudioPanels` passes to `LeftSidebar`
- `LeftSidebar` passes to `TabRouter`
- `TabRouter` passes to the Settings/Config tab

Add `onReplayTour` to each component's props interface along the chain. This is prop drilling — add only what's needed, no refactoring of unrelated props.

**Step 5: Verify**
Run: `npx tsc --noEmit` — no errors.
Manually test: Open editor → dismiss checklist → open Settings → click "Restart getting started guide" → tour should replay.

**Step 6: Commit**
```bash
git add src/editor/sidebar/ src/editor/shell/
git commit -m "feat(onboarding): add re-entry point in Settings — restart getting started guide"
```

---

## Task 10: Final Integration Test

**Step 1: Start the dev server**
```bash
npm run dev
```
Open: `http://localhost:5050`

**Step 2: Test fresh user flow (clear localStorage first)**
```js
// In browser console:
Object.keys(localStorage)
  .filter(k => k.startsWith("aqb-") || k.startsWith("buildrik") || k.startsWith("aquibra"))
  .forEach(k => localStorage.removeItem(k));
location.reload();
```

Expected:
1. OnboardingModal appears (3 steps)
2. Click "Next" through all steps → Tour starts
3. Tour shows project naming step → type a name → click Next
4. Tour advances through 4 steps → on Finish → Checklist appears
5. Add an element to canvas → Achievement prompt fires → shows "Add an element ✓" + next step hint → auto-dismisses after 4s
6. Edit text on canvas → Achievement prompt fires
7. Change a style → Achievement prompt fires
8. Click Preview → Achievement prompt fires
9. Click Publish → Achievement prompt fires with "All done!" → Checklist goes away

**Step 3: Test skip flow**
Reload with cleared localStorage.
Click "Skip" on Modal → phase jumps to "done" → nothing shows. Correct.

**Step 4: Test returning user (old localStorage)**
```js
localStorage.setItem("buildrik_onboarding_complete", "true");
location.reload();
```
Expected: Modal skipped, Tour skipped, Checklist shown directly.

**Step 5: Test refresh mid-tour**
Start fresh → complete Modal → Tour shows on Step 2 → Reload page.
Expected: Tour resumes from Step 2 (not Step 0).

**Step 6: Test re-entry**
Complete all steps → open Settings → click "Restart getting started guide" → Tour plays from Step 0.

**Step 7: Test mobile viewport**
Resize browser to 375px wide. Tour should still show (centered fallback since rail targets won't align correctly at small sizes).

**Step 8: Run type check**
```bash
npx tsc --noEmit
```
No errors allowed.

**Step 9: Final commit**
```bash
git add -A
git commit -m "feat(onboarding): complete orchestrator integration — modal → tour → checklist with achievement prompts"
```

---

## File Change Summary

| File | Action | Why |
|------|--------|-----|
| `src/shared/constants/storageKeys.ts` | Modify | Add 3 new keys: ONBOARDING_PHASE, ONBOARDING_TOUR_STEP, ONBOARDING_PROJECT_NAMED |
| `src/editor/onboarding/useOnboardingOrchestrator.ts` | **Create** | Single brain — all phase state, migration, achievement logic |
| `src/editor/onboarding/AchievementPrompt.tsx` | **Create** | Game-like step completion overlay |
| `src/shared/ui/TourOverlay.tsx` | Modify | Accept controlled step + onComplete/onSkip props, remove internal replay-tour listener |
| `src/editor/onboarding/OnboardingProgress.tsx` | Modify | Become pure display component — accept all state as props |
| `src/editor/onboarding/OnboardingModal.tsx` | No change | Interface already correct — onComplete/onSkip props exist |
| `src/editor/shell/AquibraStudio.tsx` | Modify | Call orchestrator, wire composer events, orchestrate conditional renders |
| `src/editor/onboarding/index.ts` | Modify | Export new files |
| `src/editor/sidebar/tabs/[SettingsTab].tsx` | Modify | Add re-entry button |
| `src/editor/shell/StudioPanels.tsx` (likely) | Modify | Pass onReplayTour prop down the chain |

---

## What NOT to Change

- `src/shared/hooks/useOnboarding.ts` — Keep for backward compat. Orchestrator has its own copy of steps logic. If something imports `useOnboarding` directly, it still works.
- `src/engine/` — No engine changes needed.
- CSS/theme files — All styles inline in components using CSS variables.
- `src/editor/onboarding/OnboardingModal.tsx` — Interface already correct, no changes.
