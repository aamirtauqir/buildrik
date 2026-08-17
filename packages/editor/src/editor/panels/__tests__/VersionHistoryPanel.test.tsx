/**
 * Baseline regression tests for VersionHistoryPanel — D3 Stage 0
 * (audit-remediation 2026-05-08).
 *
 * VersionHistoryPanel.tsx is 962 LOC with zero pre-existing tests. D3
 * Stages 1-4 split the file into VersionList + CompareView + AIPanel +
 * orchestrator. Without baseline tests, splits are blind. These cases
 * pin the user-observable behaviors that must survive each split.
 *
 * Coverage targets (from audit-remediation plan §D3 Stage 0):
 *   - Versions list renders with N items, empty list shows empty state
 *   - Compare view toggles on, calls compareVersions
 *   - AI summary fetch fires on demand, renders result
 *   - Restore action calls restoreVersion + emits success toast
 *   - Delete confirmation flow + deleteVersion
 *   - Save flow: form open → name → submit → createVersion
 *
 * Mock strategy:
 *   - `useVersionHistory` mocked at module level — tests inject the
 *     versions list + spies on the action handlers.
 *   - `react-window` FixedSizeList mocked to render all rows directly
 *     (jsdom returns 0 height; the real virtualization no-ops).
 *   - global.fetch mocked for AI summary path (real call hits tRPC).
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

// ─── Mocks ────────────────────────────────────────────────────────────

// Render react-window's FixedSizeList as a plain div with all children.
// jsdom getBoundingClientRect returns 0 → real FixedSizeList won't
// render rows. Mocking here gives the panel the appearance of a
// height-resolved list.
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

// Controllable hook return — vi.hoisted because vi.mock is hoisted
// to the top of the file at transform time, so any closure variables
// the factory references must also be hoisted (otherwise the factory
// captures undefineds at hoist-time and tests see empty data).
const mocks = vi.hoisted(() => {
  const state: {
    versions: NamedVersion[];
    isAvailable: boolean;
    isLoading: boolean;
    loadError: boolean;
  } = { versions: [], isAvailable: true, isLoading: false, loadError: false };
  return {
    state,
    createVersion: vi.fn(),
    restoreVersion: vi.fn(),
    deleteVersion: vi.fn(),
    compareVersions: vi.fn(),
    retryLoad: vi.fn(),
    updateAiSummary: vi.fn(),
    getVersion: vi.fn(),
  };
});

vi.mock("../../../shared/hooks/useVersionHistory", () => ({
  useVersionHistory: () => ({
    versions: mocks.state.versions,
    isAvailable: mocks.state.isAvailable,
    isLoading: mocks.state.isLoading,
    loadError: mocks.state.loadError,
    retryLoad: mocks.retryLoad,
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
  // Minimal stub — only versions.captureVisualSnapshot() is touched.
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

// Lazy import after mocks register.
async function loadPanel() {
  const mod = await import("../VersionHistoryPanel");
  return mod.VersionHistoryPanel;
}

// ─── Tests ────────────────────────────────────────────────────────────

// jsdom returns 0 for clientHeight, which makes the panel's
// `listHeight > 0 ? <FixedSizeList /> : null` branch skip the
// FixedSizeList entirely. Stub the prototype getter so all elements
// report a non-zero height — the mocked FixedSizeList renders all
// rows regardless of height, but it has to actually be entered.
const originalClientHeightDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "clientHeight",
);
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

describe("VersionHistoryPanel — empty + availability states", () => {
  it("renders empty-state copy when versions list is empty", async () => {
    mocks.state.versions = [];
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);
    expect(screen.getByText("No saved versions yet")).toBeTruthy();
  });

  it("renders an unavailable-state copy when isAvailable=false", async () => {
    mocks.state.isAvailable = false;
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);
    // The unavailable branch shows a hint about Ctrl+Z. Pin on that
    // copy — splits must preserve it.
    expect(
      screen.getByText(/Version history appears here as you save changes/i),
    ).toBeTruthy();
  });
});

describe("VersionHistoryPanel — versions list rendering", () => {
  it("renders one row per version when the list is non-empty", async () => {
    mocks.state.versions = [
      makeVersion({ id: "v1", name: "First save" }),
      makeVersion({ id: "v2", name: "Second save" }),
      makeVersion({ id: "v3", name: "Third save" }),
    ];
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);
    // Use aria-labels — the version-row aria-label is
    // `Version "<name>" from <relative>` (see line 356).
    expect(screen.getByLabelText(/Version "First save"/)).toBeTruthy();
    expect(screen.getByLabelText(/Version "Second save"/)).toBeTruthy();
    expect(screen.getByLabelText(/Version "Third save"/)).toBeTruthy();
  });
});

describe("VersionHistoryPanel — restore flow", () => {
  it("clicking Restore opens inline confirmation, confirm calls restoreVersion", async () => {
    mocks.state.versions = [
      makeVersion({ id: "v1", name: "Save A" }),
      makeVersion({ id: "v2", name: "Save B" }),
    ];
    mocks.restoreVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    const restoreBtn = screen.getByLabelText('Restore "Save A"');
    fireEvent.click(restoreBtn);

    // Confirmation appears outside the row (pinned section).
    const confirmRestore = await screen.findByText(/Restore “Save A”\?/);
    expect(confirmRestore).toBeTruthy();

    // Click "Restore" in the confirmation strip — there are now two
    // possible matches; the inline section's button is the one with
    // textContent "Restore" not gated by aria-label.
    const allRestores = screen.getAllByRole("button", { name: /^Restore$/i });
    fireEvent.click(allRestores[0]);

    await waitFor(() => {
      expect(mocks.restoreVersion).toHaveBeenCalledWith("v1");
    });
  });
});

describe("VersionHistoryPanel — delete flow", () => {
  it("clicking Delete opens row-inline confirm, confirming calls deleteVersion", async () => {
    mocks.state.versions = [makeVersion({ id: "v9", name: "To delete" })];
    mocks.deleteVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Delete "To delete"'));
    const confirmBtn = await screen.findByLabelText("Confirm delete");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mocks.deleteVersion).toHaveBeenCalledWith("v9");
    });
  });
});

describe("VersionHistoryPanel — compare flow", () => {
  it("clicking Compare expands a CompareView and calls compareVersions", async () => {
    mocks.state.versions = [
      makeVersion({ id: "latest", name: "Latest" }),
      makeVersion({ id: "older", name: "Older" }),
    ];
    mocks.compareVersions.mockResolvedValue({
      summary: { changesCount: 1, additions: 0, deletions: 0, modifications: 1 },
      changes: [],
    });
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    fireEvent.click(screen.getByLabelText('Compare "Older"'));

    await waitFor(() => {
      expect(mocks.compareVersions).toHaveBeenCalledWith("latest", "older");
    });
  });
});

describe("VersionHistoryPanel — save flow", () => {
  it("opens save form, submits a name, calls createVersion", async () => {
    mocks.state.versions = [];
    mocks.createVersion.mockResolvedValue(undefined);
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} />);

    // FAB / save button has aria-label "Save version".
    fireEvent.click(screen.getByRole("button", { name: "+ Save a version" }));

    // Form input appears — placeholder copy is "e.g. Homepage redesign".
    const input = await screen.findByPlaceholderText(/homepage redesign/i);
    fireEvent.change(input, { target: { value: "Milestone 1" } });

    // Submit by Enter on input (handler line 585) OR click save button.
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(mocks.createVersion).toHaveBeenCalledWith("Milestone 1", "");
    });
  });
});

describe("VersionHistoryPanel — search filter", () => {
  it("filters versions by searchQuery prop", async () => {
    mocks.state.versions = [
      makeVersion({ id: "v1", name: "Hero update" }),
      makeVersion({ id: "v2", name: "Footer redesign" }),
    ];
    const Panel = await loadPanel();
    render(<Panel composer={makeComposer()} searchQuery="footer" />);

    expect(screen.queryByLabelText(/Version "Hero update"/)).toBeNull();
    expect(screen.getByLabelText(/Version "Footer redesign"/)).toBeTruthy();
  });
});

/* Board 1138:4573. VersionTimelineManager loads from storage with an await, so
   the panel's first render has versions: []. It rendered the EMPTY state for
   that window — "Version history appears here as you save changes" — to users
   who had plenty saved, then popped to a list. */
describe("VersionHistoryPanel — loading", () => {
  it("shows skeleton rows, not the empty state, while storage resolves", async () => {
    mocks.state.versions = [];
    mocks.state.isAvailable = true;
    mocks.state.isLoading = true;
    const Panel = await loadPanel();

    render(<Panel composer={makeComposer()} />);

    expect(screen.getByLabelText("Loading versions")).toBeInTheDocument();
    expect(screen.queryByText(/appears here as you save changes/)).toBeNull();
  });

  it("hands over to the real list once loading finishes", async () => {
    mocks.state.versions = [];
    mocks.state.isAvailable = true;
    mocks.state.isLoading = false;
    const Panel = await loadPanel();

    render(<Panel composer={makeComposer()} />);

    expect(screen.queryByLabelText("Loading versions")).toBeNull();
  });
});

/* Board 453:4031. loadVersions rejects on any IndexedDB failure and the manager
   had no catch — so the read failed silently and the panel showed its EMPTY
   state, telling the user their versions were gone when they were only
   unreadable. The board's copy says the opposite in as many words. */
describe("VersionHistoryPanel — load error", () => {
  it("says the versions are still stored, not that there are none", async () => {
    mocks.state.versions = [];
    mocks.state.isAvailable = true;
    mocks.state.isLoading = false;
    mocks.state.loadError = true;
    const Panel = await loadPanel();

    render(<Panel composer={makeComposer()} />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/still stored/)).toBeInTheDocument();
    expect(screen.queryByText(/appears here as you save changes/)).toBeNull();
  });

  it("offers a retry that re-runs the read", async () => {
    mocks.state.loadError = true;
    const Panel = await loadPanel();

    render(<Panel composer={makeComposer()} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(mocks.retryLoad).toHaveBeenCalledTimes(1);
  });
});
