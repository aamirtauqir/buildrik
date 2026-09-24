/**
 * Layers drag — walk 2026-09-24: top-level rows could not be dragged
 * (`depth > 0`), and Chromium's null-relatedTarget dragleave from a row's own
 * children cleared the drop line while the pointer was still on the row.
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
  const home = c.elements.createPage("Home", { id: "dg-home", root: root("dg-root") as never });
  c.elements.setActivePage(home.id);
  for (const id of ["dg-a", "dg-b"]) {
    c.elements.addElement(c.elements.createElement("container" as never, { id }), home.root.id);
  }
  c.history.flushPending();
  render(
    <ToastProvider>
      <LayersPanel composer={c} selectedElement={null} />
    </ToastProvider>,
  );
  return c;
}


/* A workspace VIEWER opens the editor in view mode (?view=readonly), and board
   4418:126059 draws Layers for them — for inspection: rows select and expand,
   but nothing drags, renames, opens the context menu, dims or locks. */
describe("LayersPanel — view mode is read-only", () => {
  afterEach(() => window.history.replaceState(null, "", "/"));

  it("rows select but do not drag, rename, open a menu, or show eye / lock", () => {
    window.history.replaceState(null, "", "/?view=readonly");
    const c = mount();
    const row = screen.getByTestId("layer-row-dg-a");
    expect(row).toHaveAttribute("draggable", "false");
    expect(screen.queryByTestId("layer-eye-dg-a")).toBeNull();
    expect(screen.queryByTestId("layer-lock-dg-a")).toBeNull();
    fireEvent.doubleClick(row);
    expect(screen.queryByTestId("layer-name-edit-dg-a")).toBeNull();
    fireEvent.contextMenu(row);
    expect(screen.queryByRole("menu")).toBeNull();
    act(() => {
      fireEvent.click(row);
    });
    expect(c.selection.getSelected()?.getId()).toBe("dg-a");
  });

  it("outside view mode the same row keeps its eye and drags", () => {
    mount();
    expect(screen.getByTestId("layer-row-dg-a")).toHaveAttribute("draggable", "true");
    expect(screen.getByTestId("layer-eye-dg-a")).toBeInTheDocument();
  });
});
