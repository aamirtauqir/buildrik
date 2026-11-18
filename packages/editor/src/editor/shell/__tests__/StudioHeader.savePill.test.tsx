/**
 * StudioHeader → the bottom bar's save status, by state (2L9 497:99485; B2).
 *
 * The status left the topbar for the bottom bar ("✓ Saved just now" +
 * "Details"). StudioHeader derives it; BottomBar shows it. History is the
 * "Details" door now; the status itself is clickable only where the state is
 * the fix:
 *   saved · saving · unsaved → plain text; Details → History
 *   error                    → "Couldn't save — Retry" retries the save
 *   conflict                 → the recovery dialog (B1-01 7563:197963)
 *   offline                  → no navigation; the reason is a tooltip
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { render as rtlRender, screen, fireEvent, cleanup } from "@testing-library/react";
import { ToastProvider } from "@/editor/chrome-ui";

/* The shell mounts StudioHeader inside ToastProvider; TimeTravelHost (in the
   header) reports a failed safety version with a toast (DQ-011). */
const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ToastProvider });
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/utils/featureFlags", () => ({ isFeatureEnabled: vi.fn(() => false) }));
vi.mock("@/shared/utils/editorViewMode", () => ({
  getEditorViewMode: vi.fn(() => ({ readOnlyView: false })),
}));
vi.mock("@/services/ReviewService", () => ({
  submitForReview: vi.fn(() => Promise.resolve()),
}));
/* L3's C-4 stamps added a SyncRetryQueue export (versionSync.ts constructs
   one at module scope: `new SyncRetryQueue()`) — a mock that only supplies
   totalPendingMirrors leaves that constructor call reaching `undefined`.
   importOriginal keeps the real class (and registerPendingSource, etc.)
   intact and only overrides the one function this test controls. */
vi.mock("@/services/syncRetryQueue", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/syncRetryQueue")>();
  return { ...actual, totalPendingMirrors: () => 0 };
});
vi.mock("../hooks/useEditorRole", () => ({ useEditorRole: () => null }));
vi.mock("@/services/NotificationService", () => ({
  fetchRecentNotifications: vi.fn(() => Promise.resolve([])),
  fetchUnreadCount: vi.fn(() => Promise.resolve(0)),
  markNotificationRead: vi.fn(() => Promise.resolve()),
  markAllNotificationsRead: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/editor/canvas/hooks/useCollaboration", () => ({
  useCollaboration: () => ({ users: [], currentUser: null, state: "disconnected", isConnected: false }),
}));
vi.mock("../modals/CommandPalette", () => ({ CommandPalette: () => null }));

import { StudioHeader, type StudioHeaderProps } from "../StudioHeader";
import { BottomBar } from "../BottomBar";

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
  render(
    <>
      <StudioHeader {...props} />
      <BottomBar composer={null} pages={[]} resourceArea={false} onBackToEditor={() => {}} />
    </>,
  );
  return props;
}

afterEach(cleanup);

describe("the save status's click, by state", () => {
  it.each([
    ["saved", { lastSavedAt: Date.now() }, "Saved just now"],
    ["saving", { saveStatus: "saving" as const }, "Saving…"],
    ["unsaved", { isDirty: true }, "Unsaved changes"],
  ] as const)("%s → plain text; Details opens History (⌘S is the save)", (_s, over, copy) => {
    const p = mount(over);
    expect(screen.getByText(copy).closest("button")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(p.onOpenHistory).toHaveBeenCalledTimes(1);
    expect(p.onSave).not.toHaveBeenCalled();
  });

  it("error → retries the save", () => {
    const p = mount({ saveStatus: "error" });
    fireEvent.click(screen.getByRole("button", { name: /Couldn.t save — Retry/ }));
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
    const pill = screen.getByTestId("save-status-offline");
    expect(pill.tagName).toBe("SPAN");
    fireEvent.click(pill);
    expect(p.onOpenHistory).not.toHaveBeenCalled();
    expect(p.onSave).not.toHaveBeenCalled();
    fireEvent.focus(pill);
    expect(screen.getByRole("tooltip").textContent).toMatch(/Offline — changes aren't reaching the server/);
  });

  /* Design decision 4 reorders the pill: Conflict > Offline > Save failed >
     Not saving > Saving > Unsaved > Saved. A conflict is the one state that
     needs a choice whatever the connection, so it stays reachable offline;
     offline still outranks a failed save. */
  it("a conflict outranks offline; offline outranks a failed save and never navigates", () => {
    cleanup();
    const conflicted = mount({ isOffline: true, saveStatus: "conflict" });
    fireEvent.click(screen.getByRole("button", { name: /Conflict/ }));
    expect(conflicted.onOpenConflict).toHaveBeenCalledTimes(1);

    cleanup();
    const failed = mount({ isOffline: true, saveStatus: "error" });
    expect(screen.queryByRole("button", { name: /Couldn.t save|Offline/ })).toBeNull();
    expect(failed.onSave).not.toHaveBeenCalled();
  });
});
