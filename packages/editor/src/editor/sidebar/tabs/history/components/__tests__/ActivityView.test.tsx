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

describe("ActivityView — clear-history confirm FSM", () => {
  it("hides the Clear control entirely when no handler is supplied", () => {
    setHistory([entry()], false);
    renderView();
    expect(screen.queryByRole("button", { name: /clear/i })).toBeNull();
  });

  it("disables Clear when there is nothing to clear", () => {
    setHistory([entry()], false);
    renderView({ onClearHistory: vi.fn(), canClear: false } as never);
    expect(screen.getByRole("button", { name: "Clear undo history" })).toBeDisabled();
  });

  it("Clear → confirm reveals Clear-all + Cancel; Clear-all fires the handler", () => {
    const onClearHistory = vi.fn();
    setHistory([entry()], false);
    renderView({ onClearHistory, canClear: true } as never);

    fireEvent.click(screen.getByRole("button", { name: "Clear undo history" }));
    expect(screen.getByRole("button", { name: "Confirm clear history" })).toBeInTheDocument();
    expect(onClearHistory).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Confirm clear history" }));
    expect(onClearHistory).toHaveBeenCalledTimes(1);
    // Returns to the idle Clear button.
    expect(screen.getByRole("button", { name: "Clear undo history" })).toBeInTheDocument();
  });

  it("Cancel backs out of the confirm state without clearing", () => {
    const onClearHistory = vi.fn();
    setHistory([entry()], false);
    renderView({ onClearHistory, canClear: true } as never);

    fireEvent.click(screen.getByRole("button", { name: "Clear undo history" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel clear" }));
    expect(onClearHistory).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Clear undo history" })).toBeInTheDocument();
  });
});

describe("ActivityView — time-travel trigger", () => {
  it("renders and fires the Time-Travel button when a handler is provided", () => {
    const onOpenTimeTravel = vi.fn();
    setHistory([entry()], false);
    renderView({ onOpenTimeTravel } as never);
    fireEvent.click(screen.getByRole("button", { name: /Open Time-Travel scrubber/i }));
    expect(onOpenTimeTravel).toHaveBeenCalledTimes(1);
  });
});
