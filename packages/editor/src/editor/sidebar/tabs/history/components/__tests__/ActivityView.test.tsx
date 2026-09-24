// @vitest-environment jsdom
/**
 * ActivityView.test.tsx — the activity timeline's state gating + header FSM.
 * The react-window body needs a measured height (always 0 under jsdom), so
 * these cover the deterministic non-virtualized surface: error / loading /
 * empty / no-match states, the search filter, the clear-history confirm FSM,
 * and the Time-Travel trigger.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import type { HistoryDisplayEntry } from "@/engine/historyTypes";
import { ActivityView } from "../ActivityView";

const { historyState } = vi.hoisted(() => ({
  historyState: { historyStack: [] as unknown[], isLoading: false },
}));

vi.mock("@/shared/hooks/useHistoryState", () => ({
  useHistoryState: () => historyState,
}));
vi.mock("@/shared/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

function entry(over: Partial<HistoryDisplayEntry> = {}): HistoryDisplayEntry {
  return {
    id: "h1",
    label: "Move heading",
    timestamp: 1_700_000_000_000,
    type: "action",
    changes: [],
    ...over,
  } as HistoryDisplayEntry;
}

function setHistory(stack: unknown[], isLoading = false) {
  historyState.historyStack = stack;
  historyState.isLoading = isLoading;
}

function renderView(props: Partial<Parameters<typeof ActivityView>[0]> = {}) {
  return render(<ActivityView composer={{} as never} {...props} />);
}

beforeEach(() => {
  cleanup();
  setHistory([], false);
});

describe("ActivityView — non-happy states", () => {
  it("renders the error state with a working Retry", () => {
    const onRetry = vi.fn();
    renderView({ error: "boom", onRetry });
    expect(screen.getByText("Failed to load activity")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders skeleton rows while loading", () => {
    setHistory([], true);
    const { container } = renderView();
    expect(container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);
  });

  it("shows the first-run empty state when there is no history", () => {
    setHistory([], false);
    renderView();
    expect(screen.getByText("No undo history")).toBeInTheDocument();
  });

  it("shows the no-match empty state when a search filters everything out", () => {
    setHistory([entry({ label: "Move heading" })], false);
    renderView({ searchQuery: "zzz-nothing" });
    expect(screen.getByText("No matching entries")).toBeInTheDocument();
    expect(screen.getByText("Try a different search term")).toBeInTheDocument();
  });

  it("keeps a matching entry out of the no-match state", () => {
    setHistory([entry({ label: "Move heading" })], false);
    renderView({ searchQuery: "heading" });
    // Matched → not the empty state.
    expect(screen.queryByText("No matching entries")).toBeNull();
  });
});

describe("ActivityView — board 4418:73791 draws no header band", () => {
  it("has no Undo History / Clear / Time-Travel controls (they live in the History ⋯)", () => {
    renderView();
    expect(screen.queryByText("Undo History")).toBeNull();
    expect(screen.queryByRole("button", { name: /Clear undo history|Time-Travel/ })).toBeNull();
  });
});

/* jsdom reports 0 for every clientHeight, and the virtualized body only renders
   when it measures a non-zero host — so any test that needs real rows has to
   stub it. Shared by the mount test below and the restore-confirm tests. */
const withHeight = (px: number) => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
  Object.defineProperty(HTMLElement.prototype, "clientHeight", {
    configurable: true,
    get() {
      return this.classList?.contains("virtual-list") ? px : 0;
    },
  });
  return () => {
    if (original) Object.defineProperty(HTMLElement.prototype, "clientHeight", original);
  };
};


describe("ActivityView — the list body actually mounts", () => {
  it("renders rows after loading finishes, not an empty box", () => {
    const restore = withHeight(400);
    try {
      // First paint is the skeleton — the branch with no scroll host at all.
      setHistory([], true);
      const view = renderView();
      expect(view.container.querySelectorAll(".skeleton").length).toBeGreaterThan(0);

      setHistory([entry({ id: "h1", label: "Move heading" })], false);
      view.rerender(<ActivityView composer={{} as never} />);

      expect(view.container.querySelector(".virtual-list")).toBeTruthy();
      expect(screen.getByText("Move heading")).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});

/* The timestamp control used to be labelled "Jump to 14:32" and called
   `composer.history.restoreEntry` straight from the click. That call truncates
   the undo stack and empties the redo stack — one click, no confirmation, and
   every step after that point is gone. The word "Jump" promised navigation.
   These lock the affordance to what it actually does. */
describe("ActivityView — restoring from a timestamp is confirmed", () => {
  const makeComposer = () => ({
    history: { restoreEntry: vi.fn() },
    isDirty: () => false,
  });

  const twoEntries = () => [
    entry({ id: "h2", label: "Recolor button", timestamp: 1_700_000_100_000 }),
    entry({ id: "h1", label: "Move heading", timestamp: 1_700_000_000_000 }),
  ];

  it("does not destroy the stack on the click alone — it asks first", () => {
    const restore = withHeight(400);
    try {
      const composer = makeComposer();
      setHistory(twoEntries(), false);
      const { container } = render(<ActivityView composer={composer as never} />);

      const timeButtons = container.querySelectorAll(".entry-time-btn");
      expect(timeButtons.length).toBe(2);

      // Second row = one step back; restoring it discards the newer change.
      fireEvent.click(timeButtons[1]);
      expect(composer.history.restoreEntry).not.toHaveBeenCalled();

      // A confirmation naming the loss stands between the click and the engine.
      const dialog = screen.getByRole("dialog");
      expect(dialog.textContent).toMatch(/permanently discards 1 later change/);

      fireEvent.click(screen.getByRole("button", { name: /^Restore, discard 1 change$/ }));
      expect(composer.history.restoreEntry).toHaveBeenCalledTimes(1);
      expect(composer.history.restoreEntry).toHaveBeenCalledWith("h1");
    } finally {
      restore();
    }
  });

  it("cancelling leaves the history stack untouched", () => {
    const restore = withHeight(400);
    try {
      const composer = makeComposer();
      setHistory(twoEntries(), false);
      const { container } = render(<ActivityView composer={composer as never} />);

      fireEvent.click(container.querySelectorAll(".entry-time-btn")[1]);
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

      expect(composer.history.restoreEntry).not.toHaveBeenCalled();
      expect(screen.queryByRole("dialog")).toBeNull();
    } finally {
      restore();
    }
  });

  it("does not label a destructive restore as navigation", () => {
    const restore = withHeight(400);
    try {
      setHistory(twoEntries(), false);
      const { container } = render(<ActivityView composer={makeComposer() as never} />);

      const label = container.querySelector(".entry-time-btn")?.getAttribute("aria-label") ?? "";
      expect(label).not.toMatch(/jump/i);
      expect(label).toMatch(/restore/i);
    } finally {
      restore();
    }
  });
});

/* Board 4418:73791 — the Session list is plain 44-tall rows: "label · author"
   at the left, the time in mono at the right. No date bands, no badges, no
   relative time, no keyboard-hint footer. The row still expands to its diff
   and the time is still the (confirmed) restore. */
describe("ActivityView — Session rows are board 4418:73791", () => {
  it("draws label · author and the time, with none of the old row furniture", () => {
    const restore = withHeight(400);
    try {
      setHistory([
        entry({ id: "h2", label: "Hero copy edited", userId: "cmpa9ohx10000wrjux4ecumzo", timestamp: 1_700_000_100_000 }),
        entry({ id: "h1", label: "Move heading" }),
      ]);
      const view = renderView();
      expect(screen.getByTestId("history-change-label-0").textContent).toBe("Hero copy edited · You");
      // the first row is not drawn highlighted before anything picks it
      expect(screen.getByTestId("history-change-0").className).not.toMatch(/focused/);
      expect(screen.getByTestId("history-change-label-1").textContent).toBe("Move heading");
      expect(screen.getByTestId("history-change-time-0").textContent).toMatch(/\d{1,2}:\d{2}/);
      expect(view.container.querySelector(".date-group-header")).toBeNull();
      expect(view.container.querySelector(".keyboard-hints")).toBeNull();
      expect(view.container.querySelector(".entry-badge")).toBeNull();
      expect(screen.queryByText("Current")).toBeNull();
      expect(screen.queryByText(/ago$|Just now/)).toBeNull();
    } finally {
      restore();
    }
  });

  it("still expands a row to its changes", () => {
    const restore = withHeight(400);
    try {
      setHistory([
        entry({
          id: "h1",
          label: "Restyle",
          changes: [{ property: "color", operation: "replace", type: "style", description: "color" }] as never,
        }),
      ]);
      renderView();
      fireEvent.click(screen.getByTestId("history-change-0"));
      expect(screen.getByRole("region", { name: "Changes detail" })).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
