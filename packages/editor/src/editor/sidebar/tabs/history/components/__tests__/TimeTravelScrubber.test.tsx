// @vitest-environment jsdom
/**
 * TimeTravelScrubber.test.tsx — the bottom scrub drawer's deterministic logic:
 * empty-history guard, initial mid-point selection, restore/exit wiring,
 * slider scrubbing, and keyboard shortcuts. Reduced-motion is forced on so the
 * overlay layer reveals synchronously (no rAF timing in the assertions).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

vi.mock("@/shared/hooks/useReducedMotion", () => ({
  useReducedMotion: () => true,
}));

import { TimeTravelScrubber } from "../TimeTravelScrubber";

type Entry = { id: string; label: string; timestamp: number };

function makeHistory(n: number): Entry[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `e${i}`,
    label: `Edit ${i}`,
    timestamp: 1_700_000_000_000 + i * 60_000,
  }));
}

function makeComposer() {
  return { versions: { getVersions: vi.fn(() => []) } };
}

function renderScrubber(history: Entry[]) {
  const onRestore = vi.fn();
  const onExit = vi.fn();
  const utils = render(
    <TimeTravelScrubber
      composer={makeComposer() as never}
      historyStack={history as never}
      onRestore={onRestore}
      onExit={onExit}
    />,
  );
  return { onRestore, onExit, ...utils };
}

const slider = () => screen.getByRole("slider", { name: "Time travel scrubber" });

beforeEach(() => cleanup());

describe("TimeTravelScrubber — empty history", () => {
  it("shows the empty message and no slider", () => {
    renderScrubber([]);
    expect(screen.getByText(/No history entries to scrub through/i)).toBeInTheDocument();
    expect(screen.queryByRole("slider")).toBeNull();
  });
});

describe("TimeTravelScrubber — populated", () => {
  it("selects the mid-point entry initially", () => {
    // 5 entries → floor(5/2) = index 2 → 'Edit 2'.
    renderScrubber(makeHistory(5));
    expect(screen.getByText(/Previewing: .* — Edit 2/)).toBeInTheDocument();
  });

  it("renders the scrubber slider plus Restore + Exit controls", () => {
    renderScrubber(makeHistory(4));
    expect(slider()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restore this point/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Exit time-travel/i })).toBeInTheDocument();
  });

  it("restores the currently-selected entry", () => {
    const { onRestore } = renderScrubber(makeHistory(5));
    fireEvent.click(screen.getByRole("button", { name: /Restore this point/i }));
    expect(onRestore).toHaveBeenCalledWith("e2");
  });

  it("exits via the Exit button", () => {
    const { onExit } = renderScrubber(makeHistory(5));
    fireEvent.click(screen.getByRole("button", { name: /Exit time-travel/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("moves the selection when the slider is scrubbed to the end", () => {
    renderScrubber(makeHistory(5));
    fireEvent.change(slider(), { target: { value: "100" } });
    // 100% → maxIndex (4) → 'Edit 4'.
    expect(screen.getByText(/Previewing: .* — Edit 4/)).toBeInTheDocument();
  });

  it("scrubbing to 0 selects the first entry", () => {
    renderScrubber(makeHistory(5));
    fireEvent.change(slider(), { target: { value: "0" } });
    expect(screen.getByText(/Previewing: .* — Edit 0/)).toBeInTheDocument();
  });
});

describe("TimeTravelScrubber — keyboard", () => {
  it("Enter restores the selected entry", () => {
    const { onRestore } = renderScrubber(makeHistory(5));
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onRestore).toHaveBeenCalledWith("e2");
  });

  it("Ctrl+Shift+T exits", () => {
    const { onExit } = renderScrubber(makeHistory(5));
    fireEvent.keyDown(document, { key: "T", ctrlKey: true, shiftKey: true });
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("ArrowLeft steps the selection back one entry", () => {
    const { onRestore } = renderScrubber(makeHistory(5));
    // Start at index 2 → ArrowLeft → index 1 → Enter restores 'e1'.
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onRestore).toHaveBeenCalledWith("e1");
  });

  it("ArrowRight steps the selection forward one entry", () => {
    const { onRestore } = renderScrubber(makeHistory(5));
    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "Enter" });
    expect(onRestore).toHaveBeenCalledWith("e3");
  });
});
