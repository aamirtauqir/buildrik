/**
 * The checklist ticks when the user does the thing — and only then.
 *
 * v5 (board 296:1972): the steps are agency-framed — brand, page, section,
 * client, review, preview, publish. Every row is credited from an outcome
 * event, never a CTA press. Two directions of lie are tested here:
 *   · crediting work the user did not do (a CTA press, a loader's pages)
 *   · failing to credit work already done before the editor opened
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import * as React from "react";
import { EVENTS } from "@/shared/constants";

const completeStep = vi.hoisted(() => vi.fn());
const reopen = vi.hoisted(() => vi.fn());
const orchestratorSiteIds = vi.hoisted(() => [] as Array<string | null>);
const orchestrator = vi.hoisted(() => ({
  steps: [
    { id: "set-brand", actionKey: "open-brand" },
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
  dismiss: vi.fn(),
  minimize: vi.fn(),
  restore: vi.fn(),
  dismissAchievement: vi.fn(),
  reopen,
}));

vi.mock("../useOnboardingOrchestrator", () => ({
  useOnboardingOrchestrator: (siteId: string | null) => {
    orchestratorSiteIds.push(siteId);
    return orchestrator;
  },
  ACHIEVEMENT_AUTO_DISMISS_MS: 4000,
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-from-url" }));
let lastChecklistProps: { onAction: (k: string) => void } | null = null;
vi.mock("../OnboardingChecklist", () => ({
  OnboardingChecklist: (p: { onAction: (k: string) => void }) => {
    lastChecklistProps = p;
    return <div />;
  },
}));
vi.mock("../AchievementPrompt", () => ({ AchievementPrompt: () => <div /> }));

import { OnboardingMount } from "../OnboardingMount";

/** `pages` and `elements` are what the seeding reads. One empty page by
 *  default: a fresh site seeds nothing, which is the case that must not
 *  over-credit. */
function fakeComposer({ pages = 1, sectionTypes = [] as string[] } = {}) {
  const handlers = new Map<string, Set<(p?: unknown) => void>>();
  /* Mutable, because `page:created` is now read against the page COUNT: the
     editor bootstraps one page for you, so only a SECOND page is the user
     adding one. A frozen count could not tell the two apart, which is exactly
     how the phantom credit survived. */
  let pageCount = pages;
  return {
    setPages: (n: number) => { pageCount = n; },
    on: (e: string, h: (p?: unknown) => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: (p?: unknown) => void) => handlers.get(e)?.delete(h),
    emit: (e: string, p?: unknown) => handlers.get(e)?.forEach((h) => h(p)),
    listenerCount: (e: string) => handlers.get(e)?.size ?? 0,
    elements: {
      getAllPages: () => Array.from({ length: pageCount }, (_, i) => ({ id: `p${i}` })),
      getAllElements: () =>
        sectionTypes.map((t, i) => ({ getId: () => `e${i}`, getType: () => t })),
    },
  };
}

const ids = () => completeStep.mock.calls.map((a) => a[0] as string);

beforeEach(() => {
  completeStep.mockClear();
  reopen.mockClear();
  orchestratorSiteIds.length = 0;
  lastChecklistProps = null;
});

describe("OnboardingMount — outcomes, not intentions", () => {
  it("asks for THIS site's state (L1-015 — per user × site, never global)", () => {
    render(<OnboardingMount composer={fakeComposer() as never} />);
    expect(orchestratorSiteIds[0]).toBe("site-from-url");
  });

  it("ticks each step off the event that means it actually happened", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);

    act(() => c.emit(EVENTS.BRAND_APPLIED, undefined));
    // A page BEYOND the bootstrap one — the project now holds two.
    act(() => { c.setPages(2); c.emit(EVENTS.PROJECT_CHANGED, { type: "page:created", page: { id: "p2" } }); });
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, { elementId: "e1", blockId: "hero" }));
    act(() => c.emit(EVENTS.UI_TOGGLE_PREVIEW, {}));
    act(() => c.emit(EVENTS.SITE_PUBLISHED, { jobId: "j1" }));

    expect(ids()).toEqual(["set-brand", "add-page", "insert-section", "preview", "publish"]);
  });

  it("pressing a step's CTA opens the door and credits NOTHING", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => lastChecklistProps!.onAction("trigger-publish"));
    expect(completeStep).not.toHaveBeenCalled();
    act(() => c.emit(EVENTS.SITE_PUBLISHED, { jobId: "j1" }));
    expect(ids()).toEqual(["publish"]);
  });

  it("a bare element drop is not a section", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, { elementId: "e1", type: "text" }));
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, { elementId: "e2", blockId: "button" }));
    expect(completeStep).not.toHaveBeenCalled();
    // The ElementManager path names a type, the registry path a blockId —
    // either saying "section" counts.
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, { elementId: "e3", type: "section" }));
    expect(ids()).toEqual(["insert-section"]);
  });

  /* THE BOOTSTRAP PAGE IS NOT THE USER'S PAGE. `useComposerInit` creates one
     when storage holds nothing, and it emits `page:created` outside any
     import — so a brand-new project ticked "Add your first page" on first
     paint, fired the achievement overlay for work nobody did, and left the
     S1.1 rail coach (which needs completedCount === 0) unreachable. Measured
     live at :5050 before the fix: 1/7 done four seconds after boot. */
  it("the editor's own bootstrap page credits nothing", () => {
    const c = fakeComposer({ pages: 1 });
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.PROJECT_CHANGED, { type: "page:created", page: { id: "p0" } }));
    expect(completeStep).not.toHaveBeenCalled();
  });

  it("a PROJECT_CHANGED that is not page:created credits nothing", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.PROJECT_CHANGED, { type: "page:activated" }));
    act(() => c.emit(EVENTS.PROJECT_CHANGED, undefined));
    expect(completeStep).not.toHaveBeenCalled();
  });

  it("any review send ticks send-review; only an emailed one connects the client", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.REVIEW_SENT, { invitedEmail: null }));
    expect(ids()).toEqual(["send-review"]);
    act(() => c.emit(EVENTS.REVIEW_SENT, { invitedEmail: "client@site.io" }));
    expect(ids()).toEqual(["send-review", "send-review", "connect-client"]);
  });

  it("credits nothing while a project is being imported", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);

    act(() => c.emit(EVENTS.PROJECT_LOADED, { importing: true }));
    act(() => { c.setPages(9); c.emit(EVENTS.PROJECT_CHANGED, { type: "page:created" }); });
    act(() => c.emit(EVENTS.ELEMENT_INSERTED, { blockId: "hero" }));
    expect(completeStep).not.toHaveBeenCalled();

    // The second PROJECT_LOADED — plain project data — ends the import.
    act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
    act(() => c.emit(EVENTS.PROJECT_CHANGED, { type: "page:created" }));
    expect(ids()).toContain("add-page");
  });

  describe("work finished before the editor opened", () => {
    /* Seeds are silent: they record what the loaded project already shows,
       and must not fire the achievement overlay on open. (Review rounds and
       publishes are derived by the server now, so nothing is fetched here.) */
    it("a second page and a section seed their rows, silently", () => {
      const c = fakeComposer({ pages: 2, sectionTypes: ["container", "section"] });
      render(<OnboardingMount composer={c as never} />);
      expect(ids()).toEqual(["add-page", "insert-section"]);
      expect(completeStep.mock.calls.every((a) => (a[1] as { silent?: boolean } | undefined)?.silent === true)).toBe(true);
    });

    it("one page of bare elements seeds nothing", () => {
      const c = fakeComposer({ pages: 1, sectionTypes: ["container", "text"] });
      render(<OnboardingMount composer={c as never} />);
      expect(ids()).toEqual([]);
    });

    it("re-seeds when the project finally arrives, not just at mount", () => {
      const c = fakeComposer();
      render(<OnboardingMount composer={c as never} />);
      expect(completeStep).not.toHaveBeenCalled();
      c.elements.getAllPages = () => [{ id: "p0" }, { id: "p1" }];
      act(() => c.emit(EVENTS.PROJECT_LOADED, { pages: [] }));
      expect(ids()).toEqual(["add-page"]);
    });
  });

  it("Site menu → Getting started reopens the checklist — it never resets progress", () => {
    const c = fakeComposer();
    render(<OnboardingMount composer={c as never} />);
    act(() => c.emit(EVENTS.UI_ONBOARDING_REPLAY, {}));
    expect(reopen).toHaveBeenCalledOnce();
  });

  it("unsubscribes on unmount", () => {
    const c = fakeComposer();
    const { unmount } = render(<OnboardingMount composer={c as never} />);
    expect(c.listenerCount(EVENTS.ELEMENT_INSERTED)).toBeGreaterThan(0);
    unmount();
    for (const e of [
      EVENTS.ELEMENT_INSERTED,
      EVENTS.PROJECT_CHANGED,
      EVENTS.REVIEW_SENT,
      EVENTS.PROJECT_LOADED,
      EVENTS.UI_ONBOARDING_REPLAY,
    ]) {
      expect(c.listenerCount(e)).toBe(0);
    }
  });
});
