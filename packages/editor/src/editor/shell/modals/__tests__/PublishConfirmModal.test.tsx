// @vitest-environment jsdom
/**
 * PublishConfirmModal — the stop before an irreversible deploy.
 *
 * Publishing replaces the live site for every visitor. Before this modal the
 * normal path had NO confirm: clicking Publish exported and deployed. The only
 * gate was StaleApprovalModal, which fires after the server rejects a stale
 * approval, so the common case shipped unguarded.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import * as React from "react";

const exportPublishPages = vi.fn();
const fetchCurrentRound = vi.fn();

vi.mock("../../exportPublishPages", () => ({
  exportPublishPages: (c: unknown) => exportPublishPages(c),
}));
vi.mock("@/services/ReviewService", () => ({
  fetchCurrentRound: () => fetchCurrentRound(),
}));
vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { PublishConfirmModal } from "../PublishConfirmModal";

const composer = {} as never;

function renderModal(over: Partial<React.ComponentProps<typeof PublishConfirmModal>> = {}) {
  const props: React.ComponentProps<typeof PublishConfirmModal> = {
    isOpen: true,
    composer,
    isPublished: false,
    publishedUrl: null,
    onConfirm: vi.fn(),
    onClose: vi.fn(),
    ...over,
  };
  return { props, ...render(<ToastProvider><PublishConfirmModal {...props} /></ToastProvider>) };
}

beforeEach(() => {
  exportPublishPages.mockReset().mockResolvedValue([{ path: "index.html", html: "<p/>" }, { path: "about.html", html: "<p/>" }]);
  fetchCurrentRound.mockReset().mockResolvedValue(null);
});

describe("PublishConfirmModal — it does not publish on its own", () => {
  it("does not call onConfirm just by opening", async () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("publishes only when the user confirms", async () => {
    const onConfirm = vi.fn();
    renderModal({ onConfirm });
    fireEvent.click(await screen.findByText("Publish now"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("Cancel closes without publishing", async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({ onConfirm, onClose });
    fireEvent.click(await screen.findByText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("refuses to publish a site with zero pages", async () => {
    exportPublishPages.mockResolvedValue([]);
    renderModal();
    await waitFor(() => expect(screen.getByText(/0 pages/)).toBeTruthy());
    const btn = (await screen.findByText("Publish now")).closest("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

describe("PublishConfirmModal — it states the real consequence", () => {
  it("warns that a live site is replaced, and names the target", async () => {
    renderModal({ isPublished: true, publishedUrl: "https://bellacucina.com" });
    await waitFor(() =>
      expect(screen.getByText(/replaces the live site immediately/)).toBeTruthy(),
    );
    expect(screen.getByText("bellacucina.com")).toBeTruthy();
    expect(screen.getByText("Update now")).toBeTruthy();
  });

  it("does not claim a live site is being replaced on a first publish", async () => {
    const { container } = renderModal({ isPublished: false });
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    expect(container.textContent).not.toContain("replaces the live site");
    expect(screen.getByText("Publish now")).toBeTruthy();
  });
});

describe("PublishConfirmModal — approval line reflects the real round", () => {
  it("reports an approval with who and when", async () => {
    fetchCurrentRound.mockResolvedValue({
      id: "r1", status: "APPROVED", invitedEmail: "c@x.com", reviewerName: "Sara Khan",
      revoked: false, resolvedAt: "2026-07-02T10:00:00.000Z", createdAt: "2026-07-01T10:00:00.000Z",
      revision: "1", roundNumber: 1, totalRounds: 1, openCommentCount: 0,
    });
    renderModal();
    await waitFor(() => expect(screen.getByText(/Approved by Sara Khan/)).toBeTruthy());
  });

  it("says not-sent when there is no round", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    renderModal();
    await waitFor(() => expect(screen.getByText("Not sent for review.")).toBeTruthy());
  });

  it("surfaces unresolved comments instead of implying sign-off", async () => {
    fetchCurrentRound.mockResolvedValue({
      id: "r1", status: "OPEN", invitedEmail: "c@x.com", reviewerName: "Sara",
      revoked: false, resolvedAt: null, createdAt: "2026-07-01T10:00:00.000Z",
      revision: "1", roundNumber: 2, totalRounds: 2, openCommentCount: 3,
    });
    renderModal();
    await waitFor(() => expect(screen.getByText(/3 unresolved comments/)).toBeTruthy());
  });

  it("never blocks on a failed review lookup — publish stays available", async () => {
    fetchCurrentRound.mockRejectedValue(new Error("network"));
    renderModal();
    await waitFor(() => expect(screen.getByText("Not sent for review.")).toBeTruthy());
    const btn = (await screen.findByText("Publish now")).closest("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

describe("PublishConfirmModal — regression: no unbacked controls", () => {
  it("offers no deploy target, changelog note or scheduling", async () => {
    // publishInputSchema carries only siteId/pages/acknowledgeStale. There is no
    // environment column and nothing stores a per-publish note, so rendering the
    // Figma "Options" controls here would promise what the server cannot do.
    const { container } = renderModal();
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    for (const dead of ["Preview", "Schedule", "Changelog", "changelog note"]) {
      expect(container.textContent).not.toContain(dead);
    }
  });
});
