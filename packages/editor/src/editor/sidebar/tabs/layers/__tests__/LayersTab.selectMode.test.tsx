// @vitest-environment jsdom
/**
 * Layers selection mode — owner decision 2026-10-03, overriding v3 boards
 * 4418:79139 / 4418:81300 (a checkbox on every row at all times).
 *
 *   off (default) → footer "N layers" + Select; rows carry no checkbox.
 *   Select        → rows carry checkboxes; Select all while any row is
 *                   unticked, Deselect all while any is ticked, Done.
 *   Done / Esc    → leaves the mode and clears the selection the ticks were.
 *
 * The rows themselves are LayerTreeItem's suite; here LayersPanel is a stub
 * that reports the `selecting` prop it was handed.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { Composer } from "@/engine";

vi.mock("@/editor/panels/layers/index", () => ({
  LayersPanel: (props: { selecting?: boolean }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "layers-panel-mock", "data-selecting": String(!!props.selecting) });
  },
}));

vi.mock("@/editor/canvas/hooks/useComposerSelection", () => ({
  useComposerSelection: () => ({ selectedElement: null, selectedId: null }),
}));

import { LayersTab } from "../LayersTab";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((query: string) => ({
      matches: false, media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});

function makeComposer() {
  const handlers = new Map<string, Set<(p: unknown) => void>>();
  const emit = vi.fn((ev: string, p?: unknown) => handlers.get(ev)?.forEach((fn) => fn(p)));
  const selection = { clear: vi.fn(), getSelectedIds: vi.fn(() => [] as string[]) };
  const composer = {
    on: (ev: string, fn: (p: unknown) => void) => {
      if (!handlers.has(ev)) handlers.set(ev, new Set());
      handlers.get(ev)!.add(fn);
    },
    off: (ev: string, fn: (p: unknown) => void) => handlers.get(ev)?.delete(fn),
    emit,
    selection,
    isProjectLoading: () => false,
  };
  const stats = (total: number, selected: number) =>
    act(() => {
      emit("layers:stats-change", { total, selected, matches: null });
    });
  return { composer: composer as unknown as Composer, emit, selection, stats };
}

const panel = () => screen.getByTestId("layers-panel-mock");

describe("Layers — selection mode", () => {
  it("is off by default: the count, a Select button, no checkboxes", () => {
    const { composer, stats } = makeComposer();
    render(<LayersTab composer={composer} onClose={vi.fn()} />);
    stats(96, 0);
    expect(screen.getByTestId("layers-count-text")).toHaveTextContent("96 layers");
    expect(screen.getByRole("button", { name: "Select" })).toBeTruthy();
    expect(panel().getAttribute("data-selecting")).toBe("false");
    expect(screen.queryByRole("button", { name: "Done" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Select all" })).toBeNull();
    expect(screen.getByTestId("layers-dim-info")).toBeTruthy();
  });

  it("Select turns the checkboxes on and becomes Done; nothing ticked → Select all only", () => {
    const { composer, stats } = makeComposer();
    render(<LayersTab composer={composer} onClose={vi.fn()} />);
    stats(96, 0);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    expect(panel().getAttribute("data-selecting")).toBe("true");
    expect(screen.queryByRole("button", { name: "Select" })).toBeNull();
    expect(screen.getByRole("button", { name: "Done" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select all" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Deselect all" })).toBeNull();
    expect(screen.getByTestId("layers-count-text")).toHaveTextContent("96 layers");
    // The dim-scope ⓘ stands down so the band has room for the actions.
    expect(screen.queryByTestId("layers-dim-info")).toBeNull();
  });

  it("some ticked → both Select all and Deselect all, and the count reads 'N selected'", () => {
    const { composer, stats } = makeComposer();
    render(<LayersTab composer={composer} onClose={vi.fn()} />);
    stats(96, 0);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    stats(96, 3);
    expect(screen.getByTestId("layers-count-text")).toHaveTextContent("3 selected");
    expect(screen.getByRole("button", { name: "Select all" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Deselect all" })).toBeTruthy();
  });

  it("all ticked → Deselect all only", () => {
    const { composer, stats } = makeComposer();
    render(<LayersTab composer={composer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    stats(96, 96);
    expect(screen.queryByRole("button", { name: "Select all" })).toBeNull();
    expect(screen.getByRole("button", { name: "Deselect all" })).toBeTruthy();
  });

  it("Select all asks the tree for every listed row; Deselect all clears the selection", () => {
    const { composer, emit, selection, stats } = makeComposer();
    render(<LayersTab composer={composer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    stats(96, 3);
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(emit).toHaveBeenCalledWith("layers:select-all", {});
    fireEvent.click(screen.getByRole("button", { name: "Deselect all" }));
    expect(selection.clear).toHaveBeenCalledTimes(1);
    // Deselect all keeps the mode — only Done / Escape leave it.
    expect(panel().getAttribute("data-selecting")).toBe("true");
  });

  it("Done leaves the mode and clears the ticks", () => {
    const { composer, selection, stats } = makeComposer();
    render(<LayersTab composer={composer} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    stats(96, 3);
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(selection.clear).toHaveBeenCalled();
    expect(panel().getAttribute("data-selecting")).toBe("false");
    expect(screen.getByRole("button", { name: "Select" })).toBeTruthy();
  });

  it("Escape leaves the mode (and clears) without closing the drawer", () => {
    const onClose = vi.fn();
    const { composer, selection } = makeComposer();
    render(<LayersTab composer={composer} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(panel().getAttribute("data-selecting")).toBe("false");
    expect(selection.clear).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    // Out of the mode, Escape is the drawer's again.
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closing the drawer drops the mode", () => {
    const { composer } = makeComposer();
    const { rerender } = render(<LayersTab composer={composer} onClose={vi.fn()} isOpen />);
    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    rerender(<LayersTab composer={composer} onClose={vi.fn()} isOpen={false} />);
    rerender(<LayersTab composer={composer} onClose={vi.fn()} isOpen />);
    expect(panel().getAttribute("data-selecting")).toBe("false");
  });
});
