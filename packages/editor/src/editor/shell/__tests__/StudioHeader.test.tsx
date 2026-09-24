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
import { render, screen, fireEvent, cleanup, waitFor, act, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── controllable module mocks ────────────────────────────────────────────────

vi.mock("@/shared/utils/featureFlags", () => ({ isFeatureEnabled: vi.fn(() => false) }));

vi.mock("../../../shared/utils/editorViewMode", () => ({
  getEditorViewMode: vi.fn(() => ({
    railMode: "figma",
    fourToolRail: false,
    readOnlyView: false,
  })),
}));

vi.mock("../../../services/ReviewService", () => ({
  submitForReview: vi.fn(() => Promise.resolve()),
  fetchReviewStatus: vi.fn(() =>
    Promise.resolve({ state: "none", reviewerName: null, at: null, reviewsEnabled: true, editsRequireApproval: false }),
  ),
  fetchReviewStatusOrNull: vi.fn(() => Promise.resolve(null)),
  /* The header holds this as its pre-fetch state, so a wholesale mock has to
     carry it or every render throws before the first assertion. Flags null =
     "nobody has answered yet", which is what the component must not mistake for
     "reviews are on". */
  UNKNOWN_REVIEW_STATUS: {
    state: "none",
    reviewerName: null,
    at: null,
    reviewsEnabled: null,
    editsRequireApproval: null,
  },
  // RoleService (P6) resolves the site id through ReviewService — null keeps
  // the role "unknown" so no chrome gating kicks in during these tests.
  currentSiteId: vi.fn(() => null),
}));

// P6 role gating — controllable per test; null = unknown (no gating).
const roleState = vi.hoisted(() => ({ role: null as string | null }));
let strandedMirrors = 0;
vi.mock("@/services/syncRetryQueue", () => ({
  totalPendingMirrors: () => strandedMirrors,
}));

vi.mock("../hooks/useEditorRole", () => ({ useEditorRole: () => roleState.role }));

vi.mock("../../../services/NotificationService", () => ({
  fetchRecentNotifications: vi.fn(() => Promise.resolve([])),
  fetchUnreadCount: vi.fn(() => Promise.resolve(0)),
  markNotificationRead: vi.fn(() => Promise.resolve()),
  markAllNotificationsRead: vi.fn(() => Promise.resolve()),
}));

// Mutable so presence tests can seat a room; default is the solo, offline case.
const COLLAB_IDLE = {
  users: [] as unknown[],
  currentUser: null as unknown,
  state: "disconnected",
  isConnected: false,
};
const collab = { current: { ...COLLAB_IDLE } };
vi.mock("../../canvas/hooks/useCollaboration", () => ({
  useCollaboration: () => collab.current,
}));

vi.mock("../modals/CommandPalette", () => ({
  CommandPalette: (props: { onClose: () => void }) => (
    <div data-testid="command-palette">
      <button onClick={props.onClose}>close</button>
    </div>
  ),
}));

import { StudioHeader, type StudioHeaderProps } from "../StudioHeader";
import { deriveLifecycleState } from "../lifecycle";
import { isFeatureEnabled } from "@/shared/utils/featureFlags";
import { getEditorViewMode } from "../../../shared/utils/editorViewMode";
import { submitForReview } from "../../../services/ReviewService";
import type { ReviewStatus } from "../../../services/ReviewService";

/* ReviewStatus gained two flag fields — whether reviews exist here at all, and
   whether publishing is gated on an approval — because `state: "none"` could
   not tell "reviews are off" from "never sent". Every case in this file was
   written against a workspace where reviews are on and publishing is not
   gated, so that is the default; a case that cares says so.

   B4 (2026-09-22): the header no longer fetches the status or derives the
   next move — `useLifecycle` does, once, in AquibraStudio, and both arrive
   as props. `makeProps` derives `nextMove` from the same inputs the hook
   would read, so every case below still describes a real state. */
const reviewStatus = (o: Partial<ReviewStatus> = {}): ReviewStatus => ({
  state: "none",
  reviewerName: null,
  at: null,
  reviewsEnabled: true,
  editsRequireApproval: false,
  ...o,
});

// ── helpers ──────────────────────────────────────────────────────────────────

function makeProps(overrides: Partial<StudioHeaderProps> = {}): StudioHeaderProps {
  const rs = overrides.reviewStatus ?? reviewStatus();
  const merged = {
    composer: null,
    saveStatus: "idle" as const,
    isDirty: false,
    lastSaved: null,
    previewLoading: false,
    selectedElement: null,
    onSetPreviewLoading: vi.fn(),
    onSetExportLoading: vi.fn(),
    onShowExporter: vi.fn(),
    onSave: vi.fn(async () => "saved" as const),
    addToast: vi.fn(() => "id"),
    ...overrides,
    reviewStatus: rs,
  };
  const nextMove =
    "nextMove" in overrides
      ? (overrides.nextMove ?? null)
      : deriveLifecycleState({
          reviewState: rs.state,
          reviewerName: rs.reviewerName,
          reviewsEnabled: rs.reviewsEnabled,
          editsRequireApproval: rs.editsRequireApproval,
          isPublished: Boolean(merged.publishedUrl),
          hasUnpublishedChanges: merged.isDirty || null,
          isViewer: roleState.role === "VIEWER",
          publishEnabled: isFeatureEnabled("publish") === true,
          offline: Boolean(merged.isOffline) || merged.studioSyncStatus === "offline",
          errorCount: (merged.issues ?? []).filter((i) => i.type === "error").length,
        });
  return { ...merged, nextMove };
}

function setViewMode(partial: Partial<ReturnType<typeof getEditorViewMode>>) {
  vi.mocked(getEditorViewMode).mockReturnValue({
    railMode: "figma",
    fourToolRail: false,
    readOnlyView: false,
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
    collab.current = { ...COLLAB_IDLE };
  });

  describe("the bar carries exactly what Figma 681:122 draws", () => {
    it("is a banner with exit, the site name and the site menu", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.getByRole("banner")).toBeTruthy();
      expect(screen.getByRole("button", { name: "‹ Exit" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Site menu" })).toBeTruthy();
    });

    // The shell topbar on board 4418:123573 draws Preview (a text button, from
    // the tools cluster); the deleted shell topbar's Comment-mode / Colour-mode
    // / Ask AI / Collaborate buttons stay gone.
    it.each(["Comment mode", "Color mode", "Ask AI", "Collaborate"])(
      "does not carry %s — not in the design",
      (name) => {
        render(<StudioHeader {...makeProps()} />);
        expect(screen.queryByRole("button", { name: new RegExp(`^${name}`) })).toBeNull();
      },
    );

    /* C3 (§16.1 row 11): the topbar carries only the Figma master's
       controls. The Issues chip and the Live chip are gone; Issues opens from
       the site menu and ⌘K, the live URL lives in the site menu. */
    it("carries no Issues chip, whatever the count", () => {
      render(
        <StudioHeader
          {...makeProps({
            onOpenIssues: vi.fn(),
            issues: [
              { id: "1", type: "error", message: "x" },
              { id: "2", type: "warning", message: "y" },
            ] as StudioHeaderProps["issues"],
          })}
        />,
      );
      expect(screen.queryByRole("button", { name: /issue/i })).toBeNull();
    });

    it("carries no Live chip on a published site", () => {
      render(<StudioHeader {...makeProps({ publishedUrl: "https://x.vercel.app" })} />);
      const bar = screen.getByTestId("topbar");
      expect(within(bar).queryByRole("link")).toBeNull();
      expect(bar.textContent).not.toContain("x.vercel.app");
    });

    /* C5 G1-004 (boards 4418:126034 / :90494 / :123573): "Site › Page" —
       the site crumb opens the Pages panel; the page crumb is where you are. */
    it("the breadcrumb: site opens Pages, page is the current crumb and closes the drawer", () => {
      const onOpenPages = vi.fn();
      const onCloseDrawer = vi.fn();
      const composer = { on: vi.fn(), off: vi.fn(), emit: vi.fn(), elements: { getActivePage: () => ({ name: "Menu" }) } };
      render(<StudioHeader {...makeProps({ onOpenPages, onCloseDrawer, composer: composer as never })} />);
      expect(screen.getByTestId("topbar-crumb-page")).toHaveTextContent("Menu");
      expect(screen.getByTestId("topbar-crumb-page").getAttribute("aria-current")).toBe("page");
      fireEvent.click(screen.getByTestId("topbar-crumb-site"));
      expect(onOpenPages).toHaveBeenCalled();
      expect(onCloseDrawer).not.toHaveBeenCalled();
      fireEvent.click(screen.getByTestId("topbar-crumb-page"));
      expect(onCloseDrawer).toHaveBeenCalled();
    });

    /* B6 / G1-019: the activity log opens in the editor (History ·
       Activity), not a dashboard tab. */
    it("the site menu's Activity log opens History · Activity in the editor", () => {
      const onOpenActivity = vi.fn();
      const open = vi.spyOn(window, "open").mockImplementation(() => null);
      window.history.replaceState(null, "", "/?siteId=s1");
      render(<StudioHeader {...makeProps({ onOpenActivity })} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      fireEvent.click(screen.getByTestId("site-menu-activity-log"));
      expect(onOpenActivity).toHaveBeenCalled();
      expect(open).not.toHaveBeenCalled();
      window.history.replaceState(null, "", "/");
      open.mockRestore();
    });

    it("the site menu's Issues row opens the panel and names the count", () => {
      const onOpenIssues = vi.fn();
      render(
        <StudioHeader
          {...makeProps({
            onOpenIssues,
            issues: [
              { id: "1", type: "error", message: "x" },
              { id: "2", type: "warning", message: "y" },
            ] as StudioHeaderProps["issues"],
          })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      const row = screen.getByRole("menuitem", { name: /^Issues/ });
      expect(row.getAttribute("title")).toBe("2 issues · 1 error, 1 warning — review before publish");
      fireEvent.click(row);
      expect(onOpenIssues).toHaveBeenCalled();
    });
  });

  describe("save state", () => {
    const save = (overrides: Partial<StudioHeaderProps>) =>
      render(<StudioHeader {...makeProps(overrides)} />);

    it("saving", () => {
      save({ saveStatus: "saving" });
      expect(screen.getByText("Saving…")).toBeTruthy();
    });

    it("a failed save becomes the retry button", () => {
      const onSave = vi.fn();
      save({ saveStatus: "error", onSave });
      const pill = screen.getByRole("button", { name: /Save failed/ });
      // eng D5: the pill carries no live region of its own — the header pipe speaks.
      expect(pill.getAttribute("aria-live")).toBeNull();
      fireEvent.click(pill);
      expect(onSave).toHaveBeenCalled();
    });

    // eng D5 (regression): transitions announce exactly ONCE, via the header's
    // single pipe — assertive for failure, and never doubled by SaveStatus.
    it("a save failure announces once through the header's assertive region", () => {
      const { rerender } = render(<StudioHeader {...makeProps({ saveStatus: "idle" })} />);
      rerender(<StudioHeader {...makeProps({ saveStatus: "error" })} />);
      expect(screen.getByTestId("bk-announce-assertive").textContent).toBe("Save failed");
      expect(document.querySelectorAll('[aria-live="assertive"]').length).toBe(1);
    });

    it("mounting already-failed does not announce — announcements are transitions", () => {
      render(<StudioHeader {...makeProps({ saveStatus: "error" })} />);
      expect(screen.getByTestId("bk-announce-assertive").textContent).toBe("");
    });

    /* B2 (decision #23): the pill's click is routed by state — History for the
       three ordinary states, retry for error, the recovery dialog for a
       conflict, nothing (a tooltip) offline. ⌘S is the save. The per-state
       table is StudioHeader.savePill.test.tsx; this keeps the one assert the
       old "saves from the pill" case protected: the save is still reachable. */
    it("unsaved work opens History from the pill — ⌘S is the save", () => {
      const onSave = vi.fn();
      const onOpenHistory = vi.fn();
      save({ isDirty: true, onSave, onOpenHistory });
      fireEvent.click(screen.getByRole("button", { name: /Unsaved changes/ }));
      expect(onOpenHistory).toHaveBeenCalledTimes(1);
      expect(onSave).not.toHaveBeenCalled();
    });

    it("clean and saved", () => {
      save({ lastSavedAt: Date.now() });
      expect(screen.getByText("Saved").textContent).toBe("Saved just now");
    });

    it("offline outranks a save error — queued is not lost", () => {
      save({ saveStatus: "error", isOffline: true });
      expect(screen.getByText("Offline — not saved")).toBeTruthy();
    });

    it("a disconnected sync is also offline", () => {
      save({ studioSyncStatus: "offline" });
      expect(screen.getByText("Offline — not saved")).toBeTruthy();
    });
  });

  describe("publish gating", () => {
    it("flag off: Publish is blocked but focusable, with the reason in a tooltip", () => {
      render(<StudioHeader {...makeProps()} />);
      const btn = screen.getByRole("button", { name: "Publish" });
      expect(btn.getAttribute("aria-disabled")).toBe("true");
      expect(btn).not.toBeDisabled();
      fireEvent.focus(btn);
      expect(screen.getByRole("tooltip").textContent).toMatch(/isn't switched on/);
    });

    it("flag on: Publish is live and fires the publish job", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      const onVercelPublish = vi.fn();
      render(<StudioHeader {...makeProps({ onVercelPublish })} />);
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(onVercelPublish).toHaveBeenCalled();
    });

    it("offline blocks publish with the reason reachable on focus", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(<StudioHeader {...makeProps({ isOffline: true })} />);
      const btn = screen.getByRole("button", { name: "Publish" });
      expect(btn.getAttribute("aria-disabled")).toBe("true");
      fireEvent.focus(btn);
      /* Two tooltips exist offline — the save pill carries its own (B2) — so
         the assert names the CTA's by its text. */
      expect(screen.getByText("Can't publish while offline").closest('[role="tooltip"]')).not.toBeNull();
    });

    it("blocking errors turn it into Publish anyway rather than hiding it", async () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(
        <StudioHeader
          {...makeProps({ issues: [{ id: "1", type: "error", message: "x" }] as StudioHeaderProps["issues"] })}
        />,
      );
      expect(await screen.findByRole("button", { name: "Publish anyway" })).toBeTruthy();
    });
  });

  // ── B4 · one publish door ────────────────────────────────────────────────
  describe("the publish verb is a door, not a publish", () => {
    /* The "Publish with N open errors?" confirm was this bar's private dialog,
       so the Publish panel's identical verb skipped it. It is
       PublishErrorsConfirmModal now, mounted by AquibraStudio, whose
       `requestPublish` routes on `nextMove.gate` — this bar hands off and
       opens nothing of its own (PublishErrorsConfirmModal.test.tsx). */
    it("Publish anyway hands off to the shell's door — no dialog here", async () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      const onVercelPublish = vi.fn();
      render(
        <StudioHeader
          {...makeProps({
            onVercelPublish,
            issues: [{ id: "1", type: "error", message: "x" }] as StudioHeaderProps["issues"],
          })}
        />,
      );
      fireEvent.click(await screen.findByRole("button", { name: "Publish anyway" }));
      expect(onVercelPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("a review verb opens the Review panel instead", async () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      const onVercelPublish = vi.fn();
      const onOpenReview = vi.fn();
      render(
        <StudioHeader
          {...makeProps({
            onVercelPublish,
            onOpenReview,
            reviewStatus: reviewStatus({ editsRequireApproval: true }),
          })}
        />,
      );
      fireEvent.click(await screen.findByRole("button", { name: "Send for review" }));
      expect(onOpenReview).toHaveBeenCalledTimes(1);
      expect(onVercelPublish).not.toHaveBeenCalled();
    });
  });

  // ── T5 publish outcome (plan D10, eng D10/D11) ────────────────────────────
  describe("publish outcome flash", () => {
    it("published flashes '✓ Published' and announces politely", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(<StudioHeader {...makeProps({ publishOutcome: "published" })} />);
      const btn = screen.getByRole("button", { name: "✓ Published" });
      expect(btn).toBeDisabled();
      expect(screen.getByRole("status").textContent).toBe("Published — site is live");
    });

    it("failed announces assertively — the toast (useExportHandlers) owns the retry door", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      render(<StudioHeader {...makeProps({ publishOutcome: "failed" })} />);
      expect(screen.getByTestId("bk-announce-assertive").textContent).toBe("Publish failed");
      // the button returns to its normal state — no error styling lingers
      expect(screen.getByRole("button", { name: "Publish" })).toBeTruthy();
    });
  });

  describe("P6 viewer gating", () => {
    it("a viewer sees Publish blocked with the reason, never hidden", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = "VIEWER";
      render(<StudioHeader {...makeProps()} />);
      const btn = screen.getByRole("button", { name: "Publish" });
      expect(btn.getAttribute("aria-disabled")).toBe("true");
      fireEvent.focus(btn);
      expect(screen.getByRole("tooltip").textContent).toBe("Viewers can't publish — ask an editor");
    });

    it("an editor keeps publish enabled", () => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      roleState.role = "EDITOR";
      render(<StudioHeader {...makeProps()} />);
      expect(screen.getByRole("button", { name: "Publish" })).not.toBeDisabled();
    });

    /* Was: a viewer in view mode sees a disabled "Send for review". There is
       no send control in view mode at all now, for any role — the viewer
       gating that matters moved with the control, to the Review panel. */
    it("a viewer in view mode is offered no send control at all", () => {
      setViewMode({ readOnlyView: true });
      roleState.role = "VIEWER";
      render(<StudioHeader {...makeProps()} />);
      expect(screen.queryByRole("button", { name: "Send for review" })).toBeNull();
    });
  });

  /* Board B3-01 7569:190283 (C2): the chip is the status VERB plus the one
     number that matters; the sentence rides in `title`. */
  describe("review status chip", () => {
    it("a pending round reads 'Waiting · <name>'", () => {
      render(<StudioHeader {...makeProps({ reviewStatus: reviewStatus({ state: "pending", reviewerName: "Sara" }) })} />);
      expect(screen.getByText("Waiting · Sara")).toBeTruthy();
    });

    it("an approval reads 'Approved' with who and when in the title", () => {
      render(
        <StudioHeader
          {...makeProps({
            reviewStatus: reviewStatus({ state: "approved", reviewerName: "Sara", at: new Date().toISOString() }),
          })}
        />,
      );
      expect(screen.getByText("Approved")).toBeTruthy();
      expect(screen.getByTestId("topbar-review-pill").getAttribute("title")).toMatch(/^Approved by Sara · /);
    });

    it("changes requested carries the open count", () => {
      render(
        <StudioHeader
          {...makeProps({ reviewStatus: reviewStatus({ state: "changes-requested", reviewerName: "Sara" }), openCommentCount: 2 })}
        />,
      );
      expect(screen.getByText("Changes requested · 2")).toBeTruthy();
    });

    it("no count is a verb alone, never '· 0'", () => {
      render(
        <StudioHeader
          {...makeProps({ reviewStatus: reviewStatus({ state: "changes-requested", reviewerName: "Sara" }), openCommentCount: 0 })}
        />,
      );
      expect(screen.getByText("Changes requested")).toBeTruthy();
    });

    it("edited since approval says so", () => {
      render(<StudioHeader {...makeProps({ reviewStatus: reviewStatus({ state: "approved-edited-since" }) })} />);
      expect(screen.getByText("Approved · edited since")).toBeTruthy();
    });

    it("'Not sent' only where a send is the site's next act (an approval workspace)", () => {
      render(<StudioHeader {...makeProps({ reviewStatus: reviewStatus({ state: "none", editsRequireApproval: true }) })} />);
      expect(screen.getByText("Not sent")).toBeTruthy();
    });

    it("no round: the Review door is still there, and opens the Review panel (board 4418:123573)", () => {
      const onOpenReview = vi.fn();
      render(<StudioHeader {...makeProps({ onOpenReview, reviewStatus: reviewStatus({ state: "none", editsRequireApproval: false }) })} />);
      const door = screen.getByTestId("topbar-review-pill");
      expect(screen.getByTestId("topbar-review-label").textContent).toBe("Review");
      expect(screen.getByTestId("topbar-review-chevron").textContent).toBe("›");
      fireEvent.click(door);
      expect(onOpenReview).toHaveBeenCalledTimes(1);
    });
  });

  /* Rewritten 2026-08-23. These asserted that view mode REPLACED Publish with
     "Send for review" — true until view mode became a view rather than an
     invited-editor mode (founder call). The compose form still exists and is
     still covered; it moved to the Review panel, which is where inviting a
     client belongs. What view mode owes now is that none of it is here. */
  describe("view mode shows no owner controls at all", () => {
    beforeEach(() => setViewMode({ readOnlyView: true }));

    it("has no Publish button", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.queryByRole("button", { name: /^Publish/ })).toBeNull();
    });

    it("has no Send for review — inviting a client is the owner's act", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.queryByRole("button", { name: "Send for review" })).toBeNull();
    });

    it("keeps Publish and the site menu in the ordinary editor", () => {
      setViewMode({ readOnlyView: false });
      render(<StudioHeader {...makeProps()} />);
      expect(screen.getByRole("button", { name: /^Publish/ })).toBeTruthy();
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
      onExportHTML: vi.fn(),
      onOpenShortcuts: vi.fn(),
      onOpenIssues: vi.fn(),
    };

    // Topbar redesign §3 (D8/D9, eng D8) — five named groups, no "More" dump,
    // no Exit row, "Enter view mode" naming.
    /* Board 4418:126034 (C5 G1-016): the rows and groups are the board's;
       SiteMenu.board.test pins the full list. Here: the container wires the
       doors it owns. */
    it("wires the board's rows the header owns", () => {
      render(<StudioHeader {...makeProps(menuProps)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      const labels = screen.getAllByRole("menuitem").map((i) => i.textContent);
      expect(labels).toEqual([
        "Site settingsCtrl ,",
        "Export site…",
        "Issues",
        "Enter view mode",
        "Keyboard shortcutsCtrl /",
        "Start collaborationPlanned",
        "Invite teammates ↗",
        "Account settings ↗",
      ]);
      expect(screen.getByText("This site")).toBeTruthy();
      expect(screen.getByText("Leaves the editor")).toBeTruthy();
      // D8: Exit lives ONLY on the bar's ‹ Exit — no menu duplicate.
      expect(screen.queryByRole("menuitem", { name: /^Exit/ })).toBeNull();
    });

    it.each(["Enter view mode", "Invite teammates", "Account settings"])(
      "keeps %s reachable in the menu",
      (label) => {
        render(<StudioHeader {...makeProps(menuProps)} />);
        fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
        expect(screen.getByRole("menuitem", { name: new RegExp(`^${label}`) })).toBeTruthy();
      },
    );

    it("Quick preview in the bar emits the shell's toggle — one preview owner", async () => {
      /* The bar used to build the HTML itself, which meant the onboarding
         preview step never ticked on the most common path. It emits
         UI_TOGGLE_PREVIEW now; the shell's handler builds and sanitizes. */
      const emit = vi.fn();
      const composer = {
        on: vi.fn(), off: vi.fn(), emit,
        getProjectMetadata: vi.fn(() => ({ name: "Acme" })),
      } as unknown as StudioHeaderProps["composer"];
      render(<StudioHeader {...makeProps({ ...menuProps, composer })} />);
      fireEvent.click(screen.getByTestId("topbar-preview"));
      // F7-B2: the emit runs a tick later so the loading state can paint.
      await waitFor(() => expect(emit).toHaveBeenCalledWith("ui:toggle:preview", {}));
    });

    it("the bar's Comments toggle emits the command and mirrors the state event", () => {
      const handlers = new Map<string, Set<(p?: unknown) => void>>();
      const emit = vi.fn((ev: string, p?: unknown) => {
        handlers.get(ev)?.forEach((fn) => fn(p));
      });
      const composer = {
        on: vi.fn((ev: string, fn: (p?: unknown) => void) => {
          if (!handlers.has(ev)) handlers.set(ev, new Set());
          handlers.get(ev)!.add(fn);
        }),
        off: vi.fn((ev: string, fn: (p?: unknown) => void) => handlers.get(ev)?.delete(fn)),
        emit,
        getProjectMetadata: vi.fn(() => ({ name: "x" })),
        exportHTML: vi.fn(() => ({ combined: "" })),
      } as unknown as StudioHeaderProps["composer"];
      render(<StudioHeader {...makeProps({ composer })} />);
      const btn = screen.getByRole("button", { name: "Comments" });
      expect(btn.getAttribute("aria-pressed")).toBe("false");
      fireEvent.click(btn);
      expect(emit).toHaveBeenCalledWith("ui:comment-mode", {});
      // T6: pressed state follows the layer's broadcast, not the click.
      act(() => emit("ui:comment-mode-changed", { on: true }));
      expect(screen.getByRole("button", { name: "Comments" }).getAttribute("aria-pressed")).toBe("true");
      act(() => emit("ui:comment-mode-changed", { on: false }));
      expect(screen.getByRole("button", { name: "Comments" }).getAttribute("aria-pressed")).toBe("false");
    });

    it("no composer, no Comments toggle — nothing to toggle", () => {
      render(<StudioHeader {...makeProps()} />);
      expect(screen.queryByRole("button", { name: "Comments" })).toBeNull();
    });

    it("offers the live URL only once the site has one", () => {
      render(<StudioHeader {...makeProps()} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.queryByRole("menuitem", { name: /View live site/ })).toBeNull();
      cleanup();

      render(<StudioHeader {...makeProps({ publishedUrl: "https://x.vercel.app" })} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByRole("menuitem", { name: "View live site ↗" })).toBeTruthy();
      // Off board 4418:126034 but kept (owner rule: never silently remove a capability).
      expect(screen.getByRole("menuitem", { name: "Copy live URL" })).toBeTruthy();
    });

    /* SH-A-11: Unpublish is ADMIN on the server (sites.ts:425) and the row was
       offered to every role, so a VIEWER or EDITOR could open it and collect a
       403. PublishHistory.tsx:104 already gated rollback this way. The null
       case is the house rule — an unknown role still asks the server. */
    it("offers Unpublish to an ADMIN, withholds it from lesser roles", () => {
      const live = { publishedUrl: "https://x.vercel.app" };

      roleState.role = "ADMIN";
      render(<StudioHeader {...makeProps(live)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByRole("menuitem", { name: /Unpublish/ })).toBeTruthy();
      cleanup();

      for (const role of ["EDITOR", "VIEWER"]) {
        roleState.role = role;
        render(<StudioHeader {...makeProps(live)} />);
        fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
        expect(screen.queryByRole("menuitem", { name: /Unpublish/ })).toBeNull();
        cleanup();
      }

      // Unknown role: let the server decide rather than hiding a real control.
      roleState.role = null;
      render(<StudioHeader {...makeProps(live)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByRole("menuitem", { name: /Unpublish/ })).toBeTruthy();
    });

    it("fires a handler and closes", () => {
      const onOpenProjectSettings = vi.fn();
      render(<StudioHeader {...makeProps({ onOpenProjectSettings })} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      fireEvent.click(screen.getByRole("menuitem", { name: /Site settings/ }));
      expect(onOpenProjectSettings).toHaveBeenCalled();
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

// ── F1 · dirty-exit guard (plan 2026-07-29, decisions 1A/2A/5A) ─────────────
describe("F1 dirty-exit guard", () => {
  function exitBtn() {
    return screen.getByRole("button", { name: "‹ Exit" });
  }

  // jsdom's window.location is non-configurable — replace the whole object.
  const realLocation = window.location;
  function stubLocation() {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...realLocation, assign, href: realLocation.href },
    });
    return assign;
  }
  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: realLocation,
    });
  });

  it("clean state: Exit navigates without a dialog", () => {
    const assign = stubLocation();
    render(<StudioHeader {...makeProps()} />);
    fireEvent.click(exitBtn());
    expect(assign).toHaveBeenCalled();
    expect(screen.queryByText("Leave the editor?")).toBeNull();
  });

  it("dirty: Exit opens dialog A with Save & leave, Leave anyway, Stay", () => {
    const assign = stubLocation();
    render(<StudioHeader {...makeProps({ isDirty: true })} />);
    fireEvent.click(exitBtn());
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByText("Leave with unsaved changes?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save & leave" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Leave anyway" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stay" })).toBeTruthy();
  });

  it("Save & leave: saved outcome navigates; dialog closes", async () => {
    const assign = stubLocation();
    const onSave = vi.fn(async () => "saved" as const);
    render(<StudioHeader {...makeProps({ isDirty: true, onSave })} />);
    fireEvent.click(exitBtn());
    fireEvent.click(screen.getByRole("button", { name: "Save & leave" }));
    await waitFor(() => expect(assign).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalled();
  });

  it("Save & leave: queued-offline outcome switches to the risky dialog, no navigation", async () => {
    const assign = stubLocation();
    const onSave = vi.fn(async () => "queued-offline" as const);
    render(<StudioHeader {...makeProps({ isDirty: true, onSave })} />);
    fireEvent.click(exitBtn());
    fireEvent.click(screen.getByRole("button", { name: "Save & leave" }));
    await waitFor(() =>
      expect(screen.getByText(/leaving loses this work/)).toBeTruthy(),
    );
    expect(assign).not.toHaveBeenCalled();
    // risky dialog never offers a fake save
    expect(screen.queryByRole("button", { name: "Save & leave" })).toBeNull();
  });

  it("Save & leave: error outcome keeps the dialog open with the error", async () => {
    const assign = stubLocation();
    const onSave = vi.fn(async () => "error" as const);
    render(<StudioHeader {...makeProps({ isDirty: true, onSave })} />);
    fireEvent.click(exitBtn());
    fireEvent.click(screen.getByRole("button", { name: "Save & leave" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toMatch(/Save failed/));
    expect(assign).not.toHaveBeenCalled();
  });

  it("offline + dirty: Exit goes straight to the risky dialog (5A — never fake-save)", () => {
    render(<StudioHeader {...makeProps({ isDirty: true, isOffline: true })} />);
    fireEvent.click(exitBtn());
    expect(screen.getByText(/leaving loses this work/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save & leave" })).toBeNull();
  });

  it("Leave anyway navigates and Stay closes without navigating", () => {
    const assign = stubLocation();
    const { unmount } = render(<StudioHeader {...makeProps({ isDirty: true })} />);
    fireEvent.click(exitBtn());
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(screen.queryByText("Leave the editor?")).toBeNull();
    expect(assign).not.toHaveBeenCalled();
    fireEvent.click(exitBtn());
    fireEvent.click(screen.getByRole("button", { name: "Leave anyway" }));
    expect(assign).toHaveBeenCalled();
    unmount();
  });

  /* Asserts what the guard DOES, not when it is mounted. The listener is now
     registered unconditionally and decides at fire time, because the stranded-
     mirror count changes from `window` callbacks with no render in between —
     a listener gated on React state would be absent exactly when it mattered.
     The old version of this test asserted zero listeners on a clean header,
     which locked in that gating. */
  function fireBeforeUnload(): { prevented: boolean } {
    const spy = vi.spyOn(window, "addEventListener");
    const { unmount } = render(<StudioHeader {...lastProps} />);
    const handler = spy.mock.calls.filter(([t]) => t === "beforeunload").pop()?.[1] as (
      e: Partial<BeforeUnloadEvent>,
    ) => void;
    const e = { preventDefault: vi.fn(), returnValue: undefined as unknown };
    handler(e as unknown as BeforeUnloadEvent);
    spy.mockRestore();
    unmount();
    return { prevented: (e.preventDefault as ReturnType<typeof vi.fn>).mock.calls.length > 0 };
  }
  let lastProps = makeProps();

  it("beforeunload stays silent when nothing would be stranded", () => {
    strandedMirrors = 0;
    lastProps = makeProps();
    expect(fireBeforeUnload().prevented).toBe(false);
  });

  it("beforeunload prompts while the project is dirty", () => {
    strandedMirrors = 0;
    lastProps = makeProps({ isDirty: true });
    expect(fireBeforeUnload().prevented).toBe(true);
  });

  /* The defect this covers: CMS / component / template / version mirrors queue
     in `SyncRetryQueue`, which never touches the project save — so with a clean
     project the guard saw nothing and the tab closed silently, ending an
     in-memory queue of closures. */
  it("beforeunload prompts on a CLEAN project when mirrors are stranded", () => {
    strandedMirrors = 3;
    lastProps = makeProps();
    expect(fireBeforeUnload().prevented).toBe(true);
    strandedMirrors = 0;
  });
});

describe("exit dialog — stranded mirrors", () => {
  const realLocation = window.location;
  function stubLocation() {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: { ...realLocation, assign, href: realLocation.href },
    });
    return assign;
  }
  afterEach(() => {
    strandedMirrors = 0;
    Object.defineProperty(window, "location", {
      configurable: true,
      writable: true,
      value: realLocation,
    });
  });

  /* The defect: mirrors queue in `SyncRetryQueue`, which never touches the
     project save, so a clean project walked straight out and the in-memory
     queue died with the page. */
  it("names what is actually lost, and does not claim the work is gone", () => {
    strandedMirrors = 2;
    const assign = stubLocation();
    render(<StudioHeader {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "‹ Exit" }));
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByText("Some changes are only on this device")).toBeTruthy();
    const body = screen.getByText(/reached the server/).textContent ?? "";
    expect(body).toMatch(/2 changes/);
    expect(body).toMatch(/stay on this device/);
    /* Not "your other sites won't see them": the count also covers CMS entries
       and saved versions, which are site-scoped and would never show on another
       site even after a perfect sync. */
    expect(body).not.toMatch(/other sites/);
    /* Not "lose changes" — the local copy survives; the retry queue does not. */
    expect(screen.getByRole("button", { name: "Leave anyway" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Leave and lose changes" })).toBeNull();
  });

  it("says 'change' and 'hasn't' for exactly one", () => {
    strandedMirrors = 1;
    stubLocation();
    render(<StudioHeader {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "‹ Exit" }));
    expect(screen.getByText(/hasn't reached the server/).textContent).toMatch(/1 change /);
  });

  it("a clean project with an empty queue exits without a dialog", () => {
    strandedMirrors = 0;
    const assign = stubLocation();
    render(<StudioHeader {...makeProps()} />);
    fireEvent.click(screen.getByRole("button", { name: "‹ Exit" }));
    expect(screen.queryByText("Some changes are only on this device")).toBeNull();
    expect(assign).toHaveBeenCalled();
  });
});

// ── F3 · review pill is a door ──────────────────────────────────────────────
describe("F3 review pill", () => {
  it("renders the pill as a button and clicking opens the review panel", async () => {
    const onOpenReview = vi.fn();
    render(
      <StudioHeader
        {...makeProps({ onOpenReview, reviewStatus: reviewStatus({ state: "pending", at: new Date().toISOString() }) })}
      />,
    );
    const pill = await screen.findByRole("button", { name: "Waiting" });
    fireEvent.click(pill);
    expect(onOpenReview).toHaveBeenCalled();
  });

  it("59-minute-old approval reads in minutes, not 'just now' (U1) — in the chip's title", async () => {
    const at = new Date(Date.now() - 59 * 60_000).toISOString();
    render(
      <StudioHeader {...makeProps({ reviewStatus: reviewStatus({ state: "approved", reviewerName: "Sara", at }) })} />,
    );
    const title = (await screen.findByTestId("topbar-review-pill")).getAttribute("title") ?? "";
    expect(title).toMatch(/59m ago/);
    expect(title).not.toMatch(/just now/);
  });
});

// ── T8/D7 · status grammar ──────────────────────────────────────────────────
describe("T8 status grammar", () => {
  /**
   * The tone lives on the pill root, the label's direct parent (ReviewBadge
   * renders exactly `<span/button className={pillClasses}><span>{label}</span></span>`).
   * Checks the applied tone utility, not a deleted modifier class — "info"
   * and "success" render byte-identical classes by design (T8/D7 rule 3), so
   * this can only distinguish warning from not-warning, same as the visual
   * result always could.
   */
  const toneOf = (labelEl: HTMLElement) => labelEl.parentElement!.className;
  /* #26: the warning tone is the status token, not a Tailwind literal. */
  const isWarningTone = (labelEl: HTMLElement) => toneOf(labelEl).includes("tw:bg-[var(--bk-warning-tint)]");

  const changesRequested = () =>
    reviewStatus({ state: "changes-requested", reviewerName: "Sara", at: new Date().toISOString() });

  it("a blocking review keeps the warning tone when it is the only amber", async () => {
    render(<StudioHeader {...makeProps({ reviewStatus: changesRequested() })} />);
    const label = await screen.findByText("Changes requested");
    expect(isWarningTone(label)).toBe(true);
  });

  // T8 compact tier 3: two faces then "+N", so a crowded room cannot push the
  // publish action off the bar.
  it("presence shows two avatars and counts the rest", () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    collab.current = {
      users: [
        { id: "u1", name: "Sara" },
        { id: "u2", name: "Bilal" },
        { id: "u3", name: "Hina" },
        { id: "u4", name: "Omar" },
      ],
      currentUser: { id: "u1", name: "Sara" },
      state: "connected",
      isConnected: true,
    };
    render(<StudioHeader {...makeProps()} />);
    // Each Avatar carries role="img" + aria-label — count those (icons in the
    // rest of the bar are aria-hidden, so this can't over-count).
    expect(within(screen.getByRole("banner")).getAllByRole("img")).toHaveLength(2);
    expect(screen.getByLabelText("2 more")).toBeTruthy();
  });

  /* C5 G1-011 / CI-84: a session that DROPPED says "Offline" (the copy
     existed in Presence; the header mapped `disconnected` to nothing). A
     session never joined — or deliberately left — shows no pill. */
  it("a dropped session shows the Offline pill; no session shows none", () => {
    vi.mocked(isFeatureEnabled).mockReturnValue(true);
    collab.current = { ...COLLAB_IDLE, users: [{ id: "u1", name: "Sara" }], currentUser: { id: "u1", name: "Sara" }, room: { id: "room-1" } } as never;
    render(<StudioHeader {...makeProps()} />);
    expect(within(screen.getByRole("banner")).getByText("Offline")).toBeTruthy();
    cleanup();
    collab.current = { ...COLLAB_IDLE, room: null } as never;
    render(<StudioHeader {...makeProps()} />);
    expect(within(screen.getByRole("banner")).queryByText("Offline")).toBeNull();
  });

  /* D7 rule 6 demoted the review chip beside an amber save AND an amber
     Issues chip. C3 took the Issues chip off the bar, so there is no second
     amber for it to step back from. */
  it("keeps the warning tone beside an unsaved save — no Issues chip competes (C3)", async () => {
    render(
      <StudioHeader
        {...makeProps({
          reviewStatus: changesRequested(),
          isDirty: true,
          issues: [{ id: "i1", type: "warning", message: "Missing alt text" }],
        })}
      />,
    );
    const label = await screen.findByText("Changes requested");
    expect(isWarningTone(label)).toBe(true);
  });
});

// ── brand's unsaved work reaches the chip ───────────────────────────────────
describe("the save chip counts brand's staged edits, not only the project's", () => {
  /* A token mid-edit left this reading "Saved · just now" with a green dot
     while the Brand panel's own footer said "Unsaved brand changes". Same
     concept, two surfacings, and the global one is the one a user watches.
     Brand stages in a provider this header sits outside, so it announces. */
  function brandComposer() {
    const handlers = new Map<string, Set<(p?: unknown) => void>>();
    return {
      on: vi.fn((ev: string, fn: (p?: unknown) => void) => {
        if (!handlers.has(ev)) handlers.set(ev, new Set());
        handlers.get(ev)!.add(fn);
      }),
      off: vi.fn((ev: string, fn: (p?: unknown) => void) => {
        handlers.get(ev)?.delete(fn);
      }),
      emit: (ev: string, payload?: unknown) => {
        handlers.get(ev)?.forEach((fn) => fn(payload));
      },
      getProjectMetadata: vi.fn(() => ({ name: "Acme" })),
    };
  }

  it("reads unsaved once brand announces staged edits, with the project clean", () => {
    const composer = brandComposer();
    render(
      <StudioHeader
        {...makeProps({
          composer: composer as unknown as StudioHeaderProps["composer"],
          isDirty: false,
        })}
      />,
    );
    expect(screen.queryByText("Unsaved changes")).toBeNull();
    act(() => composer.emit("brand:dirty-changed", { dirty: true }));
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
  });

  it("goes back to saved when brand's edits are applied or discarded", () => {
    const composer = brandComposer();
    render(
      <StudioHeader
        {...makeProps({
          composer: composer as unknown as StudioHeaderProps["composer"],
          isDirty: false,
        })}
      />,
    );
    act(() => composer.emit("brand:dirty-changed", { dirty: true }));
    act(() => composer.emit("brand:dirty-changed", { dirty: false }));
    expect(screen.queryByText("Unsaved changes")).toBeNull();
  });
});

// ── F7 · perf pair ──────────────────────────────────────────────────────────
describe("F7 perf pair", () => {
  function makeComposer(meta: { name: string }) {
    const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
    return {
      on: vi.fn((ev: string, fn: (...args: unknown[]) => void) => {
        if (!handlers.has(ev)) handlers.set(ev, new Set());
        handlers.get(ev)!.add(fn);
      }),
      off: vi.fn((ev: string, fn: (...args: unknown[]) => void) => {
        handlers.get(ev)?.delete(fn);
      }),
      emit: (ev: string) => {
        handlers.get(ev)?.forEach((fn) => fn());
      },
      getProjectMetadata: vi.fn(() => meta),
      exportHTML: vi.fn(() => ({ combined: "<html><body>x</body></html>" })),
    };
  }
  type FakeComposer = ReturnType<typeof makeComposer>;
  const asComposer = (c: FakeComposer) => c as unknown as StudioHeaderProps["composer"];

  it("subscribes to the composer once, not once per canvas selection", () => {
    const composer = makeComposer({ name: "Acme" });
    const { rerender } = render(<StudioHeader {...makeProps({ composer: asComposer(composer) })} />);
    const callsAfterMount = composer.on.mock.calls.length;
    for (const id of ["a", "b", "c"]) {
      rerender(
        <StudioHeader
          {...makeProps({ composer: asComposer(composer), selectedElement: { id, type: "text" } })}
        />,
      );
    }
    expect(composer.on.mock.calls.length).toBe(callsAfterMount);
    expect(composer.off).not.toHaveBeenCalled();
  });

  it("a rename reaches the bar via PROJECT_METADATA_CHANGED", async () => {
    const meta = { name: "Before" };
    const composer = makeComposer(meta);
    render(<StudioHeader {...makeProps({ composer: asComposer(composer) })} />);
    expect(screen.getByText("Before")).toBeTruthy();
    meta.name = "After";
    act(() => composer.emit("project:metadata-changed"));
    expect(screen.getByText("After")).toBeTruthy();
  });

  it("the preview loading state paints before the toggle emit blocks the thread", () => {
    vi.useFakeTimers();
    try {
      const composer = makeComposer({ name: "Acme" });
      const emitSpy = vi.spyOn(composer, "emit");
      const onSetPreviewLoading = vi.fn();
      render(
        <StudioHeader
          {...makeProps({ composer: asComposer(composer), onSetPreviewLoading })}
        />,
      );
      fireEvent.click(screen.getByTestId("topbar-preview"));
      expect(onSetPreviewLoading).toHaveBeenCalledWith(true);
      expect(emitSpy).not.toHaveBeenCalledWith("ui:toggle:preview", {});
      act(() => {
        vi.runAllTimers();
      });
      expect(emitSpy).toHaveBeenCalledWith("ui:toggle:preview", {});
      expect(onSetPreviewLoading).toHaveBeenLastCalledWith(false);
    } finally {
      vi.useRealTimers();
    }
  });
});

// ── F9 · a11y pass ──────────────────────────────────────────────────────────
describe("F9 a11y", () => {
  it("the site-menu trigger announces itself as a menu button", () => {
    render(<StudioHeader {...makeProps()} />);
    expect(screen.getByRole("button", { name: "Site menu" }).getAttribute("aria-haspopup")).toBe("menu");
  });

  it("focus moves into the notification panel on open and returns to the bell on close", async () => {
    render(<StudioHeader {...makeProps()} />);
    const bell = screen.getByRole("button", { name: "Notifications" });
    bell.focus();
    fireEvent.click(bell);
    const panel = await screen.findByRole("dialog", { name: "Notifications" });
    expect(document.activeElement).toBe(panel);
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Notifications" })).toBeNull());
    expect(document.activeElement).toBe(bell);
  });

  it("⌘K is a no-op while a modal dialog owns the keyboard", () => {
    render(<StudioHeader {...makeProps({ isDirty: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "‹ Exit" }));
    expect(screen.getByText("Leave with unsaved changes?")).toBeTruthy();
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(screen.queryByTestId("command-palette")).toBeNull();
  });
});
