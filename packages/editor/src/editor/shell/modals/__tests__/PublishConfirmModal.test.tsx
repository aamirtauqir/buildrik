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

vi.mock("@/editor/shell/exportPublishPages", () => ({
  exportPublishPages: (c: unknown) => exportPublishPages(c),
}));
vi.mock("@/services/ReviewService", () => ({
  fetchCurrentRound: () => fetchCurrentRound(),
  fetchApprovedSnapshot: async () => [{ path: "index.html", html: "<p>old</p>" }],
}));
const myRole = { role: "ADMIN" as string | null };
vi.mock("@/services/RoleService", () => ({
  fetchMyRole: async () => myRole.role,
  roleAtLeast: (r: string | null, min: string) => (r === null ? null : ["VIEWER", "EDITOR", "ADMIN", "OWNER"].indexOf(r) >= ["VIEWER", "EDITOR", "ADMIN", "OWNER"].indexOf(min)),
}));
vi.mock("@/editor/chrome-ui", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("@/editor/chrome-ui");
  return { ...actual, useToast: () => ({ addToast: vi.fn(), removeToast: vi.fn(), toasts: [] }) };
});

import { ToastProvider } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { PublishConfirmModal } from "../PublishConfirmModal";
import { publishTray } from "@/editor/shell/publishTrayStore";

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
    fireEvent.click(await screen.findByText("Publish"));
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
    const btn = (await screen.findByText("Publish")).closest("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

describe("PublishConfirmModal — it states the real consequence", () => {
  it("names the live domain in the title and keeps the current release (B8-PB04)", async () => {
    renderModal({ isPublished: true, publishedUrl: "https://bellacucina.com" });
    expect(screen.getByText("Publish to bellacucina.com")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByTestId("publish-fact-val-rollback").textContent).toContain(
        "the current live release stays available to republish",
      ),
    );
    expect(screen.getByText("1 Changes")).toBeTruthy();
    expect(screen.getByText("5 Release")).toBeTruthy();
  });

  it("a first publish has no live release to keep", async () => {
    const { container } = renderModal({ isPublished: false });
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    expect(screen.getByText("Publish this site")).toBeTruthy();
    expect(container.textContent).not.toContain("current live release");
  });
});

describe("PublishConfirmModal — tips are acknowledged (B8-PB04 / Play F4.09)", () => {
  it("Publish waits for “I’ve seen these”, with the reason under it", async () => {
    publishTray.setIssues([{ id: "w", type: "warning", message: "2 images have no alt text" }]);
    const onConfirm = vi.fn();
    renderModal({ onConfirm });
    await waitFor(() => expect(screen.getByText("1 advisory check")).toBeTruthy());
    const btn = screen.getByText("Publish").closest("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId("publish-confirm-reason").textContent).toBe("Tick the boxes above to publish");
    fireEvent.click(screen.getByTestId("publish-fact-tips-seen"));
    expect(btn.disabled).toBe(false);
    expect(screen.queryByTestId("publish-confirm-reason")).toBeNull();
    fireEvent.click(btn);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    publishTray.setIssues([]);
  });

  it("no tips, no box: Publish is ready", async () => {
    renderModal();
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    expect(screen.queryByTestId("publish-fact-tips-seen")).toBeNull();
    expect((screen.getByText("Publish").closest("button") as HTMLButtonElement).disabled).toBe(false);
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

  it("no round, no Approval row", async () => {
    fetchCurrentRound.mockResolvedValue(null);
    renderModal();
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    await waitFor(() => expect(screen.queryByText("4 Approval")).toBeNull());
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
    await waitFor(() => expect(screen.queryByText("4 Approval")).toBeNull());
    const btn = (await screen.findByText("Publish")).closest("button") as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });
});

/* DEF-shell-publish-confirm-no-panel / board 7574:193972: the confirm used to
   float over whatever the canvas was already showing. The board opens the
   Publish panel (with its pre-publish checks) in the right column BEHIND the
   confirm. `UI_PANEL_OPEN` is the existing event `useEditorEventListeners`
   already answers for every ⌘K "Open X panel" command. */
describe("PublishConfirmModal — opens the Publish panel behind it", () => {
  it("emits UI_PANEL_OPEN for 'publish' once, on open", async () => {
    const emit = vi.fn();
    renderModal({ composer: { emit } as never, isOpen: true });
    await waitFor(() => expect(screen.getByText(/2 pages/)).toBeTruthy());
    expect(emit).toHaveBeenCalledWith(EVENTS.UI_PANEL_OPEN, { panel: "publish" });
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it("does not emit while closed", async () => {
    const emit = vi.fn();
    renderModal({ composer: { emit } as never, isOpen: false });
    expect(emit).not.toHaveBeenCalled();
  });

  it("tolerates a composer with no emit method (test doubles elsewhere in this file)", async () => {
    expect(() => renderModal({ composer: {} as never })).not.toThrow();
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

/* A-31 · B8-PB05 233:2418 / PB06 233:3034 — the stale-approval door opens the
   same numbered confirm; StaleApprovalModal is gone. */
describe("PublishConfirmModal — stale approval", () => {
  const approved = {
    id: "r1", status: "APPROVED", invitedEmail: "c@x.com", reviewerName: "Lena",
    revoked: false, resolvedAt: "2026-10-15T10:00:00.000Z", createdAt: "2026-10-14T10:00:00.000Z",
    revision: "1", roundNumber: 1, totalRounds: 1, openCommentCount: 0,
  };

  it("an Admin ticks 'Publish without a fresh review' before Publish opens; the row counts the changes", async () => {
    myRole.role = "ADMIN";
    fetchCurrentRound.mockResolvedValue(approved);
    const onConfirm = vi.fn();
    renderModal({ stale: true, onConfirm, isPublished: true, publishedUrl: "https://fieldwork.studio" });
    await waitFor(() => expect(screen.getByTestId("publish-fact-val-approval")).toHaveTextContent(/edited since \(2 changes\)/));
    const publish = screen.getByText("Publish").closest("button") as HTMLButtonElement;
    expect(publish.disabled).toBe(true);
    fireEvent.click(await screen.findByTestId("publish-confirm-override"));
    expect(publish.disabled).toBe(false);
    fireEvent.click(publish);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("an Editor is offered a fresh review instead, and Publish stays shut", async () => {
    myRole.role = "EDITOR";
    fetchCurrentRound.mockResolvedValue(approved);
    const emit = vi.fn();
    const onClose = vi.fn();
    renderModal({ stale: true, composer: { emit } as never, onClose });
    expect(await screen.findByTestId("publish-confirm-stale-note")).toHaveTextContent(
      "Publishing without a fresh review needs Admin access — or request a fresh review.",
    );
    expect((screen.getByText("Publish").closest("button") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId("publish-confirm-request-review"));
    expect(onClose).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledWith(EVENTS.UI_SWITCH_TAB, { tab: "review" });
  });
});
