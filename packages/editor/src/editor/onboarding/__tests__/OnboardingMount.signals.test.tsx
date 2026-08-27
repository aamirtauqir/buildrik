/**
 * The checklist ticks when the user does the thing — and only then.
 *
 * It used to complete a step when that step's own CTA was pressed, so "Name
 * your project" ticked when Settings opened over an unchanged name and
 * "Publish your site" ticked when the publish PANEL opened over a site that
 * had never been deployed. The list could read 7 of 7 having done none of the
 * seven things. Every row is now credited from an outcome.
 *
 * Two directions of lie are tested here, not one:
 *   · crediting work the user did not do (a CTA press, a loader's elements,
 *     an inserted element's own default styles)
 *   · failing to credit work already done before the editor opened
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";
import { EVENTS } from "../../../shared/constants";

const completeStep = vi.hoisted(() => vi.fn());
const replayAll = vi.hoisted(() => vi.fn());
const restore = vi.hoisted(() => vi.fn());
const orchestrator = vi.hoisted(() => ({
  steps: [
    { id: "name-project", actionKey: "open-project-name" },
    { id: "publish", actionKey: "trigger-publish" },
  ] as Array<{ id: string; actionKey?: string }>,
  completedCount: 0,
  totalCount: 7,
  activeStepId: null,
  phase: "active",
  isMinimized: false,
  achievement: null,
  completeStep,
  setActiveStepId: vi.fn(),
  skipAll: vi.fn(),
  minimize: vi.fn(),
  dismissAchievement: vi.fn(),
  replayAll,
  restore,
}));

vi.mock("../useOnboardingOrchestrator", () => ({
  useOnboardingOrchestrator: () => orchestrator,
  ACHIEVEMENT_AUTO_DISMISS_MS: 4000,
}));
let lastChecklistProps: { onAction: (k: string) => void } | null = null;
vi.mock("../OnboardingChecklist", () => ({
  OnboardingChecklist: (p: { onAction: (k: string) => void }) => {
    lastChecklistProps = p;
    return <div />;
  },
}));
vi.mock("../AchievementPrompt", () => ({ AchievementPrompt: () => <div /> }));

import { OnboardingMount } from "../OnboardingMount";

/** `name` and `elements` are what the seeding reads. Empty by default: a blank,
 *  unnamed project seeds nothing, which is the case that must not over-credit. */
function fakeComposer({ name = "", elements = [] as string[] } = {}) {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  return {
    on: (e: string, h: (p?: unknown) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (p?: unknown) => void) => handlers.get(e)?.delete(h),
    emit: (e: string, p?: unknown) => handlers.get(e)?.forEach((h) => h(p)),
    listenerCount: (e: string) => handlers.get(e)?.size ?? 0,
    getProjectMetadata: () => ({ name }),
    elements: {
      getActivePage: () => ({ root: { id: "root" } }),
      getAllElements: () => [{ getId: () => "root" }, ...elements.map((id) => ({ getId: () => id }))],
    },
  };
}

const ids = () => completeStep.mock.calls.map((a) => a[0] as string);

beforeEach(() => {
  vi.useFakeTimers();
  completeStep.mockClear();
  replayAll.mockClear();
  restore.mockClear();
  lastChecklistProps = null;
});
afterEach(() => vi.useRealTimers());

describe("OnboardingMount — outcomes, not intentions", () => {
  it("ticks each step off the event that means it actually happened", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);

    act(() => c.emit(EVENTS.PROJECT_METADATA_CHANGED, {}));
    act(() => c.emit(EVENTS.TEMPLATE_APPLIED, {}));
    act(() => c.emit(EVENTS.ELEMENT_EDIT_INLINE, { elementId: "e1" }));
    act(() => c.emit(EVENTS.UI_TOGGLE_PREVIEW, {}));
    act(() => c.emit(EVENTS.SITE_PUBLISHED, { jobId: "j1" }));

    expect(ids()).toEqual(["name-project", "pick-start", "edit-text", "preview", "publish"]);
  });

  it("pressing a step's CTA opens the door and credits NOTHING", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => lastChecklistProps!.onAction("trigger-publish"));
    // The panel opens…
    expect(completeStep).not.toHaveBeenCalled();
    // …and only a real deploy ticks the row.
    act(() => c.emit(EVENTS.SITE_PUBLISHED, { jobId: "j1" }));
    expect(ids()).toEqual(["publish"]);
  });

  it("an inserted element's own default styles are not a style the user chose", () => {
    // One drag emits four style:changed before its element:inserted. Both rows
    // ticking off one drag is the same lie as neither.
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => {
      c.emit(EVENTS.STYLE_CHANGED, {});
      c.emit(EVENTS.STYLE_CHANGED, {});
      c.emit(EVENTS.ELEMENT_INSERTED, {});
    });
    act(() => vi.advanceTimersByTime(1000));
    expect(ids()).toEqual(["add-element"]);
  });

  it("the insert is judged against the style event's own clock, not the timer's", () => {
    /* The first version of this guard asked "has it been longer than the grace
       window since the last insert?" AT FIRE TIME — which compares the insert
       against the timer's own delay, a quantity that is always at least the
       grace window. It skipped correctly under frozen fake timers and credited
       the row on every real drag. Fake timers cannot reproduce a millisecond of
       scheduling jitter, so this pins the SEMANTIC instead: the insert is
       compared to when the style fired.

       Live is the verifier for the jitter itself — walked 2026-08-27: one drag
       credits add-element and nothing else; a Font size change credits
       change-style. */
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => {
      c.emit(EVENTS.STYLE_CHANGED, {});
      c.emit(EVENTS.ELEMENT_INSERTED, {});
    });
    // Well past the window — the old fire-time comparison credited here.
    act(() => vi.advanceTimersByTime(60_000));
    expect(ids()).toEqual(["add-element"]);
  });

  it("a style change on its own still ticks, once the grace window passes", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.STYLE_CHANGED, {}));
    act(() => vi.advanceTimersByTime(1000));
    expect(ids()).toEqual(["change-style"]);
  });

  it("credits nothing while a project is being imported", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);

    act(() => c.emit(EVENTS.PROJECT_LOADED, { importing: true }));
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, {}));
    act(() => c.emit(EVENTS.STYLE_CHANGED, {}));
    act(() => vi.advanceTimersByTime(1000));
    expect(completeStep).not.toHaveBeenCalled();

    // The second PROJECT_LOADED — plain project data — ends the import.
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, {}));
    expect(ids()).toContain("add-element");
  });

  describe("work finished before the editor opened", () => {
    it("a named project with content seeds both rows", () => {
      const c = fakeComposer({ name: "Bella Cucina", elements: ["e1"] });
      render(<OnboardingMount composer={c as never} />);
      expect(ids()).toEqual(["name-project", "pick-start"]);
    });

    it("a placeholder name is not a named project", () => {
      const c = fakeComposer({ name: "Untitled site", elements: ["e1"] });
      render(<OnboardingMount composer={c as never} />);
      expect(ids()).toEqual(["pick-start"]);
    });

    it("an empty canvas has no starting point yet", () => {
      const c = fakeComposer({ name: "Bella Cucina" });
      render(<OnboardingMount composer={c as never} />);
      expect(ids()).toEqual(["name-project"]);
    });

    it("re-seeds when the project finally arrives, not just at mount", () => {
      // The editor mounts before the project loads; seeding only at mount reads
      // an empty composer and credits nothing, forever.
      const c = fakeComposer();
      render(<OnboardingMount composer={c as never} />);
      expect(completeStep).not.toHaveBeenCalled();
      c.getProjectMetadata = () => ({ name: "Bella Cucina" });
      act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
      expect(ids()).toEqual(["name-project"]);
    });
  });

  it("the checklist can be re-opened after it was skipped", () => {
    // `replayAll` had no caller anywhere in the product: Skip was permanent and
    // global — dismiss once and no site ever offered the checklist again.
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.UI_ONBOARDING_REPLAY, {}));
    expect(replayAll).toHaveBeenCalledOnce();
    expect(restore).toHaveBeenCalledOnce();
  });

  it("unsubscribes on unmount", () => {
    const c = fakeComposer();
    const { unmount } = render(<OnboardingMount composer={c as never} />);
    expect(c.listenerCount(EVENTS.ELEMENT_INSERTED)).toBeGreaterThan(0);
    unmount();
    for (const e of [
      EVENTS.ELEMENT_INSERTED,
      EVENTS.STYLE_CHANGED,
      EVENTS.PROJECT_LOADED,
      EVENTS.UI_ONBOARDING_REPLAY,
    ]) {
      expect(c.listenerCount(e)).toBe(0);
    }
  });
});
