// @vitest-environment jsdom
/**
 * Keyboard nudge, ⌥-arrow reorder and the spacing spot honour the active
 * breakpoint and the lock gate (audit 2026-10-08 P1-2 / P1-3). They wrote the
 * base styles at every device and never asked about the lock.
 *
 * A REAL Composer — the breakpoint override lives in the StyleEngine.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { Composer } from "@/engine/Composer";
import { EVENTS } from "@/shared/constants/events";
import type { SpacingIndicator } from "@/shared/types/canvas";
import { moveElementPosition, reorderElement } from "../keyboardHelpers";
import { CanvasSpotSpacing } from "../../../spots/CanvasSpotSpacing";

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = (() => ({
    drawImage: () => {}, getImageData: () => ({ data: new Uint8ClampedArray() }),
    putImageData: () => {}, clearRect: () => {},
  })) as unknown as HTMLCanvasElement["getContext"];
  (globalThis as { indexedDB?: unknown }).indexedDB = { open: () => ({}) };
});

function load(): Composer {
  const composer = new Composer({} as never);
  composer.importProject({
    pages: [{
      id: "p", name: "Home", slug: "", isHome: true,
      root: {
        id: "root", type: "container", tagName: "div",
        children: [
          { id: "a", type: "container", tagName: "div", children: [], styles: {} },
          { id: "box", type: "container", tagName: "div", children: [], styles: { position: "absolute", top: "10px", left: "20px", "padding-top": "8px" } },
        ],
      },
    }],
  } as never);
  composer.history.flushPending();
  return composer;
}

const box = (c: Composer) => c.elements.getElement("box")!;

describe("moveElementPosition (⌘/⇧ + arrows)", () => {
  it("on Tablet moves the tablet override, from the tablet position, and leaves Desktop alone", () => {
    const c = load();
    c.setDevice("tablet");
    c.styles.setBreakpointStyle("box", "tablet", { top: "100px" });
    expect(moveElementPosition(c, "box", 5, 1)).toBe(true);
    expect(c.styles.getBreakpointStyle("box", "tablet")).toMatchObject({ top: "101px", left: "25px" });
    expect(box(c).getStyle("top")).toBe("10px");
    expect(box(c).getStyle("left")).toBe("20px");
  });

  it("refuses a locked element with the locked signal — handled, so no in-flow hint", () => {
    const c = load();
    box(c).setLocked(true);
    const skipped = vi.fn();
    c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    expect(moveElementPosition(c, "box", 5, 5)).toBe(true);
    expect(box(c).getStyle("top")).toBe("10px");
    expect(skipped).toHaveBeenCalledTimes(1);
  });
});

describe("reorderElement (⌥ + arrows)", () => {
  it("does not move a locked element", () => {
    const c = load();
    box(c).setLocked(true);
    const skipped = vi.fn();
    c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    reorderElement(box(c), c, "box", "first");
    expect(c.elements.getElement("root")!.getChildren().map((el) => el.getId())).toEqual(["a", "box"]);
    expect(skipped).toHaveBeenCalledTimes(1);
  });
});

describe("CanvasSpotSpacing commit", () => {
  const indicator = { type: "padding", side: "top", value: 8, position: { x: 0, y: 0, width: 100, height: 80 } } as unknown as SpacingIndicator;

  function commit(c: Composer, value: string) {
    const { container } = render(<CanvasSpotSpacing composer={c} elementId="box" indicators={[indicator]} />);
    fireEvent.click(container.querySelector(".bd-spacing-indicator")!);
    const input = container.querySelector("input")!;
    fireEvent.change(input, { target: { value } });
    fireEvent.keyDown(input, { key: "Enter" });
  }

  it("on Mobile writes the mobile override", () => {
    const c = load();
    c.setDevice("mobile");
    commit(c, "24");
    expect(c.styles.getBreakpointStyle("box", "mobile")).toMatchObject({ "padding-top": "24px" });
    expect(box(c).getStyle("padding-top")).toBe("8px");
  });

  it("refuses a locked element", () => {
    const c = load();
    box(c).setLocked(true);
    commit(c, "24");
    expect(box(c).getStyle("padding-top")).toBe("8px");
  });
});
