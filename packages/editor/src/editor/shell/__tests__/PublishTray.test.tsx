/**
 * PublishTray — design-2l9 Task 1.7 (boards Publish v2 `499:2656`, B8-PB01
 * `233:2` and the B8-PB* states). One CTA with its reason under it; the
 * topbar's Publish is only the toggle.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants";
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";
import { VERCEL_CHECK_LABEL } from "@buildrik/shared/schemas/publish";

const checksState: { checkState: "loading" | "ready" | "error"; checks: PrePublishChecksResult | null } = {
  checkState: "ready",
  checks: null,
};
vi.mock("@/editor/sidebar/tabs/publish/usePrePublishChecks", () => ({
  usePrePublishChecks: () => ({ ...checksState, reload: vi.fn() }),
}));
vi.mock("@/editor/sidebar/tabs/publish/usePublishSnapshot", async (orig) => ({
  ...(await orig<typeof import("@/editor/sidebar/tabs/publish/usePublishSnapshot")>()),
  usePublishSnapshot: () => ({
    production: { label: "Production", value: "fieldwork.studio" },
    preview: { label: "Preview", value: null },
    changes: [],
    changeCount: 0,
    pageCount: 2,
    pageNames: ["Home", "Work"],
    lastDeploy: { version: 12, when: "2d", rawAt: new Date(Date.now() - 2 * 86_400_000).toISOString(), isLive: true },
    loading: false,
    error: false,
    reload: vi.fn(),
  }),
}));
const cms = {
  blocker: null as string | null,
  failure: null as null | { reason: string; attempts: number; since: number; open: { collectionId: string; recordId?: string } | null },
  retry: vi.fn(async () => undefined),
};
vi.mock("@/services/cmsSync", () => ({
  cmsSyncBlocker: () => cms.blocker,
  cmsSyncFailure: () => cms.failure,
  onCmsSyncError: () => () => {},
  retryCmsSync: () => cms.retry(),
}));
vi.mock("@/services/BuildrikSyncProvider", () => ({ getSiteIdFromUrl: () => "site-1" }));
const locateComment = vi.fn(() => "located");
vi.mock("@/editor/sidebar/tabs/review/locate", () => ({ locateComment: (...a: unknown[]) => locateComment(...(a as [])) }));

import { PublishTray } from "../PublishTray";
import { publishTray, usePublishTray } from "../publishTrayStore";
import { deriveLifecycleState, type LifecycleInput, type NextMove } from "../lifecycle";
import type { UsePublishJobResult } from "../hooks/usePublishJob";
import type { Issue } from "../hooks/useStudioState";

function job(over: Partial<UsePublishJobResult> = {}): UsePublishJobResult {
  return {
    uiState: "idle",
    jobId: null,
    deploymentId: null,
    progress: 0,
    publishedUrl: "https://fieldwork.studio",
    error: null,
    steps: null,
    blockedReason: null,
    publish: vi.fn(),
    cancel: vi.fn(),
    track: vi.fn(),
    reset: vi.fn(),
    lastPublishedAt: null,
    hasUnpublishedChanges: null,
    dismissBlock: vi.fn(),
    unpublished: vi.fn(),
    pollLost: false,
    ...over,
  };
}

const base: LifecycleInput = {
  reviewState: "none",
  reviewsEnabled: false,
  editsRequireApproval: false,
  isPublished: true,
  hasUnpublishedChanges: true,
  isViewer: false,
  publishEnabled: true,
  offline: false,
  errorCount: 0,
};
const move = (over: Partial<LifecycleInput> = {}): NextMove | null => deriveLifecycleState({ ...base, ...over });

function makeComposer(zoom = 100) {
  const handlers = new Map<string, (d?: unknown) => void>();
  const state = { zoom };
  const composer = {
    on: vi.fn((e: string, h: (d?: unknown) => void) => handlers.set(e, h)),
    off: vi.fn(),
    emit: vi.fn((e: string, d?: unknown) => handlers.get(e)?.(d)),
    getState: () => state,
    setZoom: vi.fn((z: number) => {
      state.zoom = z;
    }),
    getProjectMetadata: () => ({ name: "Fieldwork Studio" }),
    selection: { select: vi.fn() },
    elements: { getElement: vi.fn() },
    designSystem: { tokenUsage: { getBreakdown: () => [] } },
  };
  return { composer, state, handlers };
}

interface Opts {
  nextMove?: NextMove | null;
  publishJob?: UsePublishJobResult;
  issues?: Issue[];
  onRequestPublish?: (() => void) | null;
  composer?: ReturnType<typeof makeComposer>["composer"];
}

function renderTray(o: Opts = {}) {
  const onRequestPublish = o.onRequestPublish === null ? undefined : (o.onRequestPublish ?? vi.fn());
  const composer = o.composer ?? makeComposer().composer;
  const utils = render(
    <ToastProvider>
      <PublishTray
        composer={composer as never}
        publishJob={o.publishJob ?? job()}
        nextMove={"nextMove" in o ? (o.nextMove ?? null) : move()}
        onRequestPublish={onRequestPublish}
        issues={o.issues ?? []}
      />
    </ToastProvider>,
  );
  return { ...utils, onRequestPublish, composer };
}

const cta = () => screen.getByTestId("publish-tray-cta");
const reason = () => screen.queryByTestId("publish-tray-reason")?.textContent ?? null;

beforeEach(() => {
  checksState.checkState = "ready";
  checksState.checks = { ready: true, checks: [] } as unknown as PrePublishChecksResult;
  cms.blocker = null;
  cms.failure = null;
  cms.retry.mockClear();
  locateComment.mockClear();
});
afterEach(() => {
  cleanup();
  publishTray.close();
});

describe("PublishTray — one CTA", () => {
  it("one CTA; reason \"Fix {n} blocking issue(s) to publish\" when n>0", () => {
    const issues: Issue[] = [
      { id: "a", type: "error", message: "Collection list “Latest posts” has no source", elementId: "el-1" },
      { id: "b", type: "error", message: "Broken link", elementId: "el-2" },
    ];
    renderTray({ nextMove: move({ errorCount: 2 }), issues });
    expect(screen.getAllByRole("button", { name: /^Publish/ })).toHaveLength(1);
    expect(cta()).toBeDisabled();
    expect(cta().textContent).toBe("Publish changes");
    expect(reason()).toBe("Fix 2 blocking issues to publish");
    expect(screen.getByText("2 blocking")).toBeTruthy();
  });

  it("says issue, singular, for one", () => {
    renderTray({ nextMove: move({ errorCount: 1 }), issues: [{ id: "a", type: "error", message: "x" }] });
    expect(reason()).toBe("Fix 1 blocking issue to publish");
  });
});

describe("PublishTray — states (B8-PB* copy)", () => {
  it("nothing to publish: \"Up to date\", disabled, no unpublished changes", () => {
    renderTray({ nextMove: null });
    expect(cta().textContent).toBe("Up to date");
    expect(cta()).toBeDisabled();
    expect(screen.getByTestId("publish-tray-changes").textContent).toBe("No unpublished changes");
  });

  it("warnings only: the CTA stays enabled and opens the shell's publish door", () => {
    const { onRequestPublish } = renderTray({
      issues: [{ id: "w", type: "warning", message: "2 images have no alt text", elementId: "img" }],
    });
    expect(cta()).not.toBeDisabled();
    expect(screen.getByText("1 tip")).toBeTruthy();
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
  });

  it("no Vercel connection: the CTA is \"Connect Vercel\" and opens the integrations page", () => {
    checksState.checks = {
      ready: false,
      checks: [{ label: VERCEL_CHECK_LABEL, status: "fail", detail: "No Vercel account connected." }],
    } as unknown as PrePublishChecksResult;
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    renderTray({ nextMove: move({ errorCount: 1 }) });
    expect(cta().textContent).toBe("Connect Vercel");
    fireEvent.click(cta());
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/dashboard/settings/integrations"), "_blank", "noopener");
    open.mockRestore();
  });

  it("first publish vs republish: label and status card follow the site", () => {
    renderTray({ nextMove: move({ isPublished: false, hasUnpublishedChanges: null }), publishJob: job({ publishedUrl: null }) });
    expect(cta().textContent).toBe("Publish");
    expect(screen.getByText("Not live yet")).toBeTruthy();
    cleanup();
    renderTray();
    expect(cta().textContent).toBe("Publish changes");
    expect(screen.getByText(/Live · fieldwork\.studio/)).toBeTruthy();
    expect(screen.getByText("Published 2 days ago · v12")).toBeTruthy();
  });

  it("checks loading: the CTA waits with \"Checking…\"", () => {
    checksState.checkState = "loading";
    renderTray();
    expect(cta()).toBeDisabled();
    expect(reason()).toBe("Checking…");
  });

  it("publishing: progress with the running step, the CTA shut", () => {
    renderTray({
      publishJob: job({
        uiState: "publishing",
        jobId: "job-1",
        progress: 40,
        steps: [
          { name: "Generating pages", status: "done" },
          { name: "Deploying to CDN", status: "running" },
          { name: "Verifying SSL", status: "pending" },
        ],
      }),
    });
    expect(screen.getByText("Publishing to fieldwork.studio…")).toBeTruthy();
    expect(screen.getByText("Step 2 of 3 · Deploying to CDN")).toBeTruthy();
    expect(cta().textContent).toBe("Publishing…");
    expect(cta()).toBeDisabled();
  });

  it("success: the live URL, View live and Copy link", () => {
    renderTray({ nextMove: null, publishJob: job({ uiState: "published", jobId: "job-1" }) });
    expect(screen.getByText("Your changes are live on fieldwork.studio.")).toBeTruthy();
    expect(screen.getByTestId("publish-tray-view-live").getAttribute("href")).toBe("https://fieldwork.studio");
    expect(screen.getByRole("button", { name: "Copy Copy link" }).textContent).toBe("Copy link");
  });

  it("simulated success says nothing went live", () => {
    renderTray({
      nextMove: null,
      publishJob: job({ uiState: "published", jobId: "job-1", publishedUrl: "https://site-1.dev-simulated.invalid" }),
    });
    expect(screen.getByText("Simulation mode — nothing is deployed")).toBeTruthy();
    expect(screen.getByText("Simulated publish — nothing went live.")).toBeTruthy();
  });

  it("CMS sync pending: the CTA is shut with \"Saving CMS changes…\"", () => {
    cms.blocker = "1 CMS change hasn't reached the server yet.";
    renderTray();
    expect(cta()).toBeDisabled();
    expect(reason()).toBe("Saving CMS changes…");
  });

  it("CMS sync stuck after 5 failed retries: reason, Retry sync, Open CMS at the failing record", () => {
    cms.blocker = "1 CMS change hasn't reached the server yet.";
    cms.failure = { reason: "502 Bad Gateway", attempts: 5, since: Date.now(), open: { collectionId: "c1", recordId: "r1" } };
    const { composer } = renderTray();
    expect(reason()).toBe("CMS changes couldn't sync: 502 Bad Gateway");
    fireEvent.click(screen.getByRole("button", { name: "Retry sync" }));
    expect(cms.retry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Open CMS ›" }));
    expect(composer.emit).toHaveBeenCalledWith(EVENTS.UI_CMS_OPEN, { collectionId: "c1", recordId: "r1" });
  });

  it("CMS sync stuck after 60 s, even with fewer retries", () => {
    cms.blocker = "1 CMS change hasn't reached the server yet.";
    cms.failure = { reason: "offline", attempts: 1, since: Date.now() - 61_000, open: null };
    renderTray();
    expect(reason()).toBe("CMS changes couldn't sync: offline");
    expect(screen.queryByRole("button", { name: "Open CMS ›" })).toBeNull();
  });

  it("CMS sync failing for less than 60 s and 5 tries is still pending, not stuck", () => {
    cms.blocker = "1 CMS change hasn't reached the server yet.";
    cms.failure = { reason: "offline", attempts: 2, since: Date.now() - 5_000, open: null };
    renderTray();
    expect(reason()).toBe("Saving CMS changes…");
  });

  it("an outside block (offline) speaks before the issue count", () => {
    renderTray({ nextMove: move({ offline: true, errorCount: 2 }) });
    expect(reason()).toBe("Can't publish while offline");
  });
});

describe("PublishTray — deploy failed", () => {
  it("shows the reason, the job id and the deployment id", () => {
    renderTray({
      publishJob: job({ uiState: "failed", jobId: "job-9", deploymentId: "dpl_123", error: "Vercel timed out." }),
    });
    expect(screen.getByText(/Publish failed — Vercel timed out\./)).toBeTruthy();
    expect(screen.getByTestId("publish-tray-job-id").textContent).toBe("job-9");
    expect(screen.getByTestId("publish-tray-deployment-id").textContent).toBe("dpl_123");
    expect(cta().textContent).toBe("Try again");
  });

  it("Try again is idempotent: a second press before the job moves does nothing", () => {
    const { onRequestPublish } = renderTray({
      publishJob: job({ uiState: "failed", jobId: "job-9", error: "Vercel timed out." }),
    });
    fireEvent.click(cta());
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
    expect(cta()).toBeDisabled();
  });

  it("a failure after partial upload (deployment id present) asks for a NEW job through the door, never re-tracks the dead one", () => {
    const failed = job({ uiState: "failed", jobId: "job-9", deploymentId: "dpl_partial", error: "Upload interrupted." });
    const { onRequestPublish } = renderTray({ publishJob: failed });
    expect(screen.getByTestId("publish-tray-deployment-id").textContent).toBe("dpl_partial");
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
    expect(failed.track).not.toHaveBeenCalled();
  });

  it("a lost poll resumes the SAME job (Check status), never a second publish", () => {
    const lost = job({ uiState: "failed", jobId: "job-9", pollLost: true, error: "Failed to poll" });
    const { onRequestPublish } = renderTray({ publishJob: lost });
    expect(cta().textContent).toBe("Check status");
    fireEvent.click(cta());
    expect(lost.track).toHaveBeenCalledWith("job-9");
    expect(onRequestPublish).not.toHaveBeenCalled();
  });
});

describe("PublishTray — issues, focus, zoom", () => {
  it("clicking an issue selects its element and keeps the tray open", () => {
    publishTray.open();
    renderTray({ issues: [{ id: "w", type: "warning", message: "Image has no alt text", elementId: "img-1", pageId: "p1" }] });
    fireEvent.click(screen.getByRole("button", { name: "Fix: Image has no alt text" }));
    expect(locateComment).toHaveBeenCalledWith(expect.anything(), { pageId: "p1", targetSelector: "img-1" });
    expect(publishTray.get().open).toBe(true);
    expect(screen.getByTestId("publish-tray")).toBeTruthy();
  });

  /* The harness the shell is: the topbar's toggle, and the tray mounted only
     while the store says open. */
  function Harness() {
    const { open } = usePublishTray();
    return (
      <ToastProvider>
        <button type="button" data-testid="toggle" onClick={(e) => publishTray.toggle(e.currentTarget)}>
          Publish
        </button>
        {open ? (
          <PublishTray composer={makeComposer().composer as never} publishJob={job()} nextMove={move()} onRequestPublish={vi.fn()} issues={[]} />
        ) : null}
      </ToastProvider>
    );
  }

  it("Esc closes the tray and returns focus to the topbar Publish toggle", () => {
    render(<Harness />);
    const toggle = screen.getByTestId("toggle");
    toggle.focus();
    fireEvent.click(toggle);
    expect(screen.getByTestId("publish-tray")).toBeTruthy();
    expect(document.activeElement).not.toBe(toggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByTestId("publish-tray")).toBeNull();
    expect(document.activeElement).toBe(toggle);
  });

  it("✕ closes the tray too", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("toggle"));
    fireEvent.click(screen.getByTestId("publish-tray-close"));
    expect(screen.queryByTestId("publish-tray")).toBeNull();
  });

  it("focus is trapped inside the tray while open", () => {
    render(<Harness />);
    fireEvent.click(screen.getByTestId("toggle"));
    const tray = screen.getByTestId("publish-tray");
    expect(tray.contains(document.activeElement)).toBe(true);
    const focusables = Array.from(tray.querySelectorAll<HTMLElement>("a[href],button:not([disabled])"));
    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(document.activeElement).toBe(focusables[0]);
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });

  it("fits the canvas on open; closing restores the user's previous zoom", async () => {
    const { composer, state, handlers } = makeComposer(100);
    handlers.set(EVENTS.ZOOM_FIT, () => composer.setZoom(46));
    const { unmount } = renderTray({ composer });
    await waitFor(() => expect(composer.emit).toHaveBeenCalledWith(EVENTS.ZOOM_FIT, { widthOnly: true }));
    expect(state.zoom).toBe(46);
    unmount();
    expect(state.zoom).toBe(100);
  });

  it("closing keeps the zoom when the user changed it while the tray was open", async () => {
    const { composer, state, handlers } = makeComposer(100);
    handlers.set(EVENTS.ZOOM_FIT, () => composer.setZoom(46));
    const { unmount } = renderTray({ composer });
    await waitFor(() => expect(state.zoom).toBe(46));
    act(() => composer.setZoom(75));
    unmount();
    expect(state.zoom).toBe(75);
  });
});
