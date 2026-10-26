/**
 * StudioHeader while the site is not loaded (design-2l9 Task 1.6).
 *
 * The engine holds the `not-loaded` edit lock until a load lands; the topbar
 * echoes it: the save pill reads "Not loaded · nothing saved yet" (board
 * B7-G02) and Publish is not offered, because there is nothing to publish.
 *
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


function lockedComposer(locks: string[], canUndo = false) {
  const listeners = new Map<string, Set<() => void>>();
  return {
    editLocks: new Set(locks),
    readOnly: locks.length > 0,
    on: (e: string, fn: () => void) => { (listeners.get(e) ?? listeners.set(e, new Set()).get(e)!).add(fn); },
    off: (e: string, fn: () => void) => { listeners.get(e)?.delete(fn); },
    emit: () => undefined,
    history: new Proxy(
      { canUndo: () => canUndo, canRedo: () => false, getHistoryStack: () => [], getRedoStack: () => [] },
      { get: (target, key) => (key in target ? target[key as keyof typeof target] : () => undefined) },
    ),
    designSystem: { readOnly: false },
    getState: () => ({}),
  };
}

afterEach(cleanup);

describe("StudioHeader with the not-loaded lock held", () => {
  it('save pill reads "Not loaded · nothing saved yet"', () => {
    mount({ composer: lockedComposer(["not-loaded"]) as unknown as StudioHeaderProps["composer"] });
    expect(screen.getByText("Not loaded · nothing saved yet")).toBeTruthy();
  });

  it("offers no Publish control", () => {
    mount({ composer: lockedComposer(["not-loaded"]) as unknown as StudioHeaderProps["composer"] });
    expect(screen.queryByRole("button", { name: /publish/i })).toBeNull();
  });

  it("a view lock alone keeps the normal save pill", () => {
    mount({ composer: lockedComposer(["view"]) as unknown as StudioHeaderProps["composer"] });
    expect(screen.queryByText("Not loaded · nothing saved yet")).toBeNull();
  });

  it("time travel disables topbar Undo even when history has a step", () => {
    mount({ composer: lockedComposer(["time-travel"], true) as unknown as StudioHeaderProps["composer"] });
    expect(screen.getByRole("button", { name: /^undo/i }).getAttribute("aria-disabled")).toBe("true");
  });
});
