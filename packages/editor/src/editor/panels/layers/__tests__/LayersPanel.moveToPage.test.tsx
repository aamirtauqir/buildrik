/**
 * Layers "Move to page…" (boards 4418:79546 menu row → 4418:82847 picker):
 * the element leaves the active page and lands at the END of the chosen
 * page's root, in one transaction, so one Undo puts it back.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { ToastProvider } from "@/editor/chrome-ui";
import { Composer } from "@/engine";
import { LayersPanel } from "../index";

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
afterEach(cleanup);

const root = (id: string) => ({ id, type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] });

function mount(): Composer {
  const c = new Composer({} as never);
  const home = c.elements.createPage("Home", { id: "mv-home", root: root("mv-root-home") as never });
  const menu = c.elements.createPage("Menu", { id: "mv-menu", root: root("mv-root-menu") as never });
  c.elements.addElement(c.elements.createElement("heading" as never, { id: "mv-dish", content: "Dish" }), menu.root.id);
  c.elements.setActivePage(home.id);
  for (const id of ["mv-heading", "mv-footer"]) {
    c.elements.addElement(c.elements.createElement("heading" as never, { id, content: id }), home.root.id);
  }
  c.history.flushPending();
  render(
    <ToastProvider>
      <LayersPanel composer={c} selectedElement={null} />
    </ToastProvider>,
  );
  return c;
}

const kids = (c: Composer, rootId: string) => c.elements.getElement(rootId)?.getChildren().map((e) => e.getId()) ?? [];

describe("LayersPanel — Move to page…", () => {
  it("lists the OTHER pages, moves to the end of the chosen one, and one Undo brings it back", () => {
    const c = mount();
    fireEvent.contextMenu(screen.getByTestId("layer-row-mv-heading"));
    fireEvent.click(screen.getByTestId("layer-menu-move-to-page"));

    const dialog = screen.getByTestId("layers-move-to-page");
    expect(dialog).toHaveTextContent("The element leaves Home and is placed at the end of the chosen page.");
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(1);
    expect(radios[0]).toBeChecked();
    expect(dialog).toHaveTextContent("Menu");

    act(() => {
      fireEvent.click(screen.getByTestId("layers-move-to-page-confirm"));
    });
    expect(kids(c, "mv-root-home")).toEqual(["mv-footer"]);
    expect(kids(c, "mv-root-menu")).toEqual(["mv-dish", "mv-heading"]);
    expect(screen.queryByTestId("layers-move-to-page")).toBeNull();

    act(() => {
      c.history.undo();
    });
    expect(kids(c, "mv-root-home")).toEqual(["mv-heading", "mv-footer"]);
    expect(kids(c, "mv-root-menu")).toEqual(["mv-dish"]);
  });

  it("Cancel moves nothing", () => {
    const c = mount();
    fireEvent.contextMenu(screen.getByTestId("layer-row-mv-footer"));
    fireEvent.click(screen.getByTestId("layer-menu-move-to-page"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByTestId("layers-move-to-page")).toBeNull();
    expect(kids(c, "mv-root-home")).toEqual(["mv-heading", "mv-footer"]);
  });
});
