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

  it("the toolbar carries only the search box — no ⊞ ⊟ ⚙ glyphs", () => {
    render(<LayersTab composer={null} />);
    expect(screen.getByLabelText("Search layers")).toBeTruthy();
    expect(screen.queryByLabelText("Expand all layers")).toBeNull();
    expect(screen.queryByLabelText("Layer display settings")).toBeNull();
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
