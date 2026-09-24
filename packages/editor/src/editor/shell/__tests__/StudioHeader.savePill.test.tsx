/**
 * StudioHeader — the save pill's click, by state (B2, decision #23; G1-005).
 *
 * The pill used to save for `unsaved`/`error` and be inert otherwise. The
 * board's status dot opens History and the owner kept ⌘S as the save, so the
 * container now routes the click:
 *   saved · saving · unsaved → History
 *   error                    → retry the save
 *   conflict                 → the recovery dialog (B1-01 7563:197963)
 *   offline                  → no navigation; the reason is a tooltip
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/utils/featureFlags", () => ({ isFeatureEnabled: vi.fn(() => false) }));
vi.mock("../../../shared/utils/editorViewMode", () => ({
  getEditorViewMode: vi.fn(() => ({ railMode: "figma", fourToolRail: false, density: "full", readOnlyView: false })),
}));
vi.mock("../../../services/ReviewService", () => ({
  submitForReview: vi.fn(() => Promise.resolve()),
  currentSiteId: vi.fn(() => null),
}));
vi.mock("@/services/syncRetryQueue", () => ({ totalPendingMirrors: () => 0 }));
vi.mock("../hooks/useEditorRole", () => ({ useEditorRole: () => null }));
vi.mock("../../../services/NotificationService", () => ({
  fetchRecentNotifications: vi.fn(() => Promise.resolve([])),
  fetchUnreadCount: vi.fn(() => Promise.resolve(0)),
  markNotificationRead: vi.fn(() => Promise.resolve()),
  markAllNotificationsRead: vi.fn(() => Promise.resolve()),
}));
vi.mock("../../canvas/hooks/useCollaboration", () => ({
  useCollaboration: () => ({ users: [], currentUser: null, state: "disconnected", isConnected: false }),
}));
vi.mock("../modals/CommandPalette", () => ({ CommandPalette: () => null }));

import { StudioHeader, type StudioHeaderProps } from "../StudioHeader";

function mount(over: Partial<StudioHeaderProps> = {}) {
  const props = {
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
    onOpenHistory: vi.fn(),
    onOpenConflict: vi.fn(),
    addToast: vi.fn(() => "id"),
    reviewStatus: { state: "none" as const, reviewerName: null, at: null, reviewsEnabled: true, editsRequireApproval: false },
    nextMove: null,
    ...over,
  };
  render(<StudioHeader {...props} />);
  return props;
}

afterEach(cleanup);

describe("the save pill's click, by state", () => {
  it("saved → History", () => {
    const p = mount({ lastSavedAt: Date.now() });
    /* Board 4418:123573: the settled pill reads "History ›". */
    fireEvent.click(screen.getByRole("button", { name: /^History ›/ }));
    expect(p.onOpenHistory).toHaveBeenCalledTimes(1);
    expect(p.onSave).not.toHaveBeenCalled();
  });

  it("saving → History", () => {
    const p = mount({ saveStatus: "saving" });
    fireEvent.click(screen.getByRole("button", { name: "Saving…" }));
    expect(p.onOpenHistory).toHaveBeenCalledTimes(1);
  });

  it("unsaved → History (⌘S is the save, not the pill)", () => {
    const p = mount({ isDirty: true });
    fireEvent.click(screen.getByRole("button", { name: "Unsaved changes" }));
    expect(p.onOpenHistory).toHaveBeenCalledTimes(1);
    expect(p.onSave).not.toHaveBeenCalled();
  });

  it("error → retries the save", () => {
    const p = mount({ saveStatus: "error" });
    fireEvent.click(screen.getByRole("button", { name: /Save failed/ }));
    expect(p.onSave).toHaveBeenCalledTimes(1);
    expect(p.onOpenHistory).not.toHaveBeenCalled();
  });

  it("conflict → the recovery dialog", () => {
    const p = mount({ saveStatus: "conflict" });
    fireEvent.click(screen.getByRole("button", { name: /Conflict/ }));
    expect(p.onOpenConflict).toHaveBeenCalledTimes(1);
    expect(p.onSave).not.toHaveBeenCalled();
    expect(p.onOpenHistory).not.toHaveBeenCalled();
  });

  it("offline → no button, no navigation; the reason is a tooltip", () => {
    const p = mount({ isOffline: true, isDirty: true });
    expect(screen.queryByRole("button", { name: /Offline/ })).toBeNull();
    const pill = screen.getByText("Offline — not saved");
    expect(pill.tagName).toBe("SPAN");
    fireEvent.click(pill);
    expect(p.onOpenHistory).not.toHaveBeenCalled();
    expect(p.onSave).not.toHaveBeenCalled();
    fireEvent.focus(pill);
    expect(screen.getByRole("tooltip").textContent).toMatch(/Offline — changes aren't reaching the server/);
  });

  it("offline outranks a conflict and an error — the pill never navigates without a connection", () => {
    for (const saveStatus of ["conflict", "error"] as const) {
      cleanup();
      const p = mount({ isOffline: true, saveStatus });
      expect(screen.queryByRole("button", { name: /Conflict|Save failed|Offline/ })).toBeNull();
      expect(p.onOpenConflict).not.toHaveBeenCalled();
    }
  });
});
