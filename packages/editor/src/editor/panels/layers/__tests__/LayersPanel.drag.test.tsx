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

const ROW_BOX = { left: 0, top: 0, right: 280, bottom: 28, width: 280, height: 28, x: 0, y: 0, toJSON: () => ({}) };

describe("LayersPanel — drag (walk 2026-09-24)", () => {
  it("top-level rows (the page root's children) are draggable", () => {
    mount();
    expect(screen.getByTestId("layer-row-dg-a")).toHaveAttribute("draggable", "true");
    expect(screen.getByTestId("layer-row-dg-b")).toHaveAttribute("draggable", "true");
  });

  it("a dragleave from the row's own child (null relatedTarget, pointer still inside) keeps the drop line", () => {
    mount();
    const a = screen.getByTestId("layer-row-dg-a");
    const b = screen.getByTestId("layer-row-dg-b");
    b.getBoundingClientRect = () => ROW_BOX as DOMRect;
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(), effectAllowed: "", dropEffect: "", setDragImage: vi.fn(), types: [] };
    fireEvent.dragStart(a, { dataTransfer });
    /* jsdom's fireEvent drag events carry no coordinates — a MouseEvent of
       the drag type does, and React reads them off it. */
    const at = (type: string, clientY: number) =>
      act(() => {
        b.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: 100, clientY }));
      });
    at("dragover", 3);
    expect(b).toHaveAttribute("data-drop", "before");
    at("dragleave", 5); // a child's leave, pointer still on the row
    expect(b).toHaveAttribute("data-drop", "before");
    at("dragleave", 40); // really left
    expect(b).not.toHaveAttribute("data-drop");
  });
});
