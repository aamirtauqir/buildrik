// @vitest-environment jsdom
/**
 * PublishTab — the panel's board-driven states.
 *
 * 641:2652 (idle) · 784:4250 (publishing) · 784:4326 (live) · 784:4480
 * (not-connected). Each board answers a different question, and each drops the
 * sections that would answer a question the user is no longer asking.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { PublishTabProps } from "../PublishTab";

const fetchPublishHistory = vi.fn();
vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: () => Promise.resolve({ ready: true, checks: [] }),
  fetchPublishHistory: (siteId: string) => fetchPublishHistory(siteId),
  rollbackToVersion: () => Promise.resolve(),
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishTab } from "../PublishTab";

type ComposerProp = PublishTabProps["composer"];

function composerWith(entries: Array<{ id: string; label: string; timestamp: number }> = []): ComposerProp {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    history: { getHistoryStack: () => entries },
    elements: { getAllPages: () => [{ id: "p1" }, { id: "p2" }, { id: "p3" }] },
  } as unknown as ComposerProp;
}

const job = (over: Partial<NonNullable<PublishTabProps["publishJob"]>> = {}) =>
  ({ uiState: "idle", progress: 0, publishedUrl: null, error: null, blockedReason: null, ...over }) as NonNullable<
    PublishTabProps["publishJob"]
  >;

function renderTab(ui: React.ReactElement) {
  return render(<ToastProvider>{ui}</ToastProvider>);
}

beforeEach(() => {
  fetchPublishHistory.mockReset().mockResolvedValue([]);
});

describe("PublishTab — board 641:2652, the idle panel", () => {
  it("counts only the changes made SINCE the last deploy", async () => {
    const deployedAt = new Date("2026-08-14T10:00:00Z");
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 4, completedAt: deployedAt, deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    const before = deployedAt.getTime() - 60_000;
    const after = deployedAt.getTime() + 60_000;
    renderTab(
      <PublishTab
        composer={composerWith([
          { id: "e1", label: "Hero — new photo", timestamp: after },
          { id: "e2", label: "Ancient edit", timestamp: before },
        ])}
        projectId="site_1"
        onVercelPublish={vi.fn()}
      />,
    );

    // The pre-deploy entry is not pending work and must not be counted.
    await waitFor(() => expect(screen.getByText("1 change")).toBeTruthy());
    expect(screen.getByText("Hero — new photo")).toBeTruthy();
    expect(screen.queryByText("Ancient edit")).toBeNull();
    expect(screen.getByText("3 pages")).toBeTruthy();
    expect(screen.getByText("v4 · live")).toBeTruthy();
  });

  it("never-published reads as never published, not as an empty deploy", async () => {
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);
    await waitFor(() => expect(screen.getByText("This site has never been published.")).toBeTruthy());
  });
});

describe("PublishTab — board 784:4250, publishing", () => {
  it("leads with the run and drops the two 'what would go out' sections", async () => {
    renderTab(
      <PublishTab
        composer={composerWith([{ id: "e1", label: "Edit", timestamp: Date.now() }])}
        projectId="site_1"
        onVercelPublish={vi.fn()}
        publishJob={job({ uiState: "publishing", progress: 40 })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Publishing to production…")).toBeTruthy());
    expect(screen.getByText(/40%/)).toBeTruthy();
    // Environment stays — where it is going is still the question.
    expect(screen.getByText("Production")).toBeTruthy();
    expect(screen.queryByText("Since last deploy")).toBeNull();
    expect(screen.queryByText("Last deploy")).toBeNull();
  });
});

describe("PublishTab — board 784:4326, just published", () => {
  it("states the result, offers the live site, and greys the CTA", async () => {
    fetchPublishHistory.mockResolvedValue([
      { id: "j1", version: 15, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
    ]);
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        onVercelPublish={vi.fn()}
        publishJob={job({ uiState: "published", publishedUrl: "https://bellacucina.com" })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Published to production.")).toBeTruthy());
    expect(screen.getByText(/v15 · live/)).toBeTruthy();
    expect((screen.getByText("View live site") as HTMLAnchorElement).href).toContain("bellacucina.com");
    expect(screen.getByText("Compare v14 → v15")).toBeTruthy();
    // Nothing pending — the button has nothing to send.
    expect(
      (screen.getByText("Publish to production").closest("button") as HTMLButtonElement).disabled,
    ).toBe(true);
  });
});

describe("PublishTab — board 784:4480, no publish path", () => {
  it("is one sentence and one action, not a checklist", () => {
    const { container } = renderTab(<PublishTab composer={composerWith()} projectId="site_1" />);
    expect(container.textContent).toContain("Connect Vercel to publish.");
    expect(container.textContent).toContain("we host nothing");
    expect(screen.getByText("Connect Vercel")).toBeTruthy();
    // The board draws no environment/changes/deploy sections here.
    expect(container.textContent).not.toContain("SINCE LAST DEPLOY");
    expect(screen.queryByText("Publish to production")).toBeNull();
  });
});

describe("PublishTab — board 784:4403, failed", () => {
  it("says what failed AND that nothing was deployed", async () => {
    renderTab(
      <PublishTab
        composer={composerWith([{ id: "e1", label: "Edit", timestamp: Date.now() }])}
        projectId="site_1"
        onVercelPublish={vi.fn()}
        publishJob={job({ uiState: "failed", error: "Build error on Menu — 3 unresolved links." })}
      />,
    );

    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    /* The reassurance is the half a user needs first, and the panel adds it
       when the server message does not carry it. */
    expect(screen.getByText(/Nothing was deployed\./)).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
    // Same as publishing/live: the "what would go out" sections step aside.
    expect(screen.queryByText("Since last deploy")).toBeNull();
    // The CTA stays live — a failed publish is retryable.
    expect(
      (screen.getByText("Publish to production").closest("button") as HTMLButtonElement).disabled,
    ).toBe(false);
  });

  it("does not double the reassurance when the server already said it", async () => {
    renderTab(
      <PublishTab
        composer={composerWith()}
        projectId="site_1"
        onVercelPublish={vi.fn()}
        publishJob={job({ uiState: "failed", error: "Timed out. Nothing was deployed." })}
      />,
    );
    await waitFor(() => expect(screen.getByText("Publish failed.")).toBeTruthy());
    expect(screen.getByText("Timed out. Nothing was deployed.")).toBeTruthy();
  });
});

describe("PublishTab — board 781:4489, the deploy service is unreachable", () => {
  it("says so, and says nothing about environments it cannot read", async () => {
    fetchPublishHistory.mockRejectedValue(new Error("network"));
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Couldn't reach the deploy service.")).toBeTruthy());
    /* Both halves: nothing went out, and the work is not lost. */
    expect(screen.getByText("Nothing was published. Your work is saved.")).toBeTruthy();
    expect(screen.getByText("Try again")).toBeTruthy();
    // "no deploys yet" and "we cannot tell" are different facts.
    expect(screen.queryByText("This site has never been published.")).toBeNull();
    expect(screen.queryByText("Since last deploy")).toBeNull();
    expect(
      (screen.getByText("Publish to production").closest("button") as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("Try again re-reads the history and recovers", async () => {
    /* A flag, not mockRejectedValueOnce: TWO components read this history (the
       panel's snapshot and PublishHistory), so a "once" mock is spent by the
       second reader before the test can use it. */
    let failing = true;
    fetchPublishHistory.mockImplementation(() =>
      failing
        ? Promise.reject(new Error("network"))
        : Promise.resolve([
            { id: "j1", version: 2, completedAt: new Date(), deploymentId: "d", rollbackable: true, rolledBackFrom: null },
          ]),
    );
    renderTab(<PublishTab composer={composerWith()} projectId="site_1" onVercelPublish={vi.fn()} />);

    await waitFor(() => expect(screen.getByText("Couldn't reach the deploy service.")).toBeTruthy());
    failing = false;
    fireEvent.click(screen.getByText("Try again"));
    await waitFor(() => expect(screen.getByText("v2 · live")).toBeTruthy());
  });
});
