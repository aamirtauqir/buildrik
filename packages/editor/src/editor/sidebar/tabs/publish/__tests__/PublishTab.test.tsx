// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { UsePublishJobResult } from "../../../../shell/hooks/usePublishJob";

/**
 * Only `useToast` is stubbed, and only for what this file renders directly.
 *
 * `ToastProvider` used to be stubbed here too, as `({children}) => children` —
 * a provider that provides nothing. That is a landmine, not a shortcut: any
 * chrome-ui component that reaches toast through its own internal import
 * (`chrome-ui/Toast`, not the barrel) misses the barrel mock, finds no context,
 * and `useToast` throws. CopyButton is the first component to hit it. The real
 * provider is used below instead, so the context genuinely exists.
 */
vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
  };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishTab } from "../PublishTab";
import { deriveLifecycleState } from "../../../../shell/lifecycle";

/* A site with no review in the path and nothing blocking — the plain `confirm`
   gate. Every case here is about the panel's wiring, not the gate; the gate's
   own cases are PublishTab.gate.test.tsx. */
const OPEN_MOVE = deriveLifecycleState({
  reviewState: "none",
  reviewsEnabled: false,
  editsRequireApproval: false,
  isPublished: false,
  hasUnpublishedChanges: null,
  isViewer: false,
  publishEnabled: true,
  offline: false,
  errorCount: 0,
});

/** The real provider, so chrome-ui components that reach toast through their
 *  own internal import find a context instead of throwing. */
function renderTab(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const composer = {
  /* The panel reads the undo stack and subscribes to the engine's history
     events to keep "since last deploy" honest — a double without on/off is an
     incomplete composer, not a reason to guard the hook. */
  on: vi.fn(),
  off: vi.fn(),
  history: { getHistoryStack: () => [] },
  getProjectSettings: () => ({ seo: { metaTitle: "T", metaDescription: "D", ogImage: "img.png" } }),
  pages: { getAll: () => [{ id: "p1" }] },
  elements: { getElement: () => ({ getChildCount: () => 1 }), getActivePage: () => ({ root: { id: "r" } }) },
} as any;

function makeJob(over: Partial<UsePublishJobResult> = {}): UsePublishJobResult {
  return {
    uiState: "idle", jobId: null, progress: 0, publishedUrl: null, error: null,
    steps: null,
    blockedReason: null,
    lastPublishedAt: null,
    hasUnpublishedChanges: null,
    unpublished: vi.fn(),
    publish: vi.fn(), cancel: vi.fn(), track: vi.fn(), reset: vi.fn(), dismissBlock: vi.fn(), ...over,
  };
}

describe("PublishTab readiness source", () => {
  // Was "shows SEO checks as true when settings are present", asserting the
  // locally-computed "SEO title set" / "Meta description added" rows. Those were
  // never the server's contract (runPrePublishChecks returns a different six with
  // severity) and are gone. Readiness coverage now lives in
  // PublishTab.checks.test.tsx against the real endpoint shape.
  /* The checks are inline (board B3-10): with no site to run them against the
     section says so, in the panel, before anything is clicked. */
  it("asks the user to open the site from the dashboard when there is no site id", () => {
    const { container } = renderTab(
      <PublishTab composer={composer} nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />,
    );
    expect(container.textContent).toContain("Open this site from the dashboard");
    expect(container.textContent).not.toContain("SEO title set");
  });
});

/* CTA copy follows board 641:2652: the button names the destination
   ("Publish to production"), not the verb ("Publish Site"), and lives pinned
   at the panel's bottom rather than inside the scroll body. */
describe("PublishTab — canonical publish wiring (B1)", () => {
  it("shows 'not configured' when no publish door is wired (flag off / inert)", () => {
    const { container } = renderTab(<PublishTab composer={composer} publishJob={makeJob()} nextMove={OPEN_MOVE} />);
    // Board 784:4480: with no publish path the panel is that one sentence.
    expect(container.textContent).toContain("Connect Vercel to publish.");
  });

  it("enables Publish and opens the ONE door when wired — the same door the topbar opens", () => {
    const onRequestPublish = vi.fn();
    const { getByText } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob()} nextMove={OPEN_MOVE} onRequestPublish={onRequestPublish} />
    );
    /* The CTA opens the door; the dialog behind it (B3-10's facts confirm) is
       AquibraStudio's, so nothing publishes from here. The panel's own two-step
       wizard is gone (B4). */
    fireEvent.click(getByText("Publish to production"));
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toContain("Continue to Confirm");
  });

  it("reflects the canonical 'publishing' state (no second state machine)", () => {
    const { container } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "publishing", progress: 40 })} nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />
    );
    expect(container.textContent).toContain("Publishing…");
    expect(container.textContent).toContain("40%");
  });

  it("shows the published URL + Update label from canonical state", () => {
    const { container, getByText } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "published", publishedUrl: "https://x.vercel.app" })} nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />
    );
    expect(getByText("Publish to production")).toBeTruthy();
    expect(container.textContent).toContain("x.vercel.app");
  });

  /* codex review P2: a FAILED republish of an already-live site must NOT read
     as Draft — live-state is durable (publishedUrl), not the transient job
     state. The assertion moved from the CTA label to the live URL: the boards
     use ONE label in every state (641:2652, 784:4326), so the button no longer
     carries this distinction. What must survive a failed republish is the fact
     that a deployment is still serving. */
  it("a failed republish leaves the live deployment on screen", () => {
    const { container } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "failed", publishedUrl: "https://x.vercel.app", error: "deploy failed" })} nextMove={OPEN_MOVE} onRequestPublish={vi.fn()} />
    );
    expect(container.textContent).toContain("x.vercel.app");
    expect(container.textContent).toContain("deploy failed");
  });
});
