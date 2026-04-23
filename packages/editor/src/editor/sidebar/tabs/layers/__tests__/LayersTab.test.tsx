// @vitest-environment jsdom
/**
 * LayersTab — tests for Pencil screens R6Odi, IR82U, R4Pf4, uHSyK alignment
 */

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { LayerSelectionBanner } from "../../../../panels/layers/components/LayerSelectionBanner";

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

// ─── LayerSelectionBanner (Screen R4Pf4 — multi-select action bar) ────────────

describe("LayerSelectionBanner", () => {
  it("renders nothing when count < 2", () => {
    const { container } = render(
      <LayerSelectionBanner
        count={1}
        onGroup={vi.fn()}
        onHide={vi.fn()}
        onDelete={vi.fn()}
        onExit={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows selection count when 2+ layers selected", () => {
    render(
      <LayerSelectionBanner
        count={3}
        onGroup={vi.fn()}
        onHide={vi.fn()}
        onDelete={vi.fn()}
        onExit={vi.fn()}
      />
    );
    expect(screen.getByText("3 selected")).toBeTruthy();
  });

  it("calls onGroup when Group button is clicked", () => {
    const onGroup = vi.fn();
    render(
      <LayerSelectionBanner
        count={2}
        onGroup={onGroup}
        onHide={vi.fn()}
        onDelete={vi.fn()}
        onExit={vi.fn()}
      />
    );
    screen.getByRole("button", { name: "Group" }).click();
    expect(onGroup).toHaveBeenCalledTimes(1);
  });

  it("calls onDelete when Delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <LayerSelectionBanner
        count={2}
        onGroup={vi.fn()}
        onHide={vi.fn()}
        onDelete={onDelete}
        onExit={vi.fn()}
      />
    );
    screen.getByRole("button", { name: "Delete" }).click();
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("calls onExit when Done button is clicked", () => {
    const onExit = vi.fn();
    render(
      <LayerSelectionBanner
        count={2}
        onGroup={vi.fn()}
        onHide={vi.fn()}
        onDelete={vi.fn()}
        onExit={onExit}
      />
    );
    screen.getByRole("button", { name: "Done" }).click();
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
