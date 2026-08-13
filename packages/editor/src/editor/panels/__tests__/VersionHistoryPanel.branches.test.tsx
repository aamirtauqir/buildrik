/**
 * VersionHistoryPanel — branch coverage on top of the D3 Stage 0 baseline
 * (VersionHistoryPanel.test.tsx). Only branches NOT hit there:
 *
 *   - Save form: Escape closes + clears, Cancel button, whitespace-name
 *     guard, disabled Save button, failure toast, success toast
 *   - Restore: cancel path, failure toast, success toast
 *   - Delete: cancel path, failure toast, success toast, expanded-row
 *     collapse on delete
 *   - Compare: toggle-off collapse, cached-result reuse, newest-version
 *     short-circuit (no compareVersions call), visual/semantic tab
 *     states with and without snapshots
 *
 * Mock strategy mirrors the baseline test: useVersionHistory mocked at
 * module level, react-window FixedSizeList flattened, clientHeight
 * stubbed so the list branch is entered.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render as rtlRender, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import * as React from "react";
import type { Composer } from "@/engine";
import type { NamedVersion } from "@/shared/types/versions";

// The panel calls useToast(); in the app it sits inside AquibraStudio's
// ToastProvider. Supply the same context here rather than mocking it away.
import { ToastProvider } from "@/editor/chrome-ui";
const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ToastProvider });

// ─── Mocks (same shape as VersionHistoryPanel.test.tsx) ───────────────

vi.mock("react-window", () => ({
  FixedSizeList: ({
    children,
    itemCount,
    itemKey,
  }: {
    children: (props: { index: number; style: React.CSSProperties }) => React.ReactNode;
    itemCount: number;
    itemKey?: (index: number) => string | number;
  }) => (
    <div data-testid="mock-fixed-list">
      {Array.from({ length: itemCount }).map((_, i) => (
        <div key={itemKey ? itemKey(i) : i} data-testid={`mock-row-${i}`}>
          {children({ index: i, style: {} })}
        </div>
      ))}
    </div>
  ),
}));

const mocks = vi.hoisted(() => {
  const state: {
    versions: NamedVersion[];
    isAvailable: boolean;
  } = { versions: [], isAvailable: true };
  return {
    state,
    createVersion: vi.fn(),
    restoreVersion: vi.fn(),
    deleteVersion: vi.fn(),
    compareVersions: vi.fn(),
    updateAiSummary: vi.fn(),
    getVersion: vi.fn(),
  };
});

vi.mock("../../../shared/hooks/useVersionHistory", () => ({
  useVersionHistory: () => ({
    versions: mocks.state.versions,
    isAvailable: mocks.state.isAvailable,
    isLoading: false,
    createVersion: mocks.createVersion,
    restoreVersion: mocks.restoreVersion,
    deleteVersion: mocks.deleteVersion,
    getVersion: mocks.getVersion,
    compareVersions: mocks.compareVersions,
    updateAiSummary: mocks.updateAiSummary,
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────

function makeVersion(overrides: Partial<NamedVersion> = {}): NamedVersion {
  return {
    id: overrides.id ?? "v-" + Math.random().toString(36).slice(2, 8),
    name: overrides.name ?? "Untitled",
    description: overrides.description,
    snapshot: overrides.snapshot ?? ({} as never),
    createdAt: overrides.createdAt ?? Date.now() - 60_000,
    tags: overrides.tags,
    isAutoCheckpoint: overrides.isAutoCheckpoint ?? false,
    projectId: overrides.projectId,
    visualSnapshot: overrides.visualSnapshot,
    aiSummary: overrides.aiSummary,
    userId: overrides.userId,
  };
}

function makeComposer(): Composer {
  return {
    /* The panel subscribes to VERSION_PRUNED. A composer without an event
       registry is not a composer — the stub was thinner than the real thing,
       which is only visible the first time the component subscribes. */
    on: () => {},
    off: () => {},
    versions: {
      captureVisualSnapshot: () => "data:image/jpeg;base64,fake",
    },
  } as unknown as Composer;
}

/** Composer with no versions manager — currentVisualSnapshot stays null. */
function makeSnapshotlessComposer(): Composer {
  return { on: () => {}, off: () => {} } as unknown as Composer;
}

async function loadPanel() {
  const mod = await import("../VersionHistoryPanel");
  return mod.VersionHistoryPanel;
}

const emptyCompareResult = {
  summary: { changesCount: 0, additions: 0, deletions: 0, modifications: 0 },
  changes: [],
};

// jsdom clientHeight is 0 → the `listHeight > 0` branch would skip the
// (mocked) FixedSizeList. Stub the prototype getter like the baseline test.
Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get() {
    return 600;
  },
});

beforeEach(() => {
  mocks.state.versions = [];
  mocks.state.isAvailable = true;
  mocks.createVersion.mockReset();
  mocks.restoreVersion.mockReset();
  mocks.deleteVersion.mockReset();
  mocks.compareVersions.mockReset();
  mocks.updateAiSummary.mockReset();
  mocks.getVersion.mockReset();
});

afterEach(() => {
  cleanup();
});

// ─── Save form branches ───────────────────────────────────────────────

describe("VersionHistoryPanel — save form branches", () => {
  it("Escape closes the form and clears the pending name", async () => {
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText("Save version"));
    const input = await screen.findByPlaceholderText(/homepage redesign/i);
    fireEvent.change(input, { target: { value: "Draft name" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(screen.queryByPlaceholderText(/homepage redesign/i)).toBeNull();
    expect(mocks.createVersion).not.toHaveBeenCalled();

    // Reopen — the previously typed name must be gone.
    fireEvent.click(screen.getByLabelText("Save version"));
    const reopened = await screen.findByPlaceholderText(/homepage redesign/i);
    expect((reopened as HTMLInputElement).value).toBe("");
  });

  it("Cancel button closes the form without saving", async () => {
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText("Save version"));
    await screen.findByPlaceholderText(/homepage redesign/i);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByPlaceholderText(/homepage redesign/i)).toBeNull();
    expect(mocks.createVersion).not.toHaveBeenCalled();
  });

  it("whitespace-only name: Enter is a no-op and Save Version stays disabled", async () => {
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText("Save version"));
    const input = await screen.findByPlaceholderText(/homepage redesign/i);
    fireEvent.change(input, { target: { value: "   " } });

    const saveBtn = screen.getByRole("button", { name: "Save Version" });
    expect((saveBtn as HTMLButtonElement).disabled).toBe(true);

    fireEvent.keyDown(input, { key: "Enter" });
    expect(mocks.createVersion).not.toHaveBeenCalled();
    // Form stays open — the guard returns before any state change.
    expect(screen.getByPlaceholderText(/homepage redesign/i)).toBeTruthy();
  });

  it("createVersion rejection shows the 'Save failed' toast and keeps the form open", async () => {
    mocks.createVersion.mockRejectedValue(new Error("boom"));
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText("Save version"));
    const input = await screen.findByPlaceholderText(/homepage redesign/i);
    fireEvent.change(input, { target: { value: "Doomed" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(await screen.findByText("Save failed")).toBeTruthy();
    // Failure path never closes the form (only the success path does).
    expect(screen.getByPlaceholderText(/homepage redesign/i)).toBeTruthy();
  });

  it("successful save via the Save Version button shows the success toast and closes the form", async () => {
    mocks.createVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText("Save version"));
    const input = await screen.findByPlaceholderText(/homepage redesign/i);
    fireEvent.change(input, { target: { value: "Milestone 2" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Version" }));

    expect(await screen.findByText("Saved 'Milestone 2'")).toBeTruthy();
    expect(mocks.createVersion).toHaveBeenCalledWith("Milestone 2", "");
    expect(screen.queryByPlaceholderText(/homepage redesign/i)).toBeNull();
  });
});

// ─── Restore branches ─────────────────────────────────────────────────

describe("VersionHistoryPanel — restore branches", () => {
  it("Cancel in the confirmation strip aborts without calling restoreVersion", async () => {
    mocks.state.versions = [makeVersion({ id: "v1", name: "Save A" })];
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Restore "Save A"'));
    await screen.findByText(/Restore to "Save A"\?/);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByText(/Restore to "Save A"\?/)).toBeNull();
    expect(mocks.restoreVersion).not.toHaveBeenCalled();
  });

  it("restoreVersion rejection shows the 'Restore failed' toast", async () => {
    mocks.state.versions = [makeVersion({ id: "v1", name: "Save A" })];
    mocks.restoreVersion.mockRejectedValue(new Error("nope"));
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Restore "Save A"'));
    await screen.findByText(/Restore to "Save A"\?/);
    fireEvent.click(screen.getAllByRole("button", { name: /^Restore$/ })[0]);

    expect(await screen.findByText("Restore failed")).toBeTruthy();
  });

  it("successful restore shows the 'Restored to <time>' toast", async () => {
    mocks.state.versions = [makeVersion({ id: "v1", name: "Save A" })];
    mocks.restoreVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Restore "Save A"'));
    await screen.findByText(/Restore to "Save A"\?/);
    fireEvent.click(screen.getAllByRole("button", { name: /^Restore$/ })[0]);

    expect(await screen.findByText(/^Restored to /)).toBeTruthy();
    expect(mocks.restoreVersion).toHaveBeenCalledWith("v1");
  });
});

// ─── Delete branches ──────────────────────────────────────────────────

describe("VersionHistoryPanel — delete branches", () => {
  it("row-inline Cancel aborts without calling deleteVersion", async () => {
    mocks.state.versions = [makeVersion({ id: "v1", name: "Keep me" })];
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Delete "Keep me"'));
    await screen.findByLabelText("Confirm delete");
    fireEvent.click(screen.getByLabelText("Cancel"));

    expect(screen.queryByLabelText("Confirm delete")).toBeNull();
    // Normal row actions are back.
    expect(screen.getByLabelText('Compare "Keep me"')).toBeTruthy();
    expect(mocks.deleteVersion).not.toHaveBeenCalled();
  });

  it("deleteVersion rejection shows the 'Delete failed' toast", async () => {
    mocks.state.versions = [makeVersion({ id: "v1", name: "Sticky" })];
    mocks.deleteVersion.mockRejectedValue(new Error("db"));
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Delete "Sticky"'));
    fireEvent.click(await screen.findByLabelText("Confirm delete"));

    expect(await screen.findByText("Delete failed")).toBeTruthy();
  });

  it("successful delete shows the 'Deleted <name>' toast", async () => {
    mocks.state.versions = [makeVersion({ id: "v1", name: "Old draft" })];
    mocks.deleteVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Delete "Old draft"'));
    fireEvent.click(await screen.findByLabelText("Confirm delete"));

    expect(await screen.findByText("Deleted Old draft")).toBeTruthy();
  });

  it("deleting the version whose compare view is expanded collapses the detail", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({ id: "older", name: "Older" }),
    ];
    mocks.compareVersions.mockResolvedValue(emptyCompareResult);
    mocks.deleteVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await screen.findByRole("tablist", { name: "Compare mode" });

    fireEvent.click(screen.getByLabelText('Delete "Older"'));
    fireEvent.click(await screen.findByLabelText("Confirm delete"));

    await waitFor(() => {
      expect(mocks.deleteVersion).toHaveBeenCalledWith("older");
      expect(screen.queryByRole("tablist", { name: "Compare mode" })).toBeNull();
    });
  });
});

// ─── Compare branches ─────────────────────────────────────────────────

describe("VersionHistoryPanel — compare branches", () => {
  it("clicking Compare again collapses the detail (single compareVersions call)", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({ id: "older", name: "Older" }),
    ];
    mocks.compareVersions.mockResolvedValue(emptyCompareResult);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await screen.findByRole("tablist", { name: "Compare mode" });
    await waitFor(() => expect(mocks.compareVersions).toHaveBeenCalledTimes(1));

    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await waitFor(() => {
      expect(screen.queryByRole("tablist", { name: "Compare mode" })).toBeNull();
    });
    expect(mocks.compareVersions).toHaveBeenCalledTimes(1);
  });

  it("re-expanding reuses the cached compare result (no second compareVersions call)", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({ id: "older", name: "Older" }),
    ];
    mocks.compareVersions.mockResolvedValue(emptyCompareResult);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    // Expand → collapse → expand.
    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await waitFor(() => expect(mocks.compareVersions).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await waitFor(() => {
      expect(screen.queryByRole("tablist", { name: "Compare mode" })).toBeNull();
    });
    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await screen.findByRole("tablist", { name: "Compare mode" });

    expect(mocks.compareVersions).toHaveBeenCalledTimes(1);
  });

  it("comparing the newest version shows the detail without calling compareVersions", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({ id: "older", name: "Older" }),
    ];
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Compare "Latest"'));
    await screen.findByRole("tablist", { name: "Compare mode" });

    // PIN: latest.id === versionId short-circuits — the newest version has
    // nothing newer to diff against, so no compareVersions request fires.
    expect(mocks.compareVersions).not.toHaveBeenCalled();
  });

  it("compare view defaults to Visual when snapshots exist and Semantic tab toggles", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({
        id: "older",
        name: "Older",
        visualSnapshot: "data:image/jpeg;base64,old",
      }),
    ];
    mocks.compareVersions.mockResolvedValue(emptyCompareResult);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await screen.findByRole("tablist", { name: "Compare mode" });

    const visualTab = screen.getByRole("tab", { name: "Visual" });
    const semanticTab = screen.getByRole("tab", { name: "Semantic" });
    expect(visualTab.getAttribute("aria-selected")).toBe("true");

    fireEvent.click(semanticTab);
    expect(semanticTab.getAttribute("aria-selected")).toBe("true");
    expect(visualTab.getAttribute("aria-selected")).toBe("false");
  });

  it("without any snapshot the Visual tab is disabled and Semantic is forced", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({ id: "older", name: "Older" }),
    ];
    mocks.compareVersions.mockResolvedValue(emptyCompareResult);
    const Panel = await loadPanel();
    // Snapshotless composer → currentVisualSnapshot stays null; the
    // version itself has no visualSnapshot either → hasVisual = false.
    render(<Panel composer={makeSnapshotlessComposer()} />);

    fireEvent.click(screen.getByLabelText('Compare "Older"'));
    await screen.findByRole("tablist", { name: "Compare mode" });

    const visualTab = screen.getByRole("tab", { name: "Visual" });
    const semanticTab = screen.getByRole("tab", { name: "Semantic" });
    expect((visualTab as HTMLButtonElement).disabled).toBe(true);
    expect(semanticTab.getAttribute("aria-selected")).toBe("true");
  });
});
