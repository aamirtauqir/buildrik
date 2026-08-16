// @vitest-environment jsdom
/**
 * PublishTab — pre-publish readiness.
 *
 * REWRITTEN 2026-08-05. This file used to assert seven locally-computed checks
 * ("SEO title set", "Meta description added", "Social share image", …) read off
 * `composer.getProjectSettings()`. Those checks were never the product contract:
 * the server's `runPrePublishChecks` returns a DIFFERENT six, with pass/warning/
 * fail severity, and the local set never checked "Vercel connected" — the one
 * condition that actually blocks a deploy. So the panel could read all-green and
 * the publish still be hard-refused, and this test file was protecting that.
 *
 * These tests assert the server contract instead, and the last describe is a
 * regression guard that the local heuristics never come back.
 *
 * MOVED 2026-08-14: the checklist now lives in the publish wizard's first step
 * (board 833:4518), not inline in the panel — it gates a publish, so it belongs
 * in the flow that publishes. Each test opens the wizard first; what it asserts
 * about the server contract is unchanged.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";
import type { PublishTabProps } from "../PublishTab";

const fetchPrePublishChecks = vi.fn();
vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: (siteId: string) => fetchPrePublishChecks(siteId),
  // PublishHistory (rendered when projectId is set) reaches for these.
  fetchPublishHistory: () => Promise.resolve([]),
  rollbackToVersion: () => Promise.resolve(),
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishTab } from "../PublishTab";

type ComposerProp = PublishTabProps["composer"];

/** A composer whose settings WOULD have satisfied every old local heuristic —
 *  so if any of them survived, the regression test below would see them. */
function composerWith(emit = vi.fn()): ComposerProp {
  return {
    emit,
    on: vi.fn(),
    off: vi.fn(),
    history: { getHistoryStack: () => [] },
    getProjectSettings: () => ({
      seo: {
        siteName: "Bella Cucina",
        favicon: "/favicon.ico",
        metaTitle: "T",
        metaDescription: "D",
        defaultOgImage: "og.png",
      },
    }),
    elements: {
      getAllPages: () => [{ id: "p1" }],
      getActivePage: () => ({ root: { id: "r" } }),
      getElement: () => ({ getChildCount: () => 3 }),
    },
  } as unknown as ComposerProp;
}

function result(over: Partial<PrePublishChecksResult> = {}): PrePublishChecksResult {
  return {
    ready: true,
    checks: [
      { label: "Vercel connected", status: "pass", detail: "This workspace is connected to Vercel." },
      { label: "Pages ready", status: "pass", detail: "3 pages ready to publish." },
      { label: "SEO configured", status: "warning", detail: "No meta title template set." },
      { label: "Domain connected", status: "warning", detail: "No custom domain." },
      { label: "Empty pages", status: "warning", detail: "1 page has no content blocks." },
      { label: "Favicon", status: "warning", detail: "No favicon set." },
    ],
    ...over,
  };
}

function renderTab(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

/** The checklist is the wizard's step 1 — open it the way a user does. */
async function openWizard() {
  const cta = await screen.findByText("Publish to production");
  fireEvent.click(cta.closest("button") as HTMLButtonElement);
}

beforeEach(() => {
  fetchPrePublishChecks.mockReset();
});

describe("PublishTab — renders the server's readiness contract", () => {
  it("renders every row the server returned, and only those", async () => {
    fetchPrePublishChecks.mockResolvedValue(result());
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();

    await waitFor(() => expect(screen.getByText("Vercel connected")).toBeTruthy());
    for (const label of ["Pages ready", "SEO configured", "Domain connected", "Empty pages", "Favicon"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
  });

  it("passes the site id straight through to the server call", async () => {
    fetchPrePublishChecks.mockResolvedValue(result());
    renderTab(<PublishTab composer={composerWith()} projectId="site_abc" />);
    await waitFor(() => expect(fetchPrePublishChecks).toHaveBeenCalledWith("site_abc"));
  });

  it("surfaces each non-passing row's server detail, not an invented hint", async () => {
    fetchPrePublishChecks.mockResolvedValue(result());
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();
    await waitFor(() => expect(screen.getByText("No custom domain.")).toBeTruthy());
    expect(screen.getByText("1 page has no content blocks.")).toBeTruthy();
  });
});

describe("PublishTab — only a fail blocks the publish", () => {
  it("keeps Publish enabled when every non-pass row is a warning", async () => {
    fetchPrePublishChecks.mockResolvedValue(result({ ready: true }));
    const { getByText } = renderTab(
      <PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />,
    );
    await openWizard();
    await waitFor(() => expect(screen.getByText("SEO configured")).toBeTruthy());
    // Warnings do not block: the gate lets the user through to Confirm.
    expect((getByText("Continue to Confirm →").closest("button") as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByText(/4 warnings — none block/)).toBeTruthy();
  });

  /* The blocking row here used to be "Vercel connected". It cannot be any
     more: a failing Vercel check now replaces the whole panel with board
     784:4480 ("Connect Vercel to publish."), so there is no wizard to open
     and the case this test is actually about — a blocking row killing
     Continue — needs a row that leaves a publish path in place. */
  it("disables Publish when the server reports a blocking check", async () => {
    const checks = result({ ready: false });
    checks.checks[1] = {
      label: "Pages ready",
      status: "fail",
      detail: "No pages found.",
    };
    fetchPrePublishChecks.mockResolvedValue(checks);
    const { getByText } = renderTab(
      <PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />,
    );
    await openWizard();
    await waitFor(() => expect(screen.getByText(/blocking — Pages ready/)).toBeTruthy());
    expect((getByText("Continue to Confirm →").closest("button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("does not fire the publish handler while blocked", async () => {
    const checks = result({ ready: false });
    checks.checks[1] = { label: "Pages ready", status: "fail", detail: "No pages found." };
    fetchPrePublishChecks.mockResolvedValue(checks);
    const onVercelPublish = vi.fn();
    const { getByText } = renderTab(
      <PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={onVercelPublish} />,
    );
    await openWizard();
    await waitFor(() => expect(screen.getByText(/blocking — Pages ready/)).toBeTruthy());
    // The gate is the wizard's: Continue is dead, so Confirm is unreachable.
    fireEvent.click(getByText("Continue to Confirm →"));
    expect(screen.queryByText("Publish now")).toBeNull();
    expect(onVercelPublish).not.toHaveBeenCalled();
    void getByText;
  });
});

describe("PublishTab — fix affordances match severity and ownership", () => {
  /* This asserted a `Connect Vercel ›` link on the wizard's Vercel row. That
     row can only carry a fix when it FAILS, and a failing Vercel check is now
     the whole-panel state on board 784:4480 — so the link was unreachable and
     is gone. What replaced it is the board's own action, tested here: no
     publish path, no checklist, one sentence and one CTA. */
  it("replaces the panel with board 784:4480 when Vercel is not connected", async () => {
    const checks = result({ ready: false });
    checks.checks[0] = {
      label: "Vercel connected",
      status: "fail",
      detail: "Sites deploy to your own Vercel account. Connect it to publish.",
    };
    fetchPrePublishChecks.mockResolvedValue(checks);
    const emit = vi.fn();
    renderTab(<PublishTab composer={composerWith(emit)} projectId="site_1" onVercelPublish={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Connect Vercel to publish.")).toBeTruthy());
    expect(
      screen.getByText("Buildrick deploys into your own Vercel account — we host nothing."),
    ).toBeTruthy();
    // The panel claims nothing it cannot know: no environments, no change
    // list, no deploy history under a live-looking publish button.
    expect(screen.queryByText("Environment")).toBeNull();
    expect(screen.queryByText("Since last deploy")).toBeNull();
    expect(screen.queryByText("Publish to production")).toBeNull();
    expect(emit).not.toHaveBeenCalled();
  });

  it("keeps the full panel when Vercel passes and something else blocks", async () => {
    // The guard is the Vercel row specifically, not "anything failed" — a
    // blocked publish with a working connection still has environments and a
    // deploy history worth reading.
    const checks = result({ ready: false });
    checks.checks[1] = { label: "Pages ready", status: "fail", detail: "No pages found." };
    fetchPrePublishChecks.mockResolvedValue(checks);
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Publish to production")).toBeTruthy());
    expect(screen.queryByText("Connect Vercel to publish.")).toBeNull();
  });

  it("routes an in-editor warning to its owning tab", async () => {
    fetchPrePublishChecks.mockResolvedValue(result());
    const emit = vi.fn();
    renderTab(<PublishTab composer={composerWith(emit)} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();

    await waitFor(() => expect(screen.getByText("Empty pages")).toBeTruthy());
    /* "Empty pages" is fixed in the Pages tab. The row is the wizard's; its
       Fix button closes the wizard and switches tabs, because a fix the user
       cannot see is not a fix. */
    const row = screen.getByText("Empty pages").parentElement as HTMLElement;
    fireEvent.click(row.querySelector("button") as HTMLElement);
    expect(emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "pages" });
  });
});

describe("PublishTab — a failed load never reads as passing (DF5)", () => {
  it("shows Retry instead of a green checklist", async () => {
    fetchPrePublishChecks.mockRejectedValue(new Error("network"));
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();
    await waitFor(() => expect(screen.getByText("Retry")).toBeTruthy());
    expect(document.body.textContent).not.toContain("All checks pass");
    expect(document.body.textContent).not.toContain("Vercel connected");
  });

  it("recovers when Retry succeeds", async () => {
    fetchPrePublishChecks.mockRejectedValueOnce(new Error("network")).mockResolvedValue(result());
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();
    fireEvent.click(await screen.findByText("Retry"));
    await waitFor(() => expect(screen.getByText("Vercel connected")).toBeTruthy());
  });
});

describe("PublishTab — regression: the local heuristics stay dead", () => {
  it("never renders a locally-computed check label, even with settings that would satisfy them", async () => {
    fetchPrePublishChecks.mockResolvedValue(result());
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();
    await waitFor(() => expect(screen.getByText("Vercel connected")).toBeTruthy());

    for (const dead of [
      "Page title set",
      "Favicon uploaded",
      "At least 1 page",
      "Page has content",
      "SEO title set",
      "Meta description added",
      "Social share image",
    ]) {
      expect(document.body.textContent).not.toContain(dead);
    }
  });

  it("does not call the server when there is no site id", async () => {
    renderTab(<PublishTab composer={composerWith()} onVercelPublish={vi.fn()} />);
    await openWizard();
    await waitFor(() =>
      expect(screen.getByText(/Open this site from the dashboard/)).toBeTruthy(),
    );
    expect(fetchPrePublishChecks).not.toHaveBeenCalled();
  });
});

/* The row this replaced announced severity in words ("SEO configured:
   warning. No meta title template."). The wizard's row carries severity in a
   coloured disc, which is nothing at all to a screen reader — so the severity
   is in the accessible name, and the disc carries an sr-only word. */
describe("PublishWizard rows — severity is readable, not just visible", () => {
  it("names the severity and the reason in the accessible name", async () => {
    fetchPrePublishChecks.mockResolvedValue(result());
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();

    await waitFor(() => expect(screen.getByLabelText(/^Vercel connected: passing/)).toBeTruthy());
    expect(screen.getByLabelText(/^SEO configured: warning\. No meta title template set\./)).toBeTruthy();
  });

  it("says blocking, not just red, when a check fails", async () => {
    // Not the Vercel row: that failure now replaces the panel outright
    // (board 784:4480), so the wizard it used to be read in never opens.
    const checks = result({ ready: false });
    checks.checks[1] = { label: "Pages ready", status: "fail", detail: "No pages found." };
    fetchPrePublishChecks.mockResolvedValue(checks);
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await openWizard();

    await waitFor(() =>
      expect(screen.getByLabelText(/^Pages ready: blocking\. No pages found\./)).toBeTruthy(),
    );
  });
});
