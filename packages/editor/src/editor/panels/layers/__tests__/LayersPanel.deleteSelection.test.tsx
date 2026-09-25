// @vitest-environment jsdom
/**
 * LayersPanel — deleting a multi-selection (boards 6881:71323 → 6887:78291 →
 * 6881:71749; audit G2-068, decision 17).
 *
 * The selection banner and its inline "Delete 3 layers?" strip are gone. With
 * three rows selected, the context menu on one of them reads "Delete · 3
 * elements"; choosing it opens the one confirm ("Delete 3 elements?" · "This
 * removes A, B and C." · Cancel · "Delete 3 elements"); confirming runs the
 * engine's delete (one transaction) and toasts "3 elements deleted" with
 * Undo. One selected row deletes at once, no dialog.
 *
 * A REAL Composer: the panel reaches the engine through seven hooks, and a
 * stub wide enough for all of them would be a second engine.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine";
import { LayersPanel } from "../index";

beforeAll(() => {
  /* A real Composer builds MediaManager → MediaOptimizer, which wants a 2d
     canvas context jsdom does not have (same stub the engine's own
     Composer tests carry). */
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
afterEach(cleanup);

const SEED = [
  { id: "lx-heading", type: "heading", name: "Heading" },
  { id: "lx-subtitle", type: "text", name: "Subtitle" },
  { id: "lx-menu", type: "container", name: "Menu previews" },
  { id: "lx-footer", type: "container", name: "Footer" },
];

function seeded(): Composer {
  const c = new Composer({} as never);
  const page = c.elements.createPage("Home", {
    id: "lx-page",
    root: { id: "lx-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
  });
  c.elements.setActivePage(page.id);
  for (const s of SEED) {
    const el = c.elements.createElement(s.type as never, { id: s.id, content: s.name });
    c.elements.addElement(el, page.root.id);
  }
  /* History coalesces rapid changes (~500 ms); the seed must be its own step
     before the delete is (engine/AGENTS.md). */
  c.history.flushPending();
  return c;
}

function mount(select: string[]) {
  const composer = seeded();
  act(() => {
    if (select.length > 1) {
      composer.selection.selectMultiple(select.map((id) => composer.elements.getElement(id)!));
    } else if (select.length === 1) {
      composer.selection.select(composer.elements.getElement(select[0])!);
    }
  });
  render(
    <ToastProvider>
      <LayersPanel composer={composer} selectedElement={null} />
    </ToastProvider>,
  );
  return composer;
}

/* The registry is the truth after undo (the page's data snapshot lags). */
const count = (c: Composer) => c.elements.getElement("lx-root")?.getChildren().length ?? -1;

describe("LayersPanel — delete a multi-selection", () => {
  it("the selection's menu names the count and Delete asks first, with the names", () => {
    const composer = mount(["lx-heading", "lx-subtitle", "lx-menu"]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-subtitle"));
    expect(screen.getByTestId("layer-menu-delete")).toHaveTextContent("Delete · 3 elements");
    fireEvent.click(screen.getByTestId("layer-menu-delete"));

    const dialog = screen.getByTestId("layers-delete-selection");
    expect(dialog).toHaveTextContent("Delete 3 elements?");
    expect(dialog).toHaveTextContent(/This removes Heading, Subtitle and Container \(and anything nested inside them\) from .+\. You can undo from the toast\./);
    expect(screen.getByTestId("layers-delete-selection-confirm")).toHaveTextContent("Delete 3 elements");
    // nothing has gone yet
    expect(count(composer)).toBe(4);
  });

  it("confirming removes all three in one undo step and toasts with Undo", () => {
    const composer = mount(["lx-heading", "lx-subtitle", "lx-menu"]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-subtitle"));
    fireEvent.click(screen.getByTestId("layer-menu-delete"));
    act(() => {
      fireEvent.click(screen.getByTestId("layers-delete-selection-confirm"));
    });
    expect(count(composer)).toBe(1);
    expect(screen.getByText("3 elements deleted")).toBeInTheDocument();

    // Live, Undo is pressed well after the 500 ms coalesce window.
    composer.history.flushPending();
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    });
    expect(count(composer)).toBe(4);
  });

  it("Cancel keeps everything", () => {
    const composer = mount(["lx-heading", "lx-subtitle"]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-heading"));
    fireEvent.click(screen.getByTestId("layer-menu-delete"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("layers-delete-selection")).toBeNull();
    expect(count(composer)).toBe(4);
  });

  it("one selected row deletes at once — no dialog (decision 17)", () => {
    const composer = mount(["lx-footer"]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    expect(screen.getByTestId("layer-menu-delete")).toHaveTextContent(/^Delete · [^0-9]/);
    act(() => {
      fireEvent.click(screen.getByTestId("layer-menu-delete"));
    });
    expect(screen.queryByTestId("layers-delete-selection")).toBeNull();
    expect(count(composer)).toBe(3);
  });

  it("a row outside the selection gets its own single-row menu", () => {
    mount(["lx-heading", "lx-subtitle"]);
    fireEvent.contextMenu(screen.getByTestId("layer-row-lx-footer"));
    expect(screen.getByTestId("layer-menu-delete")).toHaveTextContent(/^Delete · [^0-9]/);
  });
});
