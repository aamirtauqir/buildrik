/**
 * StudioHeader — the topbar container's wiring.
 *
 * Everything asserted here is a mapping the container owns: editor state → the
 * design's vocabulary. How the bar draws any of it is the `Topbar` component's
 * own suite (`editor/ui/__tests__/topbar.test.tsx`); asserting it twice would
 * pin the same pixels in two places and make the design system unmovable.
 *
 * Selectors are roles and text, never classes.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── controllable module mocks ────────────────────────────────────────────────

vi.mock("@/shared/utils/featureFlags", () => ({ isFeatureEnabled: vi.fn(() => false) }));

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
vi.mock("../hooks/useEditorRole", () => ({ useEditorRole: () => roleState.role }));

vi.mock("../../../services/NotificationService", () => ({
  fetchRecentNotifications: vi.fn(() => Promise.resolve([])),
  fetchUnreadCount: vi.fn(() => Promise.resolve(0)),
  markNotificationRead: vi.fn(() => Promise.resolve()),
  markAllNotificationsRead: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../canvas/hooks/useCollaboration", () => ({
  useCollaboration: () => ({ users: [], currentUser: null, state: "disconnected", isConnected: false }),
}));

vi.mock("../modals/CommandPalette", () => ({
  CommandPalette: (props: { onClose: () => void }) => (
    <div data-testid="command-palette">
      <button onClick={props.onClose}>close</button>
    </div>
  ),
}));

vi.mock("@/editor/design-system/ui/ColorModeIconCycle", () => ({
  ColorModeIconCycle: () => <div data-testid="color-mode-cycle" />,
}));

import { StudioHeader, type StudioHeaderProps } from "../StudioHeader";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { getEditorViewMode } from "../../../shared/utils/editorViewMode";
import { submitForReview, fetchReviewStatus } from "../../../services/ReviewService";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Partial<StudioHeaderProps> = {}): StudioHeaderProps {
  return {
    composer: null,
    saveStatus: "idle",
    isDirty: false,
    lastSaved: null,
    previewLoading: false,
    selectedElement: null,
    onSetPreviewLoading: vi.fn(),
    onSetExportLoading: vi.fn(),
    onShowAI: vi.fn(),
    onShowExporter: vi.fn(),
    onSave: vi.fn(),
    onInlinePreview: vi.fn(),
    addToast: vi.fn(() => "id"),
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

describe("StudioHeader", () => {
  beforeEach(() => {
    vi.mocked(isFeatureEnabled).mockReturnValue(false);
    setViewMode({});
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    roleState.role = null;
  });

  describe("the bar carries exactly what Figma 681:122 draws", () => {
    it("is a banner with exit, the site name and the site menu", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.getByRole("banner")).toBeTruthy();
      expect(screen.getByRole("button", { name: "‹ Exit" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Site menu" })).toBeTruthy();
    });

    // The Figma component has nine children: exit, name, save, review, spacer,
    // presence, notifications, publish, menu. The first build of this container
    // pushed the deleted shell topbar's Preview / Comment / Colour-mode buttons
    // back into it through an `extra` slot; that slot is gone and these assert
    // it stays gone.
    it.each(["Preview", "Comment mode", "Color mode", "Ask AI", "Collaborate"])(
      "does not carry %s — not in the design",
      (name) => {
        render(<StudioHeader {...makeProps()} />);
        expect(screen.queryByRole("button", { name: new RegExp(`^${name}`) })).toBeNull();
      },
    );

    it("carries no issue pill — issues are a site-menu entry now", () => {
      render(
        <StudioHeader
          {...makeProps({
            issues: [{ id: "1", type: "error", message: "x" }] as StudioHeaderProps["issues"],
          })}
        />,
      );
      expect(screen.queryByRole("button", { name: /error|warning|issue/i })).toBeNull();
    });
  });

  describe("save state", () => {
    const save = (overrides: Partial<StudioHeaderProps>) =>
      render(<StudioHeader {...makeProps(overrides)} />);

    it("saving", () => {
      save({ saveStatus: "saving" });
      expect(screen.getByText("Saving…")).toBeTruthy();
    });

    it("a failed save interrupts, and becomes the retry button", () => {
      const onSave = vi.fn();
      save({ saveStatus: "error", onSave });
      const pill = screen.getByRole("button", { name: /Save failed/ });
      expect(pill.getAttribute("aria-live")).toBe("assertive");
      fireEvent.click(pill);
      expect(onSave).toHaveBeenCalled();
    });

    it("dirty work can be saved from the pill", () => {
      const onSave = vi.fn();
      save({ isDirty: true, onSave });
      fireEvent.click(screen.getByRole("button", { name: /Unsaved changes/ }));
      expect(onSave).toHaveBeenCalled();
    });

    it("a settled state is a status, not a button that does nothing", () => {
      save({ lastSavedAt: Date.now() });
      expect(screen.getByRole("status")).toBeTruthy();
      expect(screen.queryByRole("button", { name: /Saved/ })).toBeNull();
    });

    it("clean and saved", () => {
      save({ lastSavedAt: Date.now() });
      expect(screen.getByText("Saved just now")).toBeTruthy();
    });

    it("offline outranks a save error — queued is not lost", () => {
      save({ saveStatus: "error", isOffline: true });
      expect(screen.getByText("Offline — saved locally")).toBeTruthy();
    });

    it("a disconnected sync is also offline", () => {
      save({ studioSyncStatus: "offline" });
      expect(screen.getByText("Offline — saved locally")).toBeTruthy();
    });
  });

  describe("publish gating", () => {
    it("flag off: Publish is disabled and says why", () => {
      render(<StudioHeader {...makeProps()} />);
      const btn = screen.getByRole("button", { name: "Publish" });
      expect(btn).toBeDisabled();
      expect(btn.getAttribute("title")).toMatch(/isn't switched on/);
    });

    it("flag on: Publish is live and fires the publish job", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      const onVercelPublish = vi.fn();
      render(<StudioHeader {...makeProps({ onVercelPublish })} />);
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(onVercelPublish).toHaveBeenCalled();
    });

    it("offline blocks publish with the reason attached", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(<StudioHeader {...makeProps({ isOffline: true })} />);
      const btn = screen.getByRole("button", { name: "Publish" });
      expect(btn).toBeDisabled();
      expect(btn.getAttribute("title")).toBe("Can't publish while offline");
    });

    it("blocking errors turn it into Publish anyway rather than hiding it", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(
        <StudioHeader
          {...makeProps({ issues: [{ id: "1", type: "error", message: "x" }] as StudioHeaderProps["issues"] })}
        />,
      );
      expect(screen.getByRole("button", { name: "Publish anyway" })).toBeTruthy();
    });
  });

  describe("P6 viewer gating", () => {
    it("a viewer sees Publish disabled with the reason, never hidden", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = "VIEWER";
      render(<StudioHeader {...makeProps()} />);
      const btn = screen.getByRole("button", { name: "Publish" });
      expect(btn).toBeDisabled();
      expect(btn.getAttribute("title")).toBe("Viewers can't publish — ask an editor");
    });

    it("an editor keeps publish enabled", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = "EDITOR";
      render(<StudioHeader {...makeProps()} />);
      expect(screen.getByRole("button", { name: "Publish" })).not.toBeDisabled();
    });

    it("a viewer in client view cannot send for review either", () => {
      setViewMode({ clientView: true });
      roleState.role = "VIEWER";
      render(<StudioHeader {...makeProps()} />);
      const btn = screen.getByRole("button", { name: "Send for review" });
      expect(btn).toBeDisabled();
      expect(btn.getAttribute("title")).toMatch(/ask an editor/);
    });
  });

  describe("review status pill", () => {
    it("shows the pending pill once the status lands", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({ state: "pending", reviewerName: null, at: null });
      render(<StudioHeader {...makeProps()} />);
      expect(await screen.findByText("In review")).toBeTruthy();
    });

    it("names the reviewer on an approval", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({
        state: "approved",
        reviewerName: "Sara",
        at: new Date().toISOString(),
      });
      render(<StudioHeader {...makeProps()} />);
      expect(await screen.findByText(/Approved by Sara/)).toBeTruthy();
    });

    it("no review in flight, no pill", async () => {
      render(<StudioHeader {...makeProps()} />);
      await waitFor(() => expect(screen.queryByText(/In review|Approved/)).toBeNull());
    });
  });

  describe("client view sends for review instead of publishing", () => {
    beforeEach(() => setViewMode({ clientView: true }));

    it("replaces the Publish button entirely", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.getByRole("button", { name: "Send for review" })).toBeTruthy();
      expect(screen.queryByRole("button", { name: /^Publish/ })).toBeNull();
    });

    it("opens a form with a summary and a note", () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
      expect(screen.getByLabelText(/What changed/)).toBeTruthy();
      expect(screen.getByLabelText(/Note to the reviewer/)).toBeTruthy();
    });

    it("caps the free-text fields at 500 characters", () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
      expect(screen.getByLabelText(/What changed/).getAttribute("maxlength")).toBe("500");
      expect(screen.getByLabelText(/Note to the reviewer/).getAttribute("maxlength")).toBe("500");
    });

    it("submits note + summary and confirms in place", async () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
      fireEvent.change(screen.getByLabelText(/What changed/), { target: { value: "hero copy" } });
      fireEvent.change(screen.getByLabelText(/Note to the reviewer/), { target: { value: "take a look" } });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() =>
        expect(submitForReview).toHaveBeenCalledWith("take a look", "hero copy", undefined, undefined),
      );
      expect(await screen.findByRole("button", { name: "Sent for review ✓" })).toBeTruthy();
    });

    it("sends the client's email through — that is what issues the link", async () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Send for review" }));
      fireEvent.change(screen.getByLabelText(/Client email/), { target: { value: "c@example.com" } });
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
      await waitFor(() =>
        expect(submitForReview).toHaveBeenCalledWith(undefined, undefined, "c@example.com", undefined),
      );
    });
  });

  describe("⌘K command palette", () => {
    it("is closed until asked for", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.queryByTestId("command-palette")).toBeNull();
    });

    it("opens on Cmd+K and on Ctrl+K", () => {
      const { unmount } = render(<StudioHeader {...makeProps()} />);
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.getByTestId("command-palette")).toBeTruthy();
      unmount();
      cleanup();
      render(<StudioHeader {...makeProps()} />);
      fireEvent.keyDown(document, { key: "k", ctrlKey: true });
      expect(screen.getByTestId("command-palette")).toBeTruthy();
    });

    it("a second press closes it again", () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.queryByTestId("command-palette")).toBeNull();
    });

    it("stops listening once unmounted", () => {
      const { unmount } = render(<StudioHeader {...makeProps()} />);
      unmount();
      fireEvent.keyDown(document, { key: "k", metaKey: true });
      expect(screen.queryByTestId("command-palette")).toBeNull();
    });
  });

  describe("site menu", () => {
    const menuProps = {
      onOpenProjectSettings: vi.fn(),
      onOpenHistory: vi.fn(),
      onOpenPublishHistory: vi.fn(),
      onExportHTML: vi.fn(),
      onOpenTemplates: vi.fn(),
      onOpenComponents: vi.fn(),
      onOpenShortcuts: vi.fn(),
      onOpenIssues: vi.fn(),
    };

    // Figma popover/site-menu 642:3664 — items, order and grouping.
    it("opens with the designed items first, in the designed order", () => {
      render(<StudioHeader {...makeProps(menuProps)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      const labels = screen.getAllByRole("menuitem").map((i) => i.textContent);
      expect(labels.slice(0, 8)).toEqual([
        "Site settings⌘,",
        "Version history⌘H",
        "Publish history",
        "Export code",
        "Templates",
        "Components⇧A",
        "Keyboard shortcuts?",
        "Exit to dashboard",
      ]);
    });

    it("keeps the designed items and the extras in separate groups", () => {
      render(<StudioHeader {...makeProps(menuProps)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByRole("menu").querySelectorAll('[role="group"]').length).toBe(4);
      expect(screen.getByText("More")).toBeTruthy();
    });

    // Each of these is the only way to reach a feature that ships. They live
    // below the designed set rather than being deleted to match the mock.
    it.each(["Preview site", "Issues", "Preview as client", "Invite teammates", "Account settings"])(
      "keeps %s reachable, since the design names no other home for it",
      (label) => {
        render(<StudioHeader {...makeProps(menuProps)} />);
        fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
        expect(screen.getByRole("menuitem", { name: new RegExp(`^${label}`) })).toBeTruthy();
      },
    );

    it("Preview site opens the shell overlay — ⌘P is a different feature", () => {
      const onInlinePreview = vi.fn();
      render(<StudioHeader {...makeProps({ ...menuProps, onInlinePreview })} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      fireEvent.click(screen.getByRole("menuitem", { name: "Preview site" }));
      expect(onInlinePreview).toHaveBeenCalledTimes(1);
    });

    it("counts open issues on the row", () => {
      render(
        <StudioHeader
          {...makeProps({
            ...menuProps,
            onOpenIssues: vi.fn(),
            issues: [
              { id: "1", type: "error", message: "x" },
              { id: "2", type: "warning", message: "y" },
            ] as StudioHeaderProps["issues"],
          })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByRole("menuitem", { name: "Issues (2)" })).toBeTruthy();
    });

    it("offers the live URL only once the site has one", () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.queryByRole("menuitem", { name: "View live site" })).toBeNull();
      cleanup();

      render(<StudioHeader {...makeProps({ publishedUrl: "https://x.vercel.app" })} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByRole("menuitem", { name: "View live site" })).toBeTruthy();
      expect(screen.getByRole("menuitem", { name: "Copy live URL" })).toBeTruthy();
    });

    it("fires a handler and closes", () => {
      const onOpenHistory = vi.fn();
      render(<StudioHeader {...makeProps({ onOpenHistory })} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Version history/ }));
      expect(onOpenHistory).toHaveBeenCalled();
      expect(screen.queryByRole("menu")).toBeNull();
    });
  });

  describe("notifications", () => {
    it("the bell opens the panel and Escape closes it", async () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Notifications" }));
      expect(await screen.findByRole("dialog", { name: "Notifications" })).toBeTruthy();
      fireEvent.keyDown(document, { key: "Escape" });
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Notifications" })).toBeNull());
    });

    it("clicking away dismisses it, but the bell still toggles", async () => {
      render(<StudioHeader {...makeProps()} />);
      const bell = screen.getByRole("button", { name: "Notifications" });
      fireEvent.click(bell);
      expect(await screen.findByRole("dialog", { name: "Notifications" })).toBeTruthy();

      fireEvent.pointerDown(document.body);
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Notifications" })).toBeNull());

      // The bell lives inside the header, so its own pointerdown must not close
      // the panel out from under the click that opened it.
      fireEvent.pointerDown(bell);
      fireEvent.click(bell);
      expect(await screen.findByRole("dialog", { name: "Notifications" })).toBeTruthy();
    });
  });
});
