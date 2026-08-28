/**
 * useOnboardingOrchestrator tests — schema v3 migration, phase loading,
 * step completion/progression, achievement 4-second auto-dismiss timing.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";
import {
  DEFAULT_ONBOARDING_STEPS,
  ONBOARDING_SCHEMA_VERSION,
} from "@/shared/constants/onboardingSteps";
import {
  useOnboardingOrchestrator,
  ACHIEVEMENT_AUTO_DISMISS_MS,
} from "../useOnboardingOrchestrator";

const STEP_IDS = DEFAULT_ONBOARDING_STEPS.map((s) => s.id);

/** Seed localStorage with a progress payload at a given schema version. */
function seedProgress(completedIds: string[], version: number = ONBOARDING_SCHEMA_VERSION) {
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION, String(version));
  localStorage.setItem(
    STORAGE_KEYS.ONBOARDING_PROGRESS,
    JSON.stringify(
      DEFAULT_ONBOARDING_STEPS.map((s) => ({
        ...s,
        completed: completedIds.includes(s.id),
      }))
    )
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// ─── Schema v3 migration ──────────────────────────────────────────────

describe("persisted-state schema v3 migration", () => {
  it("fresh storage → default steps and schema version stamped to v3", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.steps).toHaveLength(DEFAULT_ONBOARDING_STEPS.length);
    expect(result.current.steps.every((s) => !s.completed)).toBe(true);
    expect(result.current.completedCount).toBe(0);
    expect(result.current.totalCount).toBe(7);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION)).toBe(
      String(ONBOARDING_SCHEMA_VERSION)
    );
  });

  it("older-schema (v2) progress is discarded and version bumped to v3", () => {
    // Old payload claims two steps completed — must NOT survive the migration.
    seedProgress(["set-brand", "add-page"], 2);

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.steps.every((s) => !s.completed)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION)).toBe(
      String(ONBOARDING_SCHEMA_VERSION)
    );
  });

  it("missing schema-version key is treated as version 0 → migration runs", () => {
    // Progress present but no version key at all (pre-versioning payload).
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      JSON.stringify(DEFAULT_ONBOARDING_STEPS.map((s) => ({ ...s, completed: true })))
    );

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.completedCount).toBe(0);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS)).toBeNull();
  });

  it("v3 progress with matching ids restores completed flags", () => {
    seedProgress(["set-brand", "insert-section"]);

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.completedCount).toBe(2);
    expect(result.current.steps.find((s) => s.id === "set-brand")?.completed).toBe(true);
    expect(result.current.steps.find((s) => s.id === "insert-section")?.completed).toBe(true);
    expect(result.current.steps.find((s) => s.id === "add-page")?.completed).toBe(false);
  });

  it("v3 progress restores label/description from DEFAULTS, not from storage", () => {
    // Only the `completed` flag is merged — copy edits in the defaults win.
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
      String(ONBOARDING_SCHEMA_VERSION)
    );
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      JSON.stringify(
        DEFAULT_ONBOARDING_STEPS.map((s) => ({
          ...s,
          label: "STALE LABEL",
          completed: s.id === "set-brand",
        }))
      )
    );

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.steps[0].label).toBe(DEFAULT_ONBOARDING_STEPS[0].label);
    expect(result.current.steps[0].completed).toBe(true);
  });

  it("v3 progress with wrong step count resets to defaults and clears storage", () => {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
      String(ONBOARDING_SCHEMA_VERSION)
    );
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      JSON.stringify(
        DEFAULT_ONBOARDING_STEPS.slice(0, 4).map((s) => ({ ...s, completed: true }))
      )
    );

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.completedCount).toBe(0);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS)).toBeNull();
  });

  it("v3 progress with unknown step ids yields completed:false everywhere", () => {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
      String(ONBOARDING_SCHEMA_VERSION)
    );
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      JSON.stringify(
        DEFAULT_ONBOARDING_STEPS.map((s, i) => ({
          ...s,
          id: `retired-step-${i}`,
          completed: true,
        }))
      )
    );

    const { result } = renderHook(() => useOnboardingOrchestrator());

    // Same length so the length-guard passes, but no id matches → all reset.
    expect(result.current.completedCount).toBe(0);
    expect(result.current.steps.map((s) => s.id)).toEqual(STEP_IDS);
  });

  it("corrupt progress JSON falls back to defaults without throwing", () => {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
      String(ONBOARDING_SCHEMA_VERSION)
    );
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_PROGRESS, "{not-valid-json[");

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.steps).toHaveLength(7);
    expect(result.current.completedCount).toBe(0);
  });
});

// ─── Phase loading + legacy migration ─────────────────────────────────

describe("phase loading + legacy value migration", () => {
  /* Stamp the CURRENT schema version first: since v5 the migration wipes
     phase/dismiss state stored under an older version (see the wipe suite
     below), so these tests pin phase semantics for a current-version user. */
  beforeEach(() => {
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION,
      String(ONBOARDING_SCHEMA_VERSION)
    );
  });

  it("fresh storage → phase 'active'", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.phase).toBe("active");
  });

  it("stored 'done' → phase 'done'", () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, "done");
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.phase).toBe("done");
  });

  it.each(["modal", "tour", "checklist"])(
    "old 4-phase value '%s' migrates to 'active'",
    (legacy) => {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, legacy);
      const { result } = renderHook(() => useOnboardingOrchestrator());
      expect(result.current.phase).toBe("active");
    }
  );

  it("legacy 'aquibra-onboarding-dismissed' flag migrates to 'done'", () => {
    localStorage.setItem("aquibra-onboarding-dismissed", "true");
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.phase).toBe("done");
  });

  it("legacy ONBOARDING_DISMISSED boolean flag migrates to 'done'", () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, "true");
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.phase).toBe("done");
  });
});

// ─── v4 → v5 wipe (codex blocking finding, 2026-08-28) ────────────────

describe("a schema bump resets phase and dismissal, not just progress", () => {
  /* v5 changed what the seven steps ARE. Clearing only progress left a v4
     user whose phase said "done" permanently done — the agency-framed list
     would never show. The migration wipes the whole story. */
  it("a v4 user who finished or skipped comes back 'active' with a fresh list", () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION, "4");
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, "done");
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_DISMISSED, "true");
    localStorage.setItem("aquibra-onboarding-dismissed", "true");
    localStorage.setItem(
      STORAGE_KEYS.ONBOARDING_PROGRESS,
      JSON.stringify(DEFAULT_ONBOARDING_STEPS.map((s) => ({ ...s, completed: true })))
    );

    const { result } = renderHook(() => useOnboardingOrchestrator());

    expect(result.current.phase).toBe("active");
    expect(result.current.completedCount).toBe(0);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_DISMISSED)).toBeNull();
    expect(localStorage.getItem("aquibra-onboarding-dismissed")).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION)).toBe(
      String(ONBOARDING_SCHEMA_VERSION)
    );
  });

  it("the wipe is idempotent — a second load in the same session keeps state", () => {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION, "4");
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, "done");

    const first = renderHook(() => useOnboardingOrchestrator());
    act(() => first.result.current.completeStep("set-brand"));
    first.unmount();

    // StrictMode / remount: the version now matches, so nothing is wiped.
    const second = renderHook(() => useOnboardingOrchestrator());
    expect(second.result.current.completedCount).toBe(1);
    expect(second.result.current.phase).toBe("active");
  });
});

// ─── Step completion + progression ────────────────────────────────────

describe("step completion + progression", () => {
  it("starts with activeStepId on the first incomplete step", () => {
    seedProgress(["set-brand"]);
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.activeStepId).toBe("add-page");
  });

  it("all steps complete in storage → activeStepId is null", () => {
    seedProgress(STEP_IDS);
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.activeStepId).toBeNull();
    expect(result.current.completedCount).toBe(7);
  });

  it("completeStep marks the step, persists progress, advances activeStepId", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("set-brand"));

    expect(result.current.steps[0].completed).toBe(true);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.activeStepId).toBe("add-page");

    const persisted = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS)!
    ) as Array<{ id: string; completed: boolean }>;
    expect(persisted.find((s) => s.id === "set-brand")?.completed).toBe(true);
    expect(persisted.find((s) => s.id === "add-page")?.completed).toBe(false);
  });

  /* Both calls sit inside ONE act(). Every other case in this file gives each
     completion its own act(), which flushes a render between them — which is
     exactly why the suite could not see this bug: `stepsRef` was assigned during
     render, so two completions in one synchronous turn both read the pre-render
     value and the second write clobbered the first. One user action really does
     complete two steps (the emitter calls its handlers inline and three step
     signals share one composer), so the collision is constructed here rather
     than borrowed from an insert. */
  it("two completions in ONE tick both survive, in state and in storage", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => {
      result.current.completeStep("insert-section");
      result.current.completeStep("connect-client");
    });

    expect(result.current.completedCount).toBe(2);
    expect(result.current.steps.find((s) => s.id === "insert-section")?.completed).toBe(true);
    expect(result.current.steps.find((s) => s.id === "connect-client")?.completed).toBe(true);

    const persisted = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS)!
    ) as Array<{ id: string; completed: boolean }>;
    expect(persisted.find((s) => s.id === "insert-section")?.completed).toBe(true);
    expect(persisted.find((s) => s.id === "connect-client")?.completed).toBe(true);
  });

  /* replayAll writes stepsRef too. It used to self-heal through the render-time
     assignment; without this the first completion after a replay would resurrect
     the pre-replay list. */
  it("a completion right after replayAll starts from the fresh list", () => {
    seedProgress(["set-brand", "add-page", "insert-section"]);
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.completedCount).toBe(3);

    act(() => {
      result.current.replayAll();
      result.current.completeStep("insert-section");
    });

    expect(result.current.completedCount).toBe(1);
    expect(result.current.steps.find((s) => s.id === "set-brand")?.completed).toBe(false);
  });

  it("completeStep skips over already-completed steps when advancing", () => {
    seedProgress(["add-page"]);
    const { result } = renderHook(() => useOnboardingOrchestrator());

    // Completing step 0 must land on step 2 ("insert-section"), not the
    // already-done "add-page".
    act(() => result.current.completeStep("set-brand"));
    expect(result.current.activeStepId).toBe("insert-section");
  });

  it("completeStep on an already-completed step is a no-op (no achievement fired)", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("set-brand"));
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS));
    expect(result.current.achievement).toBeNull();

    act(() => result.current.completeStep("set-brand"));

    expect(result.current.achievement).toBeNull();
    expect(result.current.completedCount).toBe(1);
  });

  it("completing the LAST step first sets activeStepId to null (forward-only scan)", () => {
    // PIN: the next-incomplete search only scans FORWARD from the completed
    // index (next.slice(completedIndex + 1)) — it never wraps around to
    // earlier incomplete steps. Completing "publish" first leaves the
    // accordion with no expanded step and achievement.nextStep = null even
    // though 6 earlier steps are still incomplete. Pinned current behavior.
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("publish"));

    expect(result.current.activeStepId).toBeNull();
    expect(result.current.achievement?.nextStep).toBeNull();
    expect(result.current.achievement?.isLastStep).toBe(false);
  });

  it("skipAll flips phase to 'done' and persists it", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.skipAll());

    expect(result.current.phase).toBe("done");
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PHASE)).toBe("done");
  });

  it("replayAll resets steps, phase, activeStepId, and un-minimizes", () => {
    seedProgress(["set-brand", "add-page"]);
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_PHASE, "done");
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.phase).toBe("done");

    act(() => result.current.replayAll());

    expect(result.current.phase).toBe("active");
    expect(result.current.completedCount).toBe(0);
    expect(result.current.activeStepId).toBe("set-brand");
    expect(result.current.isMinimized).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PROGRESS)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PHASE)).toBe("active");
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_SCHEMA_VERSION)).toBe(
      String(ONBOARDING_SCHEMA_VERSION)
    );
  });

  it("starts minimized; restore/minimize toggle isMinimized", () => {
    // PIN: redesign P6 "calm first load" — the checklist ALWAYS mounts as the
    // minimized pill (isMinimized initial state is hardcoded true), never the
    // full panel, so it doesn't fight the WelcomeModal on first paint.
    const { result } = renderHook(() => useOnboardingOrchestrator());
    expect(result.current.isMinimized).toBe(true);

    act(() => result.current.restore());
    expect(result.current.isMinimized).toBe(false);

    act(() => result.current.minimize());
    expect(result.current.isMinimized).toBe(true);
  });
});

// ─── Achievement 4-second auto-dismiss ────────────────────────────────

describe("achievement 4-second auto-dismiss", () => {
  it("exports a 4000ms auto-dismiss constant (SSOT with the countdown bar)", () => {
    // PIN: orchestrator setTimeout AND AchievementPrompt's progress bar both
    // consume ACHIEVEMENT_AUTO_DISMISS_MS so they stay in sync (audit Pattern D).
    expect(ACHIEVEMENT_AUTO_DISMISS_MS).toBe(4000);
  });

  it("completeStep raises an achievement with completed/next/isLastStep payload", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("set-brand"));

    expect(result.current.achievement).not.toBeNull();
    expect(result.current.achievement?.completedStep.id).toBe("set-brand");
    expect(result.current.achievement?.completedStep.completed).toBe(true);
    expect(result.current.achievement?.nextStep?.id).toBe("add-page");
    expect(result.current.achievement?.isLastStep).toBe(false);
  });

  it("achievement survives 3999ms and auto-dismisses at exactly 4000ms", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("set-brand"));

    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS - 1));
    expect(result.current.achievement).not.toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.achievement).toBeNull();
    // Not the last step → phase stays active after auto-dismiss.
    expect(result.current.phase).toBe("active");
  });

  it("completing another step within the window resets the 4s timer", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("set-brand"));
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.completeStep("add-page"));

    // 3999ms after the SECOND completion (5999ms total) — still visible,
    // and showing the second step.
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS - 1));
    expect(result.current.achievement?.completedStep.id).toBe("add-page");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.achievement).toBeNull();
  });

  it("auto-dismiss after the final step flips phase to 'done' and persists", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    for (const id of STEP_IDS) {
      act(() => result.current.completeStep(id));
    }

    expect(result.current.achievement?.isLastStep).toBe(true);
    expect(result.current.phase).toBe("active"); // not done until dismiss

    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS));

    expect(result.current.achievement).toBeNull();
    expect(result.current.phase).toBe("done");
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PHASE)).toBe("done");
  });

  it("manual dismissAchievement clears immediately and cancels the timer", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    act(() => result.current.completeStep("set-brand"));
    act(() => result.current.dismissAchievement());

    expect(result.current.achievement).toBeNull();
    expect(result.current.phase).toBe("active");

    // Advancing past the original deadline changes nothing — timer cleared.
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS * 2));
    expect(result.current.achievement).toBeNull();
    expect(result.current.phase).toBe("active");
  });

  it("manual dismiss of the LAST-step achievement flips phase to 'done' immediately", () => {
    const { result } = renderHook(() => useOnboardingOrchestrator());

    for (const id of STEP_IDS) {
      act(() => result.current.completeStep(id));
    }
    act(() => result.current.dismissAchievement());

    expect(result.current.phase).toBe("done");
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_PHASE)).toBe("done");
  });
});
