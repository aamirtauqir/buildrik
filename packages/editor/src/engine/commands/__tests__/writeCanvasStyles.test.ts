// @vitest-environment jsdom
/**
 * Canvas-direct style writes (resize handles, keyboard resize, spacing spots,
 * keyboard nudge) honour the active breakpoint and the lock gate — audit
 * 2026-10-08 P1-2 / P1-3. All of them wrote the element's BASE styles at
 * every device, so a resize on Tablet changed Desktop too, and none of them
 * asked whether the element was locked. The Inspector already wrote
 * breakpoint overrides (`styles.setBreakpointStyle`); the canvas now goes
 * through the same branch (`setStyleAt`) via `writeCanvasStyles`.
 *
 * A REAL Composer: the breakpoint rule lives in the StyleEngine and the
 * active device in the Viewport, so a double would prove nothing.
 *
 * @license BSD-3-Clause
 */
import { beforeAll, describe, it, expect, vi } from "vitest";
import { Composer } from "../../Composer";
import { EVENTS } from "@/shared/constants/events";
import { activeBreakpoint, stylesAt, writeCanvasStyles } from "../commandOperations";
import { applyBoundsToModel } from "../../canvas/resize/DOMUpdater";

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
          { id: "box", type: "container", tagName: "div", children: [], styles: { width: "400px", position: "absolute", top: "10px", left: "20px" } },
        ],
      },
    }],
  } as never);
  composer.history.flushPending();
  return composer;
}

const box = (c: Composer) => c.elements.getElement("box")!;

describe("activeBreakpoint", () => {
  it("is the composer's device; wide has no override layer and writes the base", () => {
    const c = load();
    expect(activeBreakpoint(c)).toBe("desktop");
    c.setDevice("tablet");
    expect(activeBreakpoint(c)).toBe("tablet");
    c.setDevice("mobile");
    expect(activeBreakpoint(c)).toBe("mobile");
    c.setDevice("wide");
    expect(activeBreakpoint(c)).toBe("desktop");
  });
});

describe("writeCanvasStyles", () => {
  it("on Desktop writes the base styles in one undo step", () => {
    const c = load();
    expect(writeCanvasStyles(c, box(c), "resize-element", { width: "300px", height: "90px" })).toBe(true);
    expect(box(c).getStyle("width")).toBe("300px");
    expect(box(c).getStyle("height")).toBe("90px");
    c.history.flushPending();
    c.history.undo();
    expect(box(c).getStyle("width")).toBe("400px");
    expect(box(c).getStyle("height")).toBeUndefined();
  });

  it("on Tablet writes the tablet override and leaves Desktop alone", () => {
    const c = load();
    c.setDevice("tablet");
    writeCanvasStyles(c, box(c), "resize-element", { width: "300px" });
    expect(box(c).getStyle("width")).toBe("400px");
    expect(c.styles.getBreakpointStyle("box", "tablet")).toMatchObject({ width: "300px" });
    expect(stylesAt(c, box(c), "tablet").width).toBe("300px");
    expect(stylesAt(c, box(c), "desktop").width).toBe("400px");
  });

  it("refuses a locked element, writes nothing and raises the locked signal", () => {
    const c = load();
    box(c).setLocked(true);
    const skipped = vi.fn();
    c.on(EVENTS.LOCKED_ELEMENTS_SKIPPED, skipped);
    expect(writeCanvasStyles(c, box(c), "resize-element", { width: "300px" })).toBe(false);
    expect(box(c).getStyle("width")).toBe("400px");
    expect(skipped).toHaveBeenCalledTimes(1);
  });
});

describe("applyBoundsToModel (resize handles + keyboard resize)", () => {
  it("on Mobile writes the size to the mobile override, not the base", () => {
    const c = load();
    c.setDevice("mobile");
    applyBoundsToModel("box", { x: 5, y: 6, width: 200, height: 50 }, c);
    expect(box(c).getStyle("width")).toBe("400px");
    expect(c.styles.getBreakpointStyle("box", "mobile")).toMatchObject({ width: "200px", height: "50px", left: "5px", top: "6px" });
  });

  it("leaves a locked element as it was", () => {
    const c = load();
    box(c).setLocked(true);
    applyBoundsToModel("box", { x: 0, y: 0, width: 200, height: 50 }, c);
    expect(box(c).getStyle("width")).toBe("400px");
  });
});
