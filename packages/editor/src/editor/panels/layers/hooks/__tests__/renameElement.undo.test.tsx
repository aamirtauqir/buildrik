// @vitest-environment jsdom
/**
 * L2-013 (editor audit 2026-10-08): a layer rename was reported as not undoable.
 * Pinned here: rename is one undo step and redo puts it back. A real Composer — the bug lives in how the
 * write meets the history manager.
 * @license BSD-3-Clause
 */
import { describe, it, expect, beforeAll } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLayerActions } from "../useLayerActions";
import { Composer } from "@/engine";
import { LAYER_NAME_KEY } from "@/shared/constants/elementTypeLabels";
import { renameElement } from "../layersPersistence";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

describe("renameElement — undo", () => {
  it("⌘Z reverts a layer rename", () => {
    const c = new Composer({} as never);
    const page = c.elements.createPage("Home", {
      id: "rn-page",
      root: { id: "rn-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
    });
    c.elements.setActivePage(page.id);
    c.elements.addElement(c.elements.createElement("section" as never, { id: "rn-hero" }), page.root.id);
    c.history.flushPending();

    renameElement(c, "rn-hero", "Hero");
    c.history.flushPending();
    expect(c.elements.getElement("rn-hero")!.getCustomData(LAYER_NAME_KEY)).toBe("Hero");

    c.history.undo();
    expect(c.elements.getElement("rn-hero")!.getCustomData(LAYER_NAME_KEY)).toBeUndefined();
    c.history.redo();
    expect(c.elements.getElement("rn-hero")!.getCustomData(LAYER_NAME_KEY)).toBe("Hero");
  });

  /* Live 2026-10-09: the engine reverted, but the Layers row kept the new
     name — customNames only followed ELEMENT_RENAMED, which undo never fires. */
  it("the Layers row name follows an undo and a redo", () => {
    const c = new Composer({} as never);
    const page = c.elements.createPage("Home", {
      id: "rn-page",
      root: { id: "rn-root", type: "container", tagName: "div", classes: ["buildrick-page-root"], children: [] },
    });
    c.elements.setActivePage(page.id);
    c.elements.addElement(c.elements.createElement("section" as never, { id: "rn-hero" }), page.root.id);
    c.history.flushPending();
    const { result } = renderHook(() => useLayerActions(c, page.id));
    act(() => renameElement(c, "rn-hero", "Hero"));
    c.history.flushPending();
    expect(result.current.customNames.get("rn-hero")).toBe("Hero");
    act(() => c.history.undo());
    expect(result.current.customNames.get("rn-hero")).toBeUndefined();
    act(() => c.history.redo());
    expect(result.current.customNames.get("rn-hero")).toBe("Hero");
  });
});
