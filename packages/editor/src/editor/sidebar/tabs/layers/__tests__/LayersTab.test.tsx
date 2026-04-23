// @vitest-environment jsdom
/**
 * LayersTab — tests for Pencil screens R6Odi, IR82U, R4Pf4, uHSyK alignment
 */

import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LayerSelectionBanner } from "../../../../panels/layers/components/LayerSelectionBanner";

// Mock the canonical PanelHeader source so the @shared/ui/PanelHeader alias
// resolves in the test env (alias works but the real file may import Emotion
// or other deps that break under jsdom).
vi.mock("@shared/ui/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "panel-header" }, title);
  },
  HeaderActions: () => null,
  default: ({ title }: { title: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "panel-header" }, title);
  },
}));

vi.mock("@/editor/sidebar/shared/PanelHeader", () => ({
  PanelHeader: ({ title }: { title: string }) => {
    const React = require("react");
    return React.createElement("div", { "data-testid": "panel-header" }, title);
  },
  HeaderActions: () => null,
}));

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

// ─── Selection synced banner (Screen uHSyK) ───────────────────────────────────

describe("LayersTab selection synced banner", () => {
  let listeners: Map<string, ((...args: unknown[]) => void)[]>;

  function makeMockComposer() {
    listeners = new Map();
    return {
      on: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        const list = listeners.get(event) ?? [];
        list.push(cb);
        listeners.set(event, list);
      }),
      off: vi.fn((event: string, cb: (...args: unknown[]) => void) => {
        const list = listeners.get(event) ?? [];
        listeners.set(event, list.filter((fn) => fn !== cb));
      }),
      emit: vi.fn((event: string, data: unknown) => {
        (listeners.get(event) ?? []).forEach((fn) => fn(data));
      }),
      elements: {
        getAll: vi.fn(() => []),
        getElement: vi.fn(() => null),
        getActivePage: vi.fn(() => null),
      },
      selection: {
        getSelected: vi.fn(() => null),
        getAllSelected: vi.fn(() => []),
        getSelectedIds: vi.fn(() => new Set()),
        reselect: vi.fn(),
      },
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not show sync banner initially", () => {
    const composer = makeMockComposer();
    render(<LayersTab composer={composer as never} />);
    expect(screen.queryByText("Selection synced from canvas")).toBeNull();
  });

  it("shows sync banner after element:selected event fires", () => {
    const composer = makeMockComposer();
    render(<LayersTab composer={composer as never} />);

    act(() => {
      composer.emit("element:selected", { element: {} });
    });

    expect(screen.getByText("Selection synced from canvas")).toBeTruthy();
  });

  it("hides sync banner after 2.5 seconds", () => {
    const composer = makeMockComposer();
    render(<LayersTab composer={composer as never} />);

    act(() => {
      composer.emit("element:selected", { element: {} });
    });

    expect(screen.getByText("Selection synced from canvas")).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    expect(screen.queryByText("Selection synced from canvas")).toBeNull();
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
