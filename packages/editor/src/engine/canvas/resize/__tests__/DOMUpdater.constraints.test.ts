/**
 * Resize must not store a size the element cannot have.
 *
 * The browser clamps the rendered box against the element's own min/max, so a
 * card with `max-width: 320px` stops growing on screen while the drag keeps
 * going — and the model stored the overshoot. Measured live at 1440x900:
 * dragging the bottom-right handle wrote `width: 380px` onto an element that
 * stayed 320px wide, so the inspector read 380 for a 320px card.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { applyBoundsToModel } from "../DOMUpdater";

function makeElement(styles: Record<string, string>) {
  const written: Record<string, string> = {};
  return {
    written,
    el: {
      getStyle: (prop: string) => styles[prop],
      setStyle: (prop: string, value: string) => {
        written[prop] = value;
      },
    },
  };
}

function makeComposer(el: unknown) {
  return {
    elements: { getElement: vi.fn(() => el) },
    markDirty: vi.fn(),
  } as unknown as Parameters<typeof applyBoundsToModel>[2];
}

const bounds = (width: number, height: number) => ({ x: 0, y: 0, width, height });

describe("applyBoundsToModel — the stored size honours the element's own constraints", () => {
  it("does not store a width past max-width", () => {
    const { written, el } = makeElement({ "max-width": "320px" });
    applyBoundsToModel("el-1", bounds(380, 202), makeComposer(el));
    expect(written.width).toBe("320px");
    expect(written.height).toBe("202px");
  });

  it("does not store a height past max-height", () => {
    const { written, el } = makeElement({ "max-height": "150px" });
    applyBoundsToModel("el-1", bounds(380, 202), makeComposer(el));
    expect(written.height).toBe("150px");
  });

  it("does not store a width below min-width", () => {
    const { written, el } = makeElement({ "min-width": "200px" });
    applyBoundsToModel("el-1", bounds(120, 90), makeComposer(el));
    expect(written.width).toBe("200px");
  });

  it("leaves a size inside the constraints exactly as dragged", () => {
    const { written, el } = makeElement({ "max-width": "600px", "min-width": "100px" });
    applyBoundsToModel("el-1", bounds(380, 202), makeComposer(el));
    expect(written.width).toBe("380px");
  });

  it("ignores constraints in units it cannot resolve rather than guessing", () => {
    for (const value of ["50%", "20em", "60vw", "calc(100% - 2rem)"]) {
      const { written, el } = makeElement({ "max-width": value });
      applyBoundsToModel("el-1", bounds(380, 202), makeComposer(el));
      expect(`${value} → ${written.width}`).toBe(`${value} → 380px`);
    }
  });

  it("still writes left/top for an absolutely positioned element", () => {
    const { written, el } = makeElement({ position: "absolute", "max-width": "320px" });
    applyBoundsToModel("el-1", { x: 12, y: 34, width: 380, height: 202 }, makeComposer(el));
    expect(written.width).toBe("320px");
    expect(written.left).toBe("12px");
    expect(written.top).toBe("34px");
  });
});
