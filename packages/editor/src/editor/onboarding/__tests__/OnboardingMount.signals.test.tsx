/**
 * The checklist ticks when the user does the thing.
 *
 * It used to complete a step ONLY when that step's own CTA was pressed — and
 * "Edit text" and "Style an element" have no CTA, so they could never be
 * ticked, the counter could never reach 7 of 7, and the achievement prompt's
 * "You're all set!" branch was unreachable.
 *
 * The suppression during a project load matters as much: importing a site
 * creates elements and styles by the hundred, and crediting the user for the
 * loader's work is the same lie pointing the other way.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";
import { EVENTS } from "../../../shared/constants";

const completeStep = vi.hoisted(() => vi.fn());
const orchestrator = vi.hoisted(() => ({
  steps: [] as Array<{ id: string; actionKey?: string }>,
  completedCount: 0,
  totalCount: 7,
  activeStepId: null,
  phase: "checklist",
  isMinimized: false,
  achievement: null,
  completeStep,
  setActiveStepId: vi.fn(),
  skipAll: vi.fn(),
  minimize: vi.fn(),
  dismissAchievement: vi.fn(),
}));

vi.mock("../useOnboardingOrchestrator", () => ({
  useOnboardingOrchestrator: () => orchestrator,
  ACHIEVEMENT_AUTO_DISMISS_MS: 4000,
}));
vi.mock("../OnboardingChecklist", () => ({ OnboardingChecklist: () => <div /> }));
vi.mock("../AchievementPrompt", () => ({ AchievementPrompt: () => <div /> }));

import { OnboardingMount } from "../OnboardingMount";

function fakeComposer() {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    on: (e: string, h: (p?: unknown) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (p?: unknown) => void) => handlers.get(e)?.delete(h),
    emit: (e: string, p?: unknown) => handlers.get(e)?.forEach((h) => h(p)),
    listenerCount: (e: string) => handlers.get(e)?.size ?? 0,
  };
}

beforeEach(() => completeStep.mockClear());

describe("OnboardingMount — real-action signals", () => {
  it("ticks the three doing-steps off engine events", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);

    act(() => c.emit(EVENTS.ELEMENT_INSERTED, {}));
    act(() => c.emit(EVENTS.ELEMENT_EDIT_INLINE, { elementId: "e1" }));
    act(() => c.emit(EVENTS.STYLE_CHANGED, {}));

    expect(completeStep.mock.calls.map((a) => a[0])).toEqual([
      "add-element",
      "edit-text",
      "change-style",
    ]);
  });

  it("credits nothing while a project is being imported", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);

    act(() => c.emit(EVENTS.PROJECT_LOADED, { importing: true }));
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, {}));
    act(() => c.emit(EVENTS.STYLE_CHANGED, {}));
    expect(completeStep).not.toHaveBeenCalled();

    // The second PROJECT_LOADED — plain project data — ends the import.
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, {}));
    expect(completeStep).toHaveBeenCalledWith("add-element");
  });

  it("unsubscribes on unmount", () => {
    const c = fakeComposer();
    const { unmount } = render(<OnboardingMount composer={c as never} />);
    expect(c.listenerCount(EVENTS.ELEMENT_INSERTED)).toBe(1);
    unmount();
    expect(c.listenerCount(EVENTS.ELEMENT_INSERTED)).toBe(0);
    expect(c.listenerCount(EVENTS.PROJECT_LOADED)).toBe(0);
  });
});
