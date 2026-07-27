/**
 * Topbar.test.tsx — the editor chrome top bar. Selectors are verified
 * against the real rendered DOM: aria-labels, roles, and status text
 * (not internal class structure). Heavy children (PublishDropdown,
 * CommandPalette, ColorModeIconCycle) are mocked to markers so this
 * suite exercises Topbar's own wiring — zones, save-pill variants,
 * the client-view review popover (≤500 note constraint), the publish
 * feature-flag gate, and the ⌘K command-palette binding.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TooltipProvider } from "@/editor/shared/vibcoder";
import {
  render as rtlRender,
  screen,
  fireEvent,
  cleanup,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── controllable module mocks ────────────────────────────────────────────────

vi.mock("@/shared/utils/featureFlags", () => ({
  isFeatureEnabled: vi.fn(() => false),
}));

vi.mock("../../../shared/utils/editorViewMode", () => ({
  getEditorViewMode: vi.fn(() => ({
    railMode: "figma",
    fourToolRail: false,
    density: "full",
    clientView: false,
  })),
}));

vi.mock("../../../services/ReviewService", () => ({
  submitForReview: vi.fn(() => Promise.resolve()),
  fetchReviewStatus: vi.fn(() => Promise.resolve({ state: "none", reviewerName: null, at: null })),
  // RoleService (P6) resolves the site id through ReviewService — null keeps
  // the role "unknown" so no chrome gating kicks in during these tests.
  currentSiteId: vi.fn(() => null),
}));

// P6 role gating — controllable per test; null = unknown (no gating).
const roleState = vi.hoisted(() => ({ role: null as string | null }));
vi.mock("../hooks/useEditorRole", () => ({
  useEditorRole: () => roleState.role,
}));

vi.mock("../../../services/NotificationService", () => ({
  fetchRecentNotifications: vi.fn(() => Promise.resolve([])),
  fetchUnreadCount: vi.fn(() => Promise.resolve(0)),
  markNotificationRead: vi.fn(() => Promise.resolve()),
  markAllNotificationsRead: vi.fn(() => Promise.resolve()),
}));

vi.mock("../PublishDropdown", () => ({
  PublishDropdown: (props: { onPublish: () => void; onSave: () => void }) => (
    <div data-testid="publish-dropdown">
      <button data-testid="pd-publish" onClick={props.onPublish}>
        publish
      </button>
    </div>
  ),
}));

vi.mock("../modals/CommandPalette", () => ({
  CommandPalette: (props: { onClose: () => void }) => (
    <div data-testid="command-palette">
      <button data-testid="cmd-close" onClick={props.onClose}>
        close
      </button>
    </div>
  ),
}));

vi.mock("@/editor/design-system/ui/ColorModeIconCycle", () => ({
  ColorModeIconCycle: () => <div data-testid="color-mode-cycle" />,
}));

import { Topbar, type TopbarProps } from "../Topbar";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { getEditorViewMode } from "../../../shared/utils/editorViewMode";
import { submitForReview, fetchReviewStatus } from "../../../services/ReviewService";

// ── helpers ──────────────────────────────────────────────────────────────────

// Topbar's Radix tooltips require a TooltipProvider ancestor (mounted once at
// the app root in production). Wrap every render so the real DOM matches prod.
function render(ui: React.ReactElement) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>);
}

function makeProps(overrides: Partial<TopbarProps> = {}): TopbarProps {
  return {
    onPreview: vi.fn(),
    onPublish: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };
}

function setViewMode(partial: Partial<ReturnType<typeof getEditorViewMode>>) {
  vi.mocked(getEditorViewMode).mockReturnValue({
    railMode: "figma",
    fourToolRail: false,
    density: "full",
    clientView: false,
    ...partial,
  });
}

describe("Topbar", () => {
  beforeEach(() => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    setViewMode({});
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    roleState.role = null;
  });

  // ── zones ──────────────────────────────────────────────────────────────────
  describe("zones render", () => {
    it("renders the banner, exit-to-dashboard affordances, Preview, and More", () => {
      render(<Topbar {...makeProps()} />);
      expect(screen.getByRole("banner")).toBeInTheDocument();
      // brand mark + "‹ Exit" both carry the Exit aria-label
      expect(screen.getAllByLabelText("Exit to Dashboard").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByLabelText("Preview")).toBeInTheDocument();
      expect(screen.getByLabelText("More options")).toBeInTheDocument();
    });

    it("calls onPreview when the Preview button is clicked", () => {
      const onPreview = vi.fn();
      render(<Topbar {...makeProps({ onPreview })} />);
      fireEvent.click(screen.getByLabelText("Preview"));
      expect(onPreview).toHaveBeenCalledTimes(1);
    });

    it("shows 'Loading…' and disables Preview while previewLoading", () => {
      render(<Topbar {...makeProps({ previewLoading: true })} />);
      const btn = screen.getByLabelText("Preview");
      expect(btn).toBeDisabled();
      expect(btn).toHaveTextContent("Loading…");
    });

    it("renders no issue pill when there are no issues", () => {
      render(<Topbar {...makeProps({ issues: [] })} />);
      expect(screen.queryByLabelText(/open issues/)).not.toBeInTheDocument();
    });

    it("renders the issue pill with error + warning counts", () => {
      render(
        <Topbar
          {...makeProps({
            issues: [
              { id: "1", type: "error", message: "x" },
              { id: "2", type: "warning", message: "y" },
            ],
          })}
        />,
      );
      const pill = screen.getByLabelText(/open issues/);
      expect(pill).toHaveTextContent("1 error");
      expect(pill).toHaveTextContent("1 warning");
    });

    it("issue pill click fires onOpenIssues", () => {
      const onOpenIssues = vi.fn();
      render(
        <Topbar
          {...makeProps({
            onOpenIssues,
            issues: [{ id: "1", type: "error", message: "x" }],
          })}
        />,
      );
      fireEvent.click(screen.getByLabelText(/open issues/));
      expect(onOpenIssues).toHaveBeenCalledTimes(1);
    });
  });

  // ── save pill variants ───────────────────────────────────────────────────────
  describe("save-status pill", () => {
    function statusEl(container: HTMLElement): HTMLElement {
      // TopbarStatus renders .bd-topbar__status with the variant modifier class.
      const el = container.querySelector('[class*="bd-topbar__status--"]');
      if (!el) throw new Error("status pill not found");
      return el as HTMLElement;
    }

    it("saving → 'Saving…' with the --saving variant, non-interactive", () => {
      const { container } = render(<Topbar {...makeProps({ saveStatus: "saving" })} />);
      const el = statusEl(container);
      expect(el).toHaveTextContent("Saving…");
      expect(el.className).toContain("bd-topbar__status--saving");
      expect(el).not.toHaveAttribute("role", "button");
    });

    it("error → 'Save failed' with the --error variant, interactive (click = onSave)", () => {
      const onSave = vi.fn();
      const { container } = render(<Topbar {...makeProps({ saveStatus: "error", onSave })} />);
      const el = statusEl(container);
      expect(el).toHaveTextContent("Save failed");
      expect(el.className).toContain("bd-topbar__status--error");
      expect(el).toHaveAttribute("role", "button");
      fireEvent.click(el);
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("dirty → 'Unsaved' with the --warn variant, interactive", () => {
      const { container } = render(
        <Topbar {...makeProps({ isDirty: true, lastSavedAt: Date.now() })} />,
      );
      const el = statusEl(container);
      expect(el).toHaveTextContent("Unsaved");
      expect(el.className).toContain("bd-topbar__status--warn");
      expect(el).toHaveAttribute("role", "button");
    });

    it("saved (clean + lastSavedAt) → 'Saved · just now' with the --ok variant, non-interactive", () => {
      const { container } = render(
        <Topbar {...makeProps({ isDirty: false, lastSavedAt: Date.now() })} />,
      );
      const el = statusEl(container);
      expect(el).toHaveTextContent("Saved");
      expect(el).toHaveTextContent("just now");
      expect(el.className).toContain("bd-topbar__status--ok");
      expect(el).not.toHaveAttribute("role", "button");
    });

    it("no lastSavedAt → 'Not saved' with the --warn variant", () => {
      const { container } = render(<Topbar {...makeProps({})} />);
      const el = statusEl(container);
      expect(el).toHaveTextContent("Not saved");
      expect(el.className).toContain("bd-topbar__status--warn");
    });

    it("offline overrides everything, even a saveStatus of error", () => {
      const { container } = render(
        <Topbar {...makeProps({ isOffline: true, saveStatus: "error" })} />,
      );
      const el = statusEl(container);
      expect(el).toHaveTextContent("Offline");
      expect(el.className).toContain("bd-topbar__status--warn");
    });

    it("syncStatus 'offline' also drives the offline label", () => {
      const { container } = render(<Topbar {...makeProps({ syncStatus: "offline" })} />);
      expect(statusEl(container)).toHaveTextContent("Offline");
    });
  });

  // ── publish gating ──────────────────────────────────────────────────────────
  describe("publish gating (feature flag)", () => {
    it("flag OFF → shows the Export button, not the publish dropdown", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(false);
      render(<Topbar {...makeProps()} />);
      expect(screen.getByLabelText("Export HTML")).toBeInTheDocument();
      expect(screen.queryByTestId("publish-dropdown")).not.toBeInTheDocument();
    });

    it("Export button fires onExportHTML", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(false);
      const onExportHTML = vi.fn();
      render(<Topbar {...makeProps({ onExportHTML })} />);
      fireEvent.click(screen.getByLabelText("Export HTML"));
      expect(onExportHTML).toHaveBeenCalledTimes(1);
    });

    it("flag ON → renders the PublishDropdown, not Export", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(<Topbar {...makeProps()} />);
      expect(screen.getByTestId("publish-dropdown")).toBeInTheDocument();
      expect(screen.queryByLabelText("Export HTML")).not.toBeInTheDocument();
    });

    it("flag ON + offline → shows the 'Cannot publish while offline' note", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(<Topbar {...makeProps({ isOffline: true })} />);
      expect(screen.getByText("Cannot publish while offline")).toBeInTheDocument();
    });
  });

  // ── S5.2 review-status pill (designer-facing, default view) ────────────────
  describe("review-status pill in default view", () => {
    it("shows the pill in the normal editor when a review is pending", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({
        state: "pending",
        reviewerName: "Sara",
        at: null,
      });
      render(<Topbar {...makeProps()} />);
      expect(await screen.findByText("In review")).toBeInTheDocument();
    });

    it("shows the stale-approval pill state in the normal editor", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({
        state: "approved-edited-since",
        reviewerName: "Sara",
        at: null,
      });
      render(<Topbar {...makeProps()} />);
      expect(await screen.findByText("Approved · edited since")).toBeInTheDocument();
    });

    it("renders no pill when there is no review in flight", async () => {
      render(<Topbar {...makeProps()} />);
      expect(fetchReviewStatus).toHaveBeenCalled();
      expect(screen.queryByText("In review")).not.toBeInTheDocument();
    });
  });

  // ── client-view review popover ────────────────────────────────────────────────
  describe("client-view review popover", () => {
    beforeEach(() => setViewMode({ clientView: true, density: "fewer" }));

    it("client view replaces Publish/Export with 'Send for review'", () => {
      render(<Topbar {...makeProps()} />);
      expect(screen.getByLabelText("Send for review")).toBeInTheDocument();
      expect(screen.queryByLabelText("Export HTML")).not.toBeInTheDocument();
    });

    it("clicking the button opens the review dialog with a summary input + note textarea", () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.click(screen.getByLabelText("Send for review"));
      const dialog = screen.getByRole("dialog", { name: "Send for review" });
      expect(dialog).toBeInTheDocument();
      expect(
        within(dialog).getByPlaceholderText(/What changed/),
      ).toBeInTheDocument();
      expect(
        within(dialog).getByPlaceholderText(/Note to the reviewer/),
      ).toBeInTheDocument();
    });

    it("both review fields cap input at 500 characters (≤500 constraint)", () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.click(screen.getByLabelText("Send for review"));
      const dialog = screen.getByRole("dialog", { name: "Send for review" });
      expect(within(dialog).getByPlaceholderText(/What changed/)).toHaveAttribute(
        "maxlength",
        "500",
      );
      expect(
        within(dialog).getByPlaceholderText(/Note to the reviewer/),
      ).toHaveAttribute("maxlength", "500");
    });

    it("Send submits note + summary via submitForReview and shows 'Sent for review ✓'", async () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.click(screen.getByLabelText("Send for review"));
      const dialog = screen.getByRole("dialog", { name: "Send for review" });
      fireEvent.change(within(dialog).getByPlaceholderText(/What changed/), {
        target: { value: "new hero" },
      });
      fireEvent.change(within(dialog).getByPlaceholderText(/Note to the reviewer/), {
        target: { value: "please check copy" },
      });
      fireEvent.click(within(dialog).getByText("Send"));
      expect(submitForReview).toHaveBeenCalledWith("please check copy", "new hero", undefined, undefined);
      // resolves → button becomes the sent-confirmation
      expect(await screen.findByText("Sent for review ✓")).toBeInTheDocument();
    });

    it("sends the client's email through, which is what issues the review link", async () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.click(screen.getByLabelText("Send for review"));
      const dialog = screen.getByRole("dialog", { name: "Send for review" });
      fireEvent.change(within(dialog).getByLabelText("Client email"), {
        target: { value: "sara@bellacucina.com" },
      });
      fireEvent.change(within(dialog).getByPlaceholderText(/What changed/), {
        target: { value: "new hero" },
      });
      fireEvent.click(within(dialog).getByText("Send"));
      expect(submitForReview).toHaveBeenCalledWith(undefined, "new hero", "sara@bellacucina.com", undefined);
    });

    // Both paths are real: an address invites the client, no address keeps the
    // request internal. Blank must stay valid, not become a validation error.
    it("still submits with no email, keeping the request internal", async () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.click(screen.getByLabelText("Send for review"));
      const dialog = screen.getByRole("dialog", { name: "Send for review" });
      fireEvent.click(within(dialog).getByText("Send"));
      expect(submitForReview).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
      expect(await screen.findByText("Sent for review ✓")).toBeInTheDocument();
    });
  });

  // ── ⌘K command palette ────────────────────────────────────────────────────────
  describe("Cmd/Ctrl+K command palette", () => {
    it("is closed initially", () => {
      render(<Topbar {...makeProps()} />);
      expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
    });

    it("Cmd+K opens it (Topbar owns this binding)", () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    });

    it("Ctrl+K also opens it", () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    });

    it("Cmd+K toggles closed again on a second press", () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
    });

    it("removes its keydown listener on unmount", () => {
      const { unmount } = render(<Topbar {...makeProps()} />);
      unmount();
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
    });
  });

  // ── ⋯ overflow menu ───────────────────────────────────────────────────────────
  describe("overflow (⋯) menu", () => {
    it("opens on click and exposes the site-level actions from the Figma contract", () => {
      render(
        <Topbar
          {...makeProps({
            onOpenDesignSystem: vi.fn(),
            onOpenProjectSettings: vi.fn(),
            onOpenHistory: vi.fn(),
          })}
        />,
      );
      fireEvent.click(screen.getByLabelText("More options"));
      expect(screen.getByText("Design system")).toBeInTheDocument();
      expect(screen.getByText("Site settings")).toBeInTheDocument();
      expect(screen.getByText("Version history")).toBeInTheDocument();
      expect(screen.getByText("Invite teammates")).toBeInTheDocument();
      expect(screen.getByText(/Command palette/)).toBeInTheDocument();
    });

    it("'Command palette' menu item opens the palette", () => {
      render(<Topbar {...makeProps()} />);
      fireEvent.click(screen.getByLabelText("More options"));
      fireEvent.click(screen.getByText(/Command palette/));
      expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    });

    it("menu items fire their handlers and close the menu", () => {
      const onOpenDesignSystem = vi.fn();
      render(<Topbar {...makeProps({ onOpenDesignSystem })} />);
      fireEvent.click(screen.getByLabelText("More options"));
      fireEvent.click(screen.getByText("Design system"));
      expect(onOpenDesignSystem).toHaveBeenCalledTimes(1);
      expect(screen.queryByText("Design system")).not.toBeInTheDocument();
    });
  });

  // ── P6 permissions boards: VIEWER sees Publish / Send-for-review DISABLED
  //    with the reason attached — never hidden. Unknown role = no gating.
  describe("P6 viewer gating", () => {
    it("VIEWER + publish flag on: disabled Publish button with reason, no dropdown", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = "VIEWER";
      render(<Topbar {...makeProps()} />);
      expect(screen.queryByTestId("publish-dropdown")).not.toBeInTheDocument();
      const publish = screen.getByRole("button", { name: "Publish" });
      expect(publish).toBeDisabled();
      expect(publish).toHaveAttribute("title", "Viewers can't publish — ask an editor");
    });

    it("unknown role + publish flag on: the real PublishDropdown renders", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = null;
      render(<Topbar {...makeProps()} />);
      expect(screen.getByTestId("publish-dropdown")).toBeInTheDocument();
    });

    it("VIEWER in client view: Send for review disabled with reason", () => {
      setViewMode({ clientView: true });
      roleState.role = "VIEWER";
      render(<Topbar {...makeProps()} />);
      const send = screen.getByRole("button", { name: "Send for review" });
      expect(send).toBeDisabled();
      expect(send).toHaveAttribute("title", "Viewers can't send for review — ask an editor");
    });

    it("EDITOR keeps publish enabled (only VIEWER is read-only)", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = "EDITOR";
      render(<Topbar {...makeProps()} />);
      expect(screen.getByTestId("publish-dropdown")).toBeInTheDocument();
    });
  });
});
