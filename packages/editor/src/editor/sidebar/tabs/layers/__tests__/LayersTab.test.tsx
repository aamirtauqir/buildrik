// @vitest-environment jsdom
/**
 * LayersTab — tests for Pencil screens R6Odi, IR82U, R4Pf4, uHSyK alignment
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { Composer } from "../../../../../engine";

// Mock deep dependencies before importing LayersTab
vi.mock("@/editor/panels/layers/index", () => ({
  LayersPanel: () => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "layers-panel-mock" });
  },
}));

vi.mock("@/editor/canvas/hooks/useComposerSelection", () => ({
  useComposerSelection: () => ({ selectedElement: null, selectedId: null }),
}));

// Import after mocks are registered
import { EVENTS } from "@/shared/constants/events";
import { LayersTab } from "../LayersTab";

// Patch window.matchMedia (jsdom doesn't implement it) — runs after env init
beforeAll(() => {
  if (typeof globalThis.window !== "undefined") {
    Object.defineProperty(globalThis.window, "matchMedia", {
      writable: true,
      value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  }
});

// ─── LayersTab null-composer skeleton ─────────────────────────────────────────

describe("LayersTab (no composer)", () => {
  it("renders Layers header when composer is null", () => {
    render(<LayersTab composer={null} />);
    expect(screen.getByText("Layers")).toBeTruthy();
  });

  it("does not crash without optional props", () => {
    expect(() => render(<LayersTab composer={null} />)).not.toThrow();
  });
});

// ─── Header ⋯ panel menu (board 7059:78962) ───────────────────────────────

describe("LayersTab — header ⋯ menu", () => {
  const composer = () =>
    ({ on: vi.fn(), off: vi.fn(), emit: vi.fn(), isProjectLoading: () => false }) as unknown as Composer;

  it("4418:81300 — no search band in the drawer (the topbar field is the filter), no ⊞ ⊟ ⚙ glyphs", () => {
    render(<LayersTab composer={null} />);
    expect(screen.queryByLabelText("Search layers")).toBeNull();
    expect(screen.queryByTestId("layers-toolbar")).toBeNull();
    expect(screen.queryByLabelText("Expand all layers")).toBeNull();
    expect(screen.queryByLabelText("Layer display settings")).toBeNull();
  });

  it("owns the topbar field (\"Search layers…\") while open, and gives it back when closed", () => {
    const c = composer();
    const { rerender } = render(<LayersTab composer={c} isOpen />);
    expect(c.emit).toHaveBeenCalledWith(EVENTS.UI_SEARCH_CONTEXT, { placeholder: "Search layers…" });
    expect(c.on).toHaveBeenCalledWith(EVENTS.UI_SEARCH_QUERY, expect.any(Function));
    // A closed drawer stays mounted (width 0) — the field must still come back.
    rerender(<LayersTab composer={c} isOpen={false} />);
    expect(c.emit).toHaveBeenLastCalledWith(EVENTS.UI_SEARCH_CONTEXT, null);
  });

  it("Escape closes the drawer — but not from a text field or with a menu open", () => {
    const onClose = vi.fn();
    render(
      <>
        <input aria-label="rename" />
        <LayersTab composer={null} onClose={onClose} />
      </>
    );
    fireEvent.keyDown(screen.getByLabelText("rename"), { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId("layers-panel-menu"));
    fireEvent.keyDown(document.body, { key: "Escape" }); // closes the ⋯ menu only
    expect(screen.queryByRole("menu")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Escape" }); // now the drawer
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("two-step Escape: with a selection it deselects and stays open; with none it closes", () => {
    const onClose = vi.fn();
    let selected = ["el-1"];
    const clear = vi.fn(() => {
      selected = [];
    });
    const c = {
      ...composer(),
      selection: { getSelectedIds: () => selected, clear },
    } as unknown as Composer;
    render(<LayersTab composer={c} onClose={onClose} />);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(clear).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("4418:79546 — the count footer carries the ⓘ dim-scope explainer", () => {
    render(<LayersTab composer={null} />);
    expect(screen.getByLabelText("About dimmed layers")).toBeTruthy();
  });

  it("the 700 wide view survives as a ⋯ row (no header button on the v3 board)", () => {
    const onExpandToggle = vi.fn();
    render(<LayersTab composer={null} isExpanded={false} onExpandToggle={onExpandToggle} />);
    fireEvent.click(screen.getByTestId("layers-panel-menu"));
    fireEvent.click(screen.getByTestId("layers-wide-view"));
    expect(screen.queryByTestId("layers-wide-view")).toBeNull();
    expect(onExpandToggle).toHaveBeenCalledTimes(1);
  });

  it("⋯ opens Expand all · Collapse all · Display settings…", () => {
    render(<LayersTab composer={null} />);
    expect(screen.queryByTestId("layers-expand-all")).toBeNull();
    fireEvent.click(screen.getByTestId("layers-panel-menu"));
    expect(screen.getByRole("menu", { name: "Layers options" })).toBeTruthy();
    expect(screen.getByTestId("layers-expand-all")).toHaveTextContent("Expand all");
    expect(screen.getByTestId("layers-collapse-all")).toHaveTextContent("Collapse all");
    expect(screen.getByTestId("layers-display-settings-toggle")).toHaveTextContent("Display settings…");
  });

  it("Expand all / Collapse all reach the tree through the composer, and the menu closes", () => {
    const c = composer();
    render(<LayersTab composer={c} />);
    fireEvent.click(screen.getByTestId("layers-panel-menu"));
    fireEvent.click(screen.getByTestId("layers-expand-all"));
    expect(c.emit).toHaveBeenCalledWith("layers:expand-all", {});
    expect(screen.queryByTestId("layers-expand-all")).toBeNull();
    fireEvent.click(screen.getByTestId("layers-panel-menu"));
    fireEvent.click(screen.getByTestId("layers-collapse-all"));
    expect(c.emit).toHaveBeenCalledWith("layers:collapse-all", {});
  });
});
