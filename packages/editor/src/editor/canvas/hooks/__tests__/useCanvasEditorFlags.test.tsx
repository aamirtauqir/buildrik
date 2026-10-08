// @vitest-environment jsdom
/**
 * Editor-only canvas flags — `data-locked` (lock styling) and `data-hidden`
 * (the Layers eye) — survive the canvas re-rendering its HTML (audit
 * 2026-10-08 P1-5). The canvas body is `dangerouslySetInnerHTML`, rebuilt on
 * every document edit, and the engine serializer emits neither attribute; the
 * Layers panel poked them onto DOM nodes and re-applied only on a page switch.
 * So any edit un-hid a hidden layer and dropped the lock styling, and the
 * canvas-menu Lock never set it at all.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { beforeAll, beforeEach, describe, it, expect } from "vitest";
import { render, act } from "@testing-library/react";
import { Composer } from "@/engine/Composer";
import { saveSetToStorage } from "@/editor/panels/layers/hooks/layersPersistence";
import { useCanvasEditorFlags } from "../useCanvasEditorFlags";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

beforeEach(() => localStorage.clear());

function load(): Composer {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [
          { id: "a", type: "text", tagName: "p", content: "A", children: [] },
          { id: "b", type: "text", tagName: "p", content: "B", children: [] },
        ],
      },
    }],
  } as never);
  composer.elements.setActivePage("p");
  return composer;
}

function Harness({ composer, html }: { composer: Composer; html: string }) {
  const canvasRef = React.useRef<HTMLDivElement>(null);
  useCanvasEditorFlags({ canvasRef, composer, content: html });
  return <div ref={canvasRef} dangerouslySetInnerHTML={{ __html: html }} />;
}

const html = (text: string) => `<div data-buildrick-id="root"><p data-buildrick-id="a">${text}</p><p data-buildrick-id="b">B</p></div>`;
const node = (container: HTMLElement, id: string) => container.querySelector(`[data-buildrick-id="${id}"]`)!;

describe("useCanvasEditorFlags", () => {
  it("a locked element carries data-locked, and keeps it after the canvas re-renders", () => {
    const c = load();
    c.elements.getElement("a")!.setLocked(true);
    const { container, rerender } = render(<Harness composer={c} html={html("A")} />);
    expect(node(container, "a").getAttribute("data-locked")).toBe("true");
    expect(node(container, "b").hasAttribute("data-locked")).toBe(false);

    rerender(<Harness composer={c} html={html("A edited")} />);
    expect(node(container, "a").getAttribute("data-locked")).toBe("true");
  });

  it("a lock or unlock from anywhere (the canvas menu included) shows at once", () => {
    const c = load();
    const { container } = render(<Harness composer={c} html={html("A")} />);
    act(() => c.elements.getElement("b")!.setLocked(true));
    expect(node(container, "b").getAttribute("data-locked")).toBe("true");
    act(() => c.elements.getElement("b")!.setLocked(false));
    expect(node(container, "b").hasAttribute("data-locked")).toBe(false);
  });

  it("a layer hidden from Layers stays hidden after the canvas re-renders", () => {
    const c = load();
    saveSetToStorage("p", "hidden", new Set(["b"]));
    const { container, rerender } = render(<Harness composer={c} html={html("A")} />);
    expect(node(container, "b").getAttribute("data-hidden")).toBe("true");

    rerender(<Harness composer={c} html={html("A edited")} />);
    expect(node(container, "b").getAttribute("data-hidden")).toBe("true");
    expect(node(container, "a").hasAttribute("data-hidden")).toBe(false);
  });
});
