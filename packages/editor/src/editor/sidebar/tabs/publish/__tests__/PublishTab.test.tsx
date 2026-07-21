// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { UsePublishJobResult } from "../../../../shell/hooks/usePublishJob";

vi.mock("@/editor/shared/vibcoder", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/shared/vibcoder");
  return {
    ...actual,
    useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }),
    ToastProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("@/shared/extensions/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "panel-header" }, title);
  },
}));

import { PublishTab } from "../PublishTab";

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

describe("PublishTab SEO readiness", () => {
  it("shows SEO checks as true when settings are present", () => {
    const { container } = render(<PublishTab composer={composer} />);
    expect(container.textContent).toContain("SEO title set");
    expect(container.textContent).toContain("Meta description added");
  });
});

describe("PublishTab — canonical publish wiring (B1)", () => {
  it("shows 'not configured' when no canonical handler is wired (flag off / inert)", () => {
    const { container } = render(<PublishTab composer={composer} publishJob={makeJob()} />);
    expect(container.textContent).toContain("Publishing not configured");
  });

  it("enables Publish and fires the canonical handler when wired", () => {
    const onVercelPublish = vi.fn().mockResolvedValue(undefined);
    const { getByText } = render(
      <PublishTab composer={composer} publishJob={makeJob()} onVercelPublish={onVercelPublish} />
    );
    const btn = getByText("Publish Site");
    fireEvent.click(btn);
    expect(onVercelPublish).toHaveBeenCalledTimes(1);
  });

  it("reflects the canonical 'publishing' state (no second state machine)", () => {
    const { container } = render(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "publishing", progress: 40 })} onVercelPublish={vi.fn()} />
    );
    expect(container.textContent).toContain("Publishing...");
    expect(container.textContent).toContain("40%");
  });

  it("shows the published URL + Update label from canonical state", () => {
    const { container, getByText } = render(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "published", publishedUrl: "https://x.vercel.app" })} onVercelPublish={vi.fn()} />
    );
    expect(getByText("Update Site")).toBeTruthy();
    expect(container.textContent).toContain("x.vercel.app");
  });

  // codex review P2: a FAILED republish of an already-live site must NOT read
  // as Draft — live-state is durable (publishedUrl), not the transient job state.
  it("stays 'published' (Update) after a failed republish while a deployment is still live", () => {
    const { getByText, queryByText } = render(
      <PublishTab composer={composer} publishJob={makeJob({ uiState: "failed", publishedUrl: "https://x.vercel.app", error: "deploy failed" })} onVercelPublish={vi.fn()} />
    );
    expect(getByText("Update Site")).toBeTruthy();
    expect(queryByText("Publish Site")).toBeNull();
  });
});
