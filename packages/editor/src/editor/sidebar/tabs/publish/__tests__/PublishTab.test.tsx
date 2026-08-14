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

/** The real provider, so chrome-ui components that reach toast through their
 *  own internal import find a context instead of throwing. */
function renderTab(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

const composer = {
  getProjectSettings: () => ({ seo: { metaTitle: "T", metaDescription: "D", ogImage: "img.png" } }),
  pages: { getAll: () => [{ id: "p1" }] },
  elements: { getElement: () => ({ getChildCount: () => 1 }), getActivePage: () => ({ root: { id: "r" } }) },
} as any;

function makeJob(over: Partial<UsePublishJobResult> = {}): UsePublishJobResult {
  return {
    uiState: "idle", jobId: null, progress: 0, publishedUrl: null, error: null,
    blockedReason: null,
    publish: vi.fn(), cancel: vi.fn(), reset: vi.fn(), dismissBlock: vi.fn(), ...over,
  };
}

describe("PublishTab readiness source", () => {
  // Was "shows SEO checks as true when settings are present", asserting the
  // locally-computed "SEO title set" / "Meta description added" rows. Those were
  // never the server's contract (runPrePublishChecks returns a different six with
  // severity) and are gone. Readiness coverage now lives in
  // PublishTab.checks.test.tsx against the real endpoint shape.
  /* Moved with the checklist: "open this site from the dashboard" is what the
     wizard's step 1 says when there is no site to run checks against. The panel
     itself, with a publish path wired, shows the board's three sections. */
  it("asks the user to open the site from the dashboard when there is no site id", () => {
    const { container, getByText } = renderTab(
      <PublishTab composer={composer} onVercelPublish={vi.fn()} />,
    );
    fireEvent.click(getByText("Publish to production"));
    expect(container.textContent + document.body.textContent).toContain(
      "Open this site from the dashboard",
    );
    expect(container.textContent).not.toContain("SEO title set");
  });
});

/* CTA copy follows board 641:2652: the button names the destination
   ("Publish to production"), not the verb ("Publish Site"), and lives pinned
   at the panel's bottom rather than inside the scroll body. */
describe("PublishTab — canonical publish wiring (B1)", () => {
  it("shows 'not configured' when no canonical handler is wired (flag off / inert)", () => {
    const { container } = renderTab(<PublishTab composer={composer} publishJob={makeJob()} />);
    // Board 784:4480: with no publish path the panel is that one sentence.
    expect(container.textContent).toContain("Connect Vercel to publish.");
  });

  it("enables Publish and fires the canonical handler when wired", () => {
    const onVercelPublish = vi.fn().mockResolvedValue(undefined);
    const { getByText } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob()} onVercelPublish={onVercelPublish} />
    );
    /* The CTA opens the gate; the deploy fires from the wizard's last step.
       Board 833:4518 → 914:4507: nothing publishes without passing Confirm. */
    fireEvent.click(getByText("Publish to production"));
    fireEvent.click(getByText("Continue to Confirm →"));
    fireEvent.click(getByText("Publish now"));
    expect(onVercelPublish).toHaveBeenCalledTimes(1);
  });

  it("reflects the canonical 'publishing' state (no second state machine)", () => {
    const { container } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "publishing", progress: 40 })} onVercelPublish={vi.fn()} />
    );
    expect(container.textContent).toContain("Publishing…");
    expect(container.textContent).toContain("40%");
  });

  it("shows the published URL + Update label from canonical state", () => {
    const { container, getByText } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "published", publishedUrl: "https://x.vercel.app" })} onVercelPublish={vi.fn()} />
    );
    expect(getByText("Update production")).toBeTruthy();
    expect(container.textContent).toContain("x.vercel.app");
  });

  // codex review P2: a FAILED republish of an already-live site must NOT read
  // as Draft — live-state is durable (publishedUrl), not the transient job state.
  it("stays 'published' (Update) after a failed republish while a deployment is still live", () => {
    const { getByText, queryByText } = renderTab(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "failed", publishedUrl: "https://x.vercel.app", error: "deploy failed" })} onVercelPublish={vi.fn()} />
    );
    expect(getByText("Update production")).toBeTruthy();
    expect(queryByText("Publish to production")).toBeNull();
  });
});
