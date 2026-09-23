// @vitest-environment jsdom
/**
 * PublishTab — the publish gate, as the panel reads it (B4, decisions #20/#34).
 *
 * The panel used to decide "can publish" from `!!onVercelPublish` — "is a
 * callback wired" — while the topbar read `deriveLifecycleState`. With reviews
 * on and a round pending the topbar was disabled "Waiting on Sara's approval"
 * and the panel offered an enabled Publish. Now both read ONE `nextMove`; this
 * file asserts the panel's half: the footer CTA, its reason line, the gate
 * banner and the Client approval row all print the gate's own words.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";
import type { PublishTabProps } from "../PublishTab";

vi.mock("@/services/PublishService", () => ({
  fetchPrePublishChecks: () =>
    Promise.resolve({
      ready: true,
      checks: [{ label: "Vercel connected", status: "pass", detail: "ok" }],
    }),
  fetchPublishHistory: () => Promise.resolve([]),
  unpublishSite: () => Promise.resolve(),
}));

vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishTab } from "../PublishTab";
import { deriveLifecycleState, type LifecycleInput, type NextMove } from "../../../../shell/lifecycle";
import { EVENTS } from "@/shared/constants";

const base: LifecycleInput = {
  reviewState: "none",
  reviewerName: "Sara",
  reviewsEnabled: true,
  editsRequireApproval: true,
  isPublished: false,
  hasUnpublishedChanges: null,
  isViewer: false,
  publishEnabled: true,
  offline: false,
  errorCount: 0,
};
const moveAt = (over: Partial<LifecycleInput>) => deriveLifecycleState({ ...base, ...over });

function composerWith(emit = vi.fn()): PublishTabProps["composer"] {
  return {
    emit,
    on: vi.fn(),
    off: vi.fn(),
    history: { getHistoryStack: () => [] },
    elements: { getAllPages: () => [{ id: "p1" }] },
  } as unknown as PublishTabProps["composer"];
}

function renderTab(nextMove: NextMove | null, over: Partial<PublishTabProps> = {}) {
  const onRequestPublish = vi.fn();
  const emit = vi.fn();
  render(
    <ToastProvider>
      <PublishTab
        composer={composerWith(emit)}
        projectId="site_1"
        nextMove={nextMove}
        onRequestPublish={onRequestPublish}
        {...over}
      />
    </ToastProvider>,
  );
  return { onRequestPublish, emit };
}

const cta = () => screen.getByTestId("publish-cta") as HTMLButtonElement;

beforeEach(() => vi.clearAllMocks());

describe("PublishTab — waiting: the door is shut, with the same sentence the topbar carries", () => {
  it("a pending round disables the CTA and prints the reason in the banner AND the checks row", async () => {
    const move = moveAt({ reviewState: "pending" })!;
    const { onRequestPublish } = renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-gate-banner")).toBeTruthy());
    expect(cta().disabled).toBe(true);
    fireEvent.click(cta());
    expect(onRequestPublish).not.toHaveBeenCalled();
    // The banner prints the gate's own sentence — the one on the topbar tooltip.
    expect(screen.getByTestId("publish-gate-reason").textContent).toBe("Waiting on Sara's approval");
    expect(move.blockedReason).toBe("Waiting on Sara's approval");
    // Board B3-10: "Client approval — Blocks publish — Open ›" in the checks.
    expect(screen.getByTestId("publish-check-approval").getAttribute("data-gate")).toBe("waiting");
    expect(screen.getByTestId("publish-check-approval-detail").textContent).toBe("Blocks publish");
  });

  it("never sent on an approval workspace: shut, and the reason says to send first", async () => {
    const move = moveAt({ reviewState: "none" })!;
    renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-gate-banner")).toBeTruthy());
    expect(move.kind).toBe("send-for-review");
    expect(cta().disabled).toBe(true);
    expect(screen.getByTestId("publish-gate-reason").textContent).toMatch(/^Send for review first/);
  });

  it("the banner's door is the Review panel", async () => {
    const { emit } = renderTab(moveAt({ reviewState: "pending" }));
    fireEvent.click(await screen.findByTestId("publish-gate-door"));
    expect(emit).toHaveBeenCalledWith("ui:switch-tab", { tab: "review" });
  });
});

describe("PublishTab — doors that open", () => {
  it("changes requested: the CTA opens the door (the gate modal is the shell's)", async () => {
    const move = moveAt({ reviewState: "changes-requested" })!;
    const { onRequestPublish } = renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-gate-banner")).toBeTruthy());
    expect(cta().disabled).toBe(false);
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("publish-gate-reason").textContent).toMatch(/^Sara asked for changes/);
    expect(screen.getByTestId("publish-check-approval-detail").textContent).toBe("Blocks publish");
  });

  it("stale approval: advisory, not blocking — amber row, the CTA opens the acknowledgement", async () => {
    const move = moveAt({ reviewState: "approved-edited-since" })!;
    const { onRequestPublish } = renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-gate-banner")).toBeTruthy());
    expect(move.gate).toBe("stale-approval");
    expect(cta().disabled).toBe(false);
    expect(screen.getByTestId("publish-check-approval-detail").textContent).toBe("Advisory");
    expect(screen.getByTestId("publish-gate-reason").textContent).toBe("Approval is older than your latest edits.");
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
  });

  it("open errors: the banner counts them and its door is the Issues panel", async () => {
    const move = moveAt({ reviewState: "approved", errorCount: 2 })!;
    const { onRequestPublish, emit } = renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-gate-banner")).toBeTruthy());
    expect(screen.getByTestId("publish-gate-reason").textContent).toBe(
      "2 open errors will go live exactly as they are.",
    );
    // Not a check row — the errors are the Issues panel's, not the round's.
    expect(screen.queryByTestId("publish-check-approval")).toBeNull();
    fireEvent.click(screen.getByTestId("publish-gate-door"));
    expect(emit).toHaveBeenCalledWith(EVENTS.UI_OPEN_ISSUES, undefined);
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
  });

  it("approved: no banner, no row — the CTA opens the facts confirm and nothing else", async () => {
    const move = moveAt({ reviewState: "approved" })!;
    const { onRequestPublish } = renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-checks-legend")).toBeTruthy());
    expect(move.gate).toBe("confirm");
    expect(screen.queryByTestId("publish-gate-banner")).toBeNull();
    expect(screen.queryByTestId("publish-check-approval")).toBeNull();
    fireEvent.click(cta());
    expect(onRequestPublish).toHaveBeenCalledTimes(1);
  });
});

describe("PublishTab — the other shut doors", () => {
  it("a permission block prints the CTA's own reason and opens nothing", async () => {
    const move = moveAt({ reviewState: "approved", isViewer: true })!;
    const { onRequestPublish } = renderTab(move);
    await waitFor(() => expect(screen.getByTestId("publish-cta-reason")).toBeTruthy());
    expect(cta().disabled).toBe(true);
    expect(screen.getByTestId("publish-cta-reason").textContent).toBe("Viewers can't publish — ask an editor");
    expect(screen.queryByTestId("publish-gate-banner")).toBeNull();
    fireEvent.click(cta());
    expect(onRequestPublish).not.toHaveBeenCalled();
  });

  it("no next move (live, nothing waiting) says so and stays shut", async () => {
    renderTab(null);
    await waitFor(() => expect(screen.getByTestId("publish-cta-reason")).toBeTruthy());
    expect(cta().disabled).toBe(true);
    expect(screen.getByTestId("publish-cta-reason").textContent).toBe("Nothing has changed since the last deploy.");
  });

  it("no publish path wired still wins over every gate (board 784:4480)", () => {
    const { container } = render(
      <ToastProvider>
        <PublishTab composer={composerWith()} projectId="site_1" nextMove={moveAt({ reviewState: "approved" })} />
      </ToastProvider>,
    );
    expect(container.textContent).toContain("Connect Vercel to publish.");
    expect(screen.queryByTestId("publish-cta")).toBeNull();
  });
});
