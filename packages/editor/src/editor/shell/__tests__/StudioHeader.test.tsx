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
    density: "full",
    clientView: false,
  })),
}));

vi.mock("../../../services/ReviewService", () => ({
  submitForReview: vi.fn(() => Promise.resolve()),
  fetchReviewStatus: vi.fn(() => Promise.resolve({ state: "none", reviewerName: null, at: null })),
  fetchReviewStatusOrNull: vi.fn(() => Promise.resolve(null)),
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
    onSave: vi.fn(async () => "saved" as const),
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
    collab.current = { ...COLLAB_IDLE };
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

    // Topbar redesign D6/D14: the IssueChip is a permanent bar anchor with the
    // honest total+breakdown copy (the old errors-noun label mislabelled
    // 1 error + 2 warnings as "3 errors" — regression-critical).
    it("carries the IssueChip with total count and severity breakdown", () => {
      render(
        <StudioHeader
          {...makeProps({
            onOpenIssues: vi.fn(),
            issues: [
              { id: "1", type: "error", message: "x" },
              { id: "2", type: "warning", message: "y" },
              { id: "3", type: "warning", message: "z" },
            ] as StudioHeaderProps["issues"],
          })}
        />,
      );
      const chip = screen.getByRole("button", { name: "3 issues, 1 error" });
      expect(chip.textContent).toBe("3");
    });

    it("the chip stays visible at zero issues — the all-clear anchor (D6)", () => {
      render(<StudioHeader {...makeProps({ onOpenIssues: vi.fn(), issues: [] })} />);
      expect(screen.getByRole("button", { name: "No issues" })).toBeTruthy();
    });

    it("viewers get the chip with the fix door labelled shut", () => {
      roleState.role = "VIEWER";
      render(
        <StudioHeader
          {...makeProps({
            onOpenIssues: vi.fn(),
            issues: [{ id: "1", type: "warning", message: "x" }] as StudioHeaderProps["issues"],
          })}
        />,
      );
      expect(
        screen.getByRole("button", { name: /1 issue, 1 warning — ask an editor to fix these/ }),
      ).toBeTruthy();
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

    it("dirty work can be saved from the pill", () => {
      const onSave = vi.fn();
      save({ isDirty: true, onSave });
      fireEvent.click(screen.getByRole("button", { name: /Unsaved changes/ }));
      expect(onSave).toHaveBeenCalled();
    });

    it("a settled state is a status, not a button that does nothing", () => {
      // Asserted on the pill itself: since eng D5 the only role=status in the
      // tree is the header's announcement region, so querying by role here
      // would pass no matter what SaveStatus rendered. `getByText("Saved")`
      // resolves to the pill's own root element — RTL matches on a node's
      // direct text, excluding its nested dot/stamp elements' contribution.
      save({ lastSavedAt: Date.now() });
      expect(screen.getByText("Saved").tagName).toBe("SPAN");
      expect(screen.queryByRole("button", { name: /Saved/ })).toBeNull();
    });

    it("clean and saved", () => {
      save({ lastSavedAt: Date.now() });
      expect(screen.getByText("Saved").textContent).toBe("Saved · just now");
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
      expect(screen.getByRole("tooltip").textContent).toBe("Can't publish while offline");
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

  // ── T4 publish-anyway confirm (plan §5, D12/D13, eng D9) ──────────────────
  describe("publish-anyway confirm modal", () => {
    const err = (id: string, message: string) => ({ id, type: "error" as const, message });
    const warn = (id: string, message: string) => ({ id, type: "warning" as const, message });
    const setup = (issues: unknown[], extra: Partial<StudioHeaderProps> = {}) => {
      vi.mocked(isFeatureEnabled).mockReturnValue(true);
      const onVercelPublish = vi.fn();
      const onOpenIssues = vi.fn();
      render(
        <StudioHeader
          {...makeProps({
            onVercelPublish,
            onOpenIssues,
            issues: issues as StudioHeaderProps["issues"],
            ...extra,
          })}
        />,
      );
      return { onVercelPublish, onOpenIssues };
    };

    it("errors > 0 opens the confirm instead of publishing in one click", () => {
      const { onVercelPublish } = setup([err("1", "Broken link — Home / CTA")]);
      fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
      expect(onVercelPublish).not.toHaveBeenCalled();
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(screen.getByText("Publish with 1 error?")).toBeTruthy();
      expect(screen.getByText("Broken link — Home / CTA")).toBeTruthy();
    });

    it("warnings alone publish directly — the chip already carried the signal", () => {
      const { onVercelPublish } = setup([warn("1", "Missing alt")]);
      fireEvent.click(screen.getByRole("button", { name: "Publish" }));
      expect(onVercelPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("shows at most three rows, errors first, and +N more opens the panel", () => {
      const { onOpenIssues } = setup([
        warn("w1", "warn one"),
        err("e1", "error one"),
        warn("w2", "warn two"),
        warn("w3", "warn three"),
        err("e2", "error two"),
      ]);
      fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
      expect(screen.getByText("error one")).toBeTruthy();
      expect(screen.getByText("error two")).toBeTruthy();
      expect(screen.getByText("warn one")).toBeTruthy();
      expect(screen.queryByText("warn three")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "+2 more warnings" }));
      expect(onOpenIssues).toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("an open review round adds the D13 note", async () => {
      vi.mocked(fetchReviewStatus).mockResolvedValueOnce({
        state: "pending",
        reviewerName: "Sana",
        at: null,
      });
      setup([err("1", "x")]);
      await screen.findByText("In review");
      fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
      expect(screen.getByText(/A review round is open — Sana will see the published site/)).toBeTruthy();
    });

    it("no review round, no note", () => {
      setup([err("1", "x")]);
      fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
      expect(screen.queryByText(/review round is open/)).toBeNull();
    });

    /* Board 1168:4732 names the door by what it does: "Fix issues first". */
    it("'Fix issues first' is the safe door — panel opens, nothing publishes", () => {
      const { onVercelPublish, onOpenIssues } = setup([err("1", "x")]);
      fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
      fireEvent.click(screen.getByRole("button", { name: "Fix issues first" }));
      expect(onOpenIssues).toHaveBeenCalled();
      expect(onVercelPublish).not.toHaveBeenCalled();
    });

    it("confirming publishes", () => {
      const { onVercelPublish } = setup([err("1", "x")]);
      fireEvent.click(screen.getByRole("button", { name: "Publish anyway" }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Publish anyway" }));
      expect(onVercelPublish).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).toBeNull();
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

    it("a viewer in client view cannot send for review either", () => {
      setViewMode({ clientView: true });
      roleState.role = "VIEWER";
      render(<StudioHeader {...makeProps()} />);
      const btn = screen.getByRole("button", { name: "Send for review" });
      expect(btn.getAttribute("aria-disabled")).toBe("true");
      fireEvent.focus(btn);
      expect(screen.getByRole("tooltip").textContent).toMatch(/ask an editor/);
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

    // Topbar redesign §3 (D8/D9, eng D8) — five named groups, no "More" dump,
    // no Exit row, "Open client view" naming.
    it("opens with the regrouped items in plan order", () => {
      render(<StudioHeader {...makeProps(menuProps)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      const labels = screen.getAllByRole("menuitem").map((i) => i.textContent);
      expect(labels).toEqual([
        // F6/T9: jsdom's navigator.platform is not macOS, so both hints show the
        // chord that actually works there (the handler takes ctrl OR meta).
        "Site settingsCtrl ,",
        "Version historyCtrl H",
        "Publish history",
        "Export code",
        "Templates",
        "Components⇧A",
        "Open client view",
        "Invite teammates",
        "Account settings",
        "Keyboard shortcuts?",
      ]);
    });

    it("groups carry their plan names — the 'More' dump is gone (regression D8)", () => {
      render(<StudioHeader {...makeProps(menuProps)} />);
      fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
      expect(screen.getByText("Site")).toBeTruthy();
      expect(screen.getByText("Build")).toBeTruthy();
      expect(screen.getByText("Share")).toBeTruthy();
      expect(screen.getByText("Workspace")).toBeTruthy();
      expect(screen.queryByText("More")).toBeNull();
      // D8: Exit lives ONLY on the bar's ‹ Exit — no menu duplicate.
      expect(screen.queryByRole("menuitem", { name: /Exit/ })).toBeNull();
    });

    it.each(["Open client view", "Invite teammates", "Account settings"])(
      "keeps %s reachable in the menu",
      (label) => {
        render(<StudioHeader {...makeProps(menuProps)} />);
        fireEvent.click(screen.getByRole("button", { name: "Site menu" }));
        expect(screen.getByRole("menuitem", { name: new RegExp(`^${label}`) })).toBeTruthy();
      },
    );

    it("Quick preview in the bar opens the shell overlay — ⌘P is a different feature", async () => {
      const onInlinePreview = vi.fn();
      render(<StudioHeader {...makeProps({ ...menuProps, onInlinePreview })} />);
      fireEvent.click(screen.getByRole("button", { name: "Quick preview" }));
      // F7-B2: the export runs a tick later so the loading state can paint.
      await waitFor(() => expect(onInlinePreview).toHaveBeenCalledTimes(1));
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
    expect(screen.getByText("Leave the editor?")).toBeTruthy();
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
      expect(screen.getByText(/unsaved edits will be lost/)).toBeTruthy(),
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
    expect(screen.getByText(/unsaved edits will be lost/)).toBeTruthy();
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

  it("beforeunload guard registers only while dirty/saving and honors the bypass", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const { rerender } = render(<StudioHeader {...makeProps()} />);
    expect(addSpy.mock.calls.filter(([t]) => t === "beforeunload")).toHaveLength(0);
    rerender(<StudioHeader {...makeProps({ isDirty: true })} />);
    expect(addSpy.mock.calls.filter(([t]) => t === "beforeunload")).toHaveLength(1);
    const handler = addSpy.mock.calls.find(([t]) => t === "beforeunload")?.[1] as (
      e: Partial<BeforeUnloadEvent>,
    ) => void;
    const e = { preventDefault: vi.fn(), returnValue: undefined as unknown };
    handler(e as unknown as BeforeUnloadEvent);
    expect(e.preventDefault).toHaveBeenCalled();
    addSpy.mockRestore();
  });
});

// ── F3 · review pill is a door ──────────────────────────────────────────────
describe("F3 review pill", () => {
  it("renders the pill as a button and clicking opens the review panel", async () => {
    vi.mocked(fetchReviewStatus).mockResolvedValue({
      state: "pending",
      reviewerName: null,
      at: new Date().toISOString(),
    });
    const onOpenReview = vi.fn();
    render(<StudioHeader {...makeProps({ onOpenReview })} />);
    const pill = await screen.findByRole("button", { name: "In review" });
    fireEvent.click(pill);
    expect(onOpenReview).toHaveBeenCalled();
  });

  it("59-minute-old approval reads in minutes, not 'just now' (U1)", async () => {
    const at = new Date(Date.now() - 59 * 60_000).toISOString();
    vi.mocked(fetchReviewStatus).mockResolvedValue({
      state: "approved",
      reviewerName: "Sara",
      at,
    });
    render(<StudioHeader {...makeProps()} />);
    const pill = await screen.findByText(/Approved by Sara/);
    expect(pill.textContent).toMatch(/59m ago/);
    expect(pill.textContent).not.toMatch(/just now/);
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
  const isWarningTone = (labelEl: HTMLElement) => toneOf(labelEl).includes("tw:bg-yellow-50");

  it("a blocking review keeps the warning tone when it is the only amber", async () => {
    vi.mocked(fetchReviewStatus).mockResolvedValue({
      state: "changes-requested",
      reviewerName: "Sara",
      at: new Date().toISOString(),
    });
    render(<StudioHeader {...makeProps()} />);
    const label = await screen.findByText("Changes requested");
    expect(isWarningTone(label)).toBe(true);
  });

  it("D7 rule 6: with an amber save AND amber issues, the review pill steps back", async () => {
    vi.mocked(fetchReviewStatus).mockResolvedValue({
      state: "changes-requested",
      reviewerName: "Sara",
      at: new Date().toISOString(),
    });
    render(
      <StudioHeader
        {...makeProps({
          isDirty: true, // save → unsaved (amber)
          issues: [{ id: "i1", type: "warning", message: "Missing alt text" }],
        })}
      />,
    );
    const label = await screen.findByText("Changes requested");
    // Demoted, not hidden — the copy is unchanged, only the shouting stops.
    expect(toneOf(label)).toContain("tw:bg-gray-100");
    expect(isWarningTone(label)).toBe(false);
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

  it("errors do not spend the amber budget — an error chip is red, not amber", async () => {
    vi.mocked(fetchReviewStatus).mockResolvedValue({
      state: "changes-requested",
      reviewerName: "Sara",
      at: new Date().toISOString(),
    });
    render(
      <StudioHeader
        {...makeProps({
          isDirty: true,
          issues: [{ id: "i1", type: "error", message: "Broken link" }],
        })}
      />,
    );
    const label = await screen.findByText("Changes requested");
    expect(isWarningTone(label)).toBe(true);
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

  it("the preview loading state paints before the export blocks the thread", () => {
    vi.useFakeTimers();
    try {
      const composer = makeComposer({ name: "Acme" });
      const onSetPreviewLoading = vi.fn();
      const onInlinePreview = vi.fn();
      render(
        <StudioHeader
          {...makeProps({ composer: asComposer(composer), onSetPreviewLoading, onInlinePreview })}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Quick preview" }));
      expect(onSetPreviewLoading).toHaveBeenCalledWith(true);
      expect(composer.exportHTML).not.toHaveBeenCalled();
      act(() => {
        vi.runAllTimers();
      });
      expect(composer.exportHTML).toHaveBeenCalledTimes(1);
      expect(onInlinePreview).toHaveBeenCalledTimes(1);
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
    expect(screen.getByText("Leave the editor?")).toBeTruthy();
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(screen.queryByTestId("command-palette")).toBeNull();
  });
});
