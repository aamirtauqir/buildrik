// @vitest-environment jsdom
/**
 * Layers display options — owner decision 18 (2026-09-21): the option set is
 * Figma's (board 4418:84113: Show dimmed layers · Show lock badges · Compact
 * rows · Highlight CMS-bound) plus Show HTML tags. "Show element IDs" is
 * gone. Each option changes the tree, on a real Composer.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine";
import { LayersPanel } from "../index";
import { LayerDisplaySettings } from "../components/LayerDisplaySettings";
import type { LayerDisplayPrefs } from "../types";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
  Object.defineProperty(globalThis.window, "matchMedia", {
    writable: true,
    value: vi.fn((q: string) => ({
      matches: false, media: q, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(),
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

const DEFAULTS: LayerDisplayPrefs = {
  showDimmed: true,
  showLockBadges: true,
  treeDensity: "compact",
  highlightCmsBound: false,
  showHtmlBadges: false,
};

describe("LayerDisplaySettings — the option rows", () => {
  it("offers exactly the board's four plus HTML tags, in that order; no element IDs", () => {
    render(<LayerDisplaySettings prefs={DEFAULTS} onChange={vi.fn()} onClose={vi.fn()} />);
    const labels = screen.getAllByRole("checkbox").map((el) => el.getAttribute("aria-label"));
    expect(labels).toEqual([
      "Show dimmed layers",
      "Show lock badges",
      "Compact row density",
      "Highlight CMS-bound layers",
      "Show HTML tags",
    ]);
    expect(screen.queryByText(/element IDs/)).toBeNull();
  });

  it("each row writes its own key", () => {
    const onChange = vi.fn();
    render(<LayerDisplaySettings prefs={DEFAULTS} onChange={onChange} onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Show dimmed layers"));
    expect(onChange).toHaveBeenLastCalledWith({ showDimmed: false });
    fireEvent.click(screen.getByLabelText("Show lock badges"));
    expect(onChange).toHaveBeenLastCalledWith({ showLockBadges: false });
    fireEvent.click(screen.getByLabelText("Highlight CMS-bound layers"));
    expect(onChange).toHaveBeenLastCalledWith({ highlightCmsBound: true });
    fireEvent.click(screen.getByLabelText("Show HTML tags"));
    expect(onChange).toHaveBeenLastCalledWith({ showHtmlBadges: true });
  });
});

function seeded(): Composer {
  const c = new Composer({} as never);
  const page = c.elements.createPage("Home", {
    id: "lx-page",
    root: { id: "lx-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
  });
  c.elements.setActivePage(page.id);
  for (const [id, type, name] of [["lx-heading", "heading", "Heading"], ["lx-text", "text", "Subtitle"]] as const) {
    const el = c.elements.createElement(type as never, { id, content: name });
    c.elements.addElement(el, page.root.id);
  }
  return c;
}

function mountPanel(composer: Composer) {
  render(
    <ToastProvider>
      <LayersPanel composer={composer} selectedElement={null} displaySettingsOpen />
    </ToastProvider>,
  );
}

describe("LayersPanel — the options change the tree", () => {
  it("Show dimmed layers off hides a dimmed row; on brings it back", () => {
    mountPanel(seeded());
    fireEvent.click(screen.getByTestId("layer-eye-lx-text"));
    expect(screen.getByTestId("layer-row-lx-text").className).toMatch(/bdc-hidden/);
    fireEvent.click(screen.getByLabelText("Show dimmed layers"));
    expect(screen.queryByTestId("layer-row-lx-text")).toBeNull();
    expect(screen.getByTestId("layer-row-lx-heading")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Show dimmed layers"));
    expect(screen.getByTestId("layer-row-lx-text")).toBeInTheDocument();
  });

  it("Show lock badges off hides the lock on unlocked rows and keeps it on locked ones", () => {
    mountPanel(seeded());
    fireEvent.click(screen.getByTestId("layer-lock-lx-heading"));
    fireEvent.click(screen.getByLabelText("Show lock badges"));
    expect(screen.queryByTestId("layer-lock-lx-text")).toBeNull();
    expect(screen.getByTestId("layer-lock-lx-heading")).toBeInTheDocument();
  });

  it("Highlight CMS-bound tints only the rows with a binding", () => {
    const composer = seeded();
    act(() => {
      composer.cms.bindings.bindToField("lx-heading", "col-1", undefined, "title", "text");
    });
    mountPanel(composer);
    expect(screen.getByTestId("layer-row-lx-heading").className).not.toMatch(/bdc-cms-bound/);
    fireEvent.click(screen.getByLabelText("Highlight CMS-bound layers"));
    expect(screen.getByTestId("layer-row-lx-heading").className).toMatch(/bdc-cms-bound/);
    expect(screen.getByTestId("layer-cms-badge-lx-heading")).toBeInTheDocument();
    expect(screen.getByTestId("layer-row-lx-text").className).not.toMatch(/bdc-cms-bound/);
  });

  it("Show HTML tags adds the tag badge", () => {
    mountPanel(seeded());
    expect(screen.queryByText("h1")).toBeNull();
    fireEvent.click(screen.getByLabelText("Show HTML tags"));
    expect(screen.getByText(/^h[1-6]$/)).toBeInTheDocument();
  });
});
