/**
 * useOnboardingOrchestrator — L1-015 (owner, 2026-10-10): Getting-started
 * progress is server state per user × site. The pill and the checklist read
 * ONE computed view; real events record milestones; the dismissal is stored
 * apart from progress; nothing is global and nothing says "completed" on its
 * own.
 *
 * The old suite pinned the global `localStorage["buildrik-onboarding-progress"]`
 * (schema migrations, phase keys) — the very source that made a brand-new
 * site read "Done · 7 of 7". It is replaced, not patched.
 *
 * @license BSD-3-Clause
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { EditorOnboardingView } from "@buildrik/shared/schemas/onboarding";
import { DEFAULT_ONBOARDING_STEPS } from "@/shared/constants/onboardingSteps";

const svc = vi.hoisted(() => ({
  fetchEditorOnboarding: vi.fn(),
  recordEditorMilestone: vi.fn(),
  setEditorChecklistDismissed: vi.fn(),
}));
vi.mock("@/services/OnboardingService", () => svc);

import { useOnboardingOrchestrator, ACHIEVEMENT_AUTO_DISMISS_MS } from "../useOnboardingOrchestrator";

const STEP_IDS = DEFAULT_ONBOARDING_STEPS.map((s) => s.id);

function view(done: string[] = [], dismissed = false): EditorOnboardingView {
  const steps = Object.fromEntries(STEP_IDS.map((id) => [id, done.includes(id)])) as EditorOnboardingView["steps"];
  return { steps, completedCount: done.length, totalCount: STEP_IDS.length, dismissed, tipsSeen: [], tipsDismissed: [] };
}

async function mounted(siteId: string | null = "site-1") {
  const hook = renderHook(() => useOnboardingOrchestrator(siteId));
  await act(async () => {
    await Promise.resolve();
  });
  return hook;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  svc.fetchEditorOnboarding.mockResolvedValue(view());
  svc.recordEditorMilestone.mockResolvedValue(null);
  svc.setEditorChecklistDismissed.mockResolvedValue(null);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("one server view per user × site (L1-015)", () => {
  it("shows nothing until the site's own state has loaded — never a borrowed count", () => {
    svc.fetchEditorOnboarding.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useOnboardingOrchestrator("site-1"));
    expect(result.current.phase).toBe("loading");
  });

  it("reads the site's state, and the stale global key has no say", async () => {
    localStorage.setItem(
      "buildrik-onboarding-progress",
      JSON.stringify(DEFAULT_ONBOARDING_STEPS.map((s) => ({ ...s, completed: true }))),
    );
    localStorage.setItem("buildrik-onboarding-phase", "done");
    const { result } = await mounted("brand-new-site");
    expect(svc.fetchEditorOnboarding).toHaveBeenCalledWith("brand-new-site");
    expect(result.current.phase).toBe("active");
    expect(result.current.completedCount).toBe(0);
    expect(result.current.totalCount).toBe(7);
  });

  it("server-derived steps are ticked, and the first open step is the active one", async () => {
    svc.fetchEditorOnboarding.mockResolvedValue(view(["set-brand", "add-page"]));
    const { result } = await mounted();
    expect(result.current.completedCount).toBe(2);
    expect(result.current.steps.filter((s) => s.completed).map((s) => s.id)).toEqual(["set-brand", "add-page"]);
    expect(result.current.activeStepId).toBe("insert-section");
  });

  it("a dismissed site stays closed; a fully done site is not shown", async () => {
    svc.fetchEditorOnboarding.mockResolvedValueOnce(view(["set-brand"], true));
    expect((await mounted()).result.current.phase).toBe("done");
    svc.fetchEditorOnboarding.mockResolvedValueOnce(view(STEP_IDS));
    expect((await mounted()).result.current.phase).toBe("done");
  });

  it("with no site (the standalone demo) or an unreachable server it still works, in memory only", async () => {
    const { result } = await mounted(null);
    expect(svc.fetchEditorOnboarding).not.toHaveBeenCalled();
    expect(result.current.phase).toBe("active");
    act(() => result.current.completeStep("preview"));
    expect(result.current.completedCount).toBe(1);
    expect(svc.recordEditorMilestone).not.toHaveBeenCalled();
    expect(localStorage.getItem("buildrik-onboarding-progress")).toBeNull();
  });
});

describe("completing a step records the real event", () => {
  it("ticks at once and records the milestone for this site", async () => {
    const { result } = await mounted();
    act(() => result.current.completeStep("set-brand"));
    expect(result.current.steps[0].completed).toBe(true);
    expect(result.current.completedCount).toBe(1);
    expect(result.current.activeStepId).toBe("add-page");
    expect(svc.recordEditorMilestone).toHaveBeenCalledWith("site-1", "set-brand");
  });

  it("the server's answer replaces the view (both surfaces read it)", async () => {
    svc.recordEditorMilestone.mockResolvedValueOnce(view(["set-brand", "send-review"]));
    const { result } = await mounted();
    await act(async () => {
      result.current.completeStep("set-brand");
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.completedCount).toBe(2));
  });

  it("two completions in ONE tick both survive", async () => {
    const { result } = await mounted();
    act(() => {
      result.current.completeStep("insert-section");
      result.current.completeStep("connect-client");
    });
    expect(result.current.completedCount).toBe(2);
    expect(svc.recordEditorMilestone).toHaveBeenCalledTimes(2);
  });

  it("an already-done step is a no-op — no achievement, no request", async () => {
    svc.fetchEditorOnboarding.mockResolvedValue(view(["set-brand"]));
    const { result } = await mounted();
    act(() => result.current.completeStep("set-brand"));
    expect(result.current.achievement).toBeNull();
    expect(svc.recordEditorMilestone).not.toHaveBeenCalled();
  });

  it("a silent completion (seeded from the loaded project) records without an achievement", async () => {
    const { result } = await mounted();
    act(() => result.current.completeStep("insert-section", { silent: true }));
    expect(result.current.completedCount).toBe(1);
    expect(result.current.achievement).toBeNull();
    expect(svc.recordEditorMilestone).toHaveBeenCalledWith("site-1", "insert-section");
  });
});

describe("dismissal is stored apart from progress", () => {
  it("dismiss closes the checklist, stores it for this site, and completes nothing", async () => {
    svc.fetchEditorOnboarding.mockResolvedValue(view(["set-brand"]));
    const { result } = await mounted();
    act(() => result.current.dismiss());
    expect(result.current.phase).toBe("done");
    expect(result.current.completedCount).toBe(1);
    expect(svc.setEditorChecklistDismissed).toHaveBeenCalledWith("site-1", true);
  });

  it("reopen (Site menu → Getting started) shows the SAME progress, expanded — never a reset", async () => {
    svc.fetchEditorOnboarding.mockResolvedValue(view(STEP_IDS));
    const { result } = await mounted();
    expect(result.current.phase).toBe("done");
    act(() => result.current.reopen());
    expect(result.current.phase).toBe("active");
    expect(result.current.isMinimized).toBe(false);
    expect(result.current.completedCount).toBe(7);
    expect(svc.setEditorChecklistDismissed).toHaveBeenCalledWith("site-1", false);
  });

  it("starts minimized; restore/minimize toggle isMinimized", async () => {
    const { result } = await mounted();
    expect(result.current.isMinimized).toBe(true);
    act(() => result.current.restore());
    expect(result.current.isMinimized).toBe(false);
    act(() => result.current.minimize());
    expect(result.current.isMinimized).toBe(true);
  });
});

describe("achievement 4-second auto-dismiss", () => {
  it("exports a 4000ms auto-dismiss constant (SSOT with the countdown bar)", () => {
    expect(ACHIEVEMENT_AUTO_DISMISS_MS).toBe(4000);
  });

  it("completeStep raises an achievement with completed/next/isLastStep payload", async () => {
    const { result } = await mounted();
    act(() => result.current.completeStep("set-brand"));
    expect(result.current.achievement?.completedStep.id).toBe("set-brand");
    expect(result.current.achievement?.completedStep.completed).toBe(true);
    expect(result.current.achievement?.nextStep?.id).toBe("add-page");
    expect(result.current.achievement?.isLastStep).toBe(false);
  });

  it("auto-dismisses at exactly 4000ms", async () => {
    const { result } = await mounted();
    vi.useFakeTimers();
    act(() => result.current.completeStep("set-brand"));
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS - 1));
    expect(result.current.achievement).not.toBeNull();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.achievement).toBeNull();
    expect(result.current.phase).toBe("active");
  });

  it("after the final step's achievement the checklist closes — derived, nothing stored as 'completed'", async () => {
    svc.fetchEditorOnboarding.mockResolvedValue(view(STEP_IDS.slice(0, 6)));
    const { result } = await mounted();
    vi.useFakeTimers();
    act(() => result.current.completeStep("publish"));
    expect(result.current.achievement?.isLastStep).toBe(true);
    expect(result.current.phase).toBe("active");
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS));
    expect(result.current.phase).toBe("done");
    expect(svc.setEditorChecklistDismissed).not.toHaveBeenCalled();
  });

  it("manual dismissAchievement clears immediately and cancels the timer", async () => {
    const { result } = await mounted();
    vi.useFakeTimers();
    act(() => result.current.completeStep("set-brand"));
    act(() => result.current.dismissAchievement());
    expect(result.current.achievement).toBeNull();
    act(() => vi.advanceTimersByTime(ACHIEVEMENT_AUTO_DISMISS_MS * 2));
    expect(result.current.achievement).toBeNull();
    expect(result.current.phase).toBe("active");
  });
});
