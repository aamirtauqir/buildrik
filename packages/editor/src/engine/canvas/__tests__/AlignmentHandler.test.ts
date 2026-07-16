/**
 * AlignmentHandler tests — align + distribute over mocked composer elements.
 * Element mock pattern follows indicators/__tests__/BoundsCalculator.test.ts.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { AlignmentHandler } from "../AlignmentHandler";
import type { Composer } from "../../Composer";

interface MockElement {
  getStyles: ReturnType<typeof vi.fn>;
  setStyle: ReturnType<typeof vi.fn>;
}

function makeElement(styles: Record<string, string>): MockElement {
  return {
    getStyles: vi.fn(() => styles),
    setStyle: vi.fn(),
  };
}

function makeComposer(elements: Record<string, MockElement | undefined>) {
  const spies = {
    getElement: vi.fn((id: string) => elements[id]),
    beginTransaction: vi.fn(),
    endTransaction: vi.fn(),
  };
  const composer = {
    elements: { getElement: spies.getElement },
    beginTransaction: spies.beginTransaction,
    endTransaction: spies.endTransaction,
  } as unknown as Composer;
  return { composer, spies };
}

function styleValue(el: MockElement, prop: string): string | undefined {
  const call = el.setStyle.mock.calls.find(([p]) => p === prop);
  return call?.[1];
}

/** Standard 3-element fixture. */
function makeFixture() {
  const a = makeElement({ left: "10px", top: "10px", width: "100px", height: "50px" }); // right 110, bottom 60
  const b = makeElement({ left: "200px", top: "100px", width: "50px", height: "80px" }); // right 250, bottom 180
  const c = makeElement({ left: "50px", top: "300px", width: "150px", height: "20px" }); // right 200, bottom 320
  const { composer, spies } = makeComposer({ a, b, c });
  const handler = new AlignmentHandler(composer);
  return { a, b, c, handler, spies };
}

describe("alignHorizontal", () => {
  it("left: moves all elements to the leftmost edge", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignHorizontal(["a", "b", "c"], "left");

    expect(styleValue(a, "left")).toBe("10px");
    expect(styleValue(b, "left")).toBe("10px");
    expect(styleValue(c, "left")).toBe("10px");
    // horizontal alignment never touches top
    expect(styleValue(a, "top")).toBeUndefined();
  });

  it("center: centers each element on the midpoint of the group extent", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignHorizontal(["a", "b", "c"], "center");

    // extent: minLeft 10 .. maxRight 250 -> center 130
    expect(styleValue(a, "left")).toBe("80px"); // 130 - 100/2
    expect(styleValue(b, "left")).toBe("105px"); // 130 - 50/2
    expect(styleValue(c, "left")).toBe("55px"); // 130 - 150/2
  });

  it("right: aligns all right edges to the rightmost edge", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignHorizontal(["a", "b", "c"], "right");

    // rightmost edge = 250
    expect(styleValue(a, "left")).toBe("150px");
    expect(styleValue(b, "left")).toBe("200px");
    expect(styleValue(c, "left")).toBe("100px");
  });

  it("wraps the operation in an align-horizontal transaction", () => {
    const { handler, spies } = makeFixture();
    handler.alignHorizontal(["a", "b"], "left");

    expect(spies.beginTransaction).toHaveBeenCalledWith("align-horizontal");
    expect(spies.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("no-ops with fewer than 2 ids", () => {
    const { a, handler, spies } = makeFixture();
    handler.alignHorizontal(["a"], "left");

    expect(a.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });

  it("no-ops when missing elements leave fewer than 2 resolvable bounds", () => {
    const { a, handler, spies } = makeFixture();
    handler.alignHorizontal(["a", "ghost-1", "ghost-2"], "left");

    expect(a.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });

  it("skips missing elements but aligns the rest", () => {
    const { a, b, handler } = makeFixture();
    handler.alignHorizontal(["a", "ghost", "b"], "left");

    expect(styleValue(a, "left")).toBe("10px");
    expect(styleValue(b, "left")).toBe("10px");
  });

  it("ends the transaction even when a setStyle throws", () => {
    const a = makeElement({ left: "0px", top: "0px", width: "10px", height: "10px" });
    const b = makeElement({ left: "50px", top: "0px", width: "10px", height: "10px" });
    a.setStyle.mockImplementation(() => {
      throw new Error("boom");
    });
    const { composer, spies } = makeComposer({ a, b });
    const handler = new AlignmentHandler(composer);

    expect(() => handler.alignHorizontal(["a", "b"], "left")).toThrow("boom");
    expect(spies.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("tolerates a composer without transaction methods", () => {
    const a = makeElement({ left: "0px", top: "0px", width: "10px", height: "10px" });
    const b = makeElement({ left: "50px", top: "0px", width: "10px", height: "10px" });
    const registry: Record<string, MockElement> = { a, b };
    const composer = {
      elements: { getElement: (id: string) => registry[id] },
    } as unknown as Composer;

    const handler = new AlignmentHandler(composer);
    expect(() => handler.alignHorizontal(["a", "b"], "left")).not.toThrow();
    expect(styleValue(b, "left")).toBe("0px");
  });
});

describe("alignVertical", () => {
  it("top: moves all elements to the topmost edge", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignVertical(["a", "b", "c"], "top");

    expect(styleValue(a, "top")).toBe("10px");
    expect(styleValue(b, "top")).toBe("10px");
    expect(styleValue(c, "top")).toBe("10px");
    // vertical alignment never touches left
    expect(styleValue(a, "left")).toBeUndefined();
  });

  it("middle: centers each element on the vertical midpoint of the group", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignVertical(["a", "b", "c"], "middle");

    // extent: minTop 10 .. maxBottom 320 -> middle 165
    expect(styleValue(a, "top")).toBe("140px"); // 165 - 25
    expect(styleValue(b, "top")).toBe("125px"); // 165 - 40
    expect(styleValue(c, "top")).toBe("155px"); // 165 - 10
  });

  it("bottom: aligns all bottom edges to the bottommost edge", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignVertical(["a", "b", "c"], "bottom");

    // bottommost edge = 320
    expect(styleValue(a, "top")).toBe("270px");
    expect(styleValue(b, "top")).toBe("240px");
    expect(styleValue(c, "top")).toBe("300px");
  });

  it("wraps the operation in an align-vertical transaction", () => {
    const { handler, spies } = makeFixture();
    handler.alignVertical(["a", "b"], "top");

    expect(spies.beginTransaction).toHaveBeenCalledWith("align-vertical");
    expect(spies.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("no-ops with fewer than 2 ids", () => {
    const { a, handler, spies } = makeFixture();
    handler.alignVertical(["a"], "top");

    expect(a.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });

  it("no-ops when missing elements leave fewer than 2 resolvable bounds", () => {
    const { a, handler, spies } = makeFixture();
    handler.alignVertical(["a", "ghost-1", "ghost-2"], "top");

    expect(a.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });
});

describe("distribute", () => {
  it("horizontal: spaces elements with equal gaps between outermost edges", () => {
    const a = makeElement({ left: "0px", top: "0px", width: "10px", height: "10px" });
    const b = makeElement({ left: "50px", top: "0px", width: "20px", height: "10px" });
    const c = makeElement({ left: "90px", top: "0px", width: "30px", height: "10px" }); // right 120
    const { composer, spies } = makeComposer({ a, b, c });
    new AlignmentHandler(composer).distribute(["a", "b", "c"], "horizontal");

    // span 0..120, total width 60, gap = (120 - 60) / 2 = 30
    expect(styleValue(a, "left")).toBe("0px");
    expect(styleValue(b, "left")).toBe("40px"); // 0 + 10 + 30
    expect(styleValue(c, "left")).toBe("90px"); // 40 + 20 + 30
    expect(spies.beginTransaction).toHaveBeenCalledWith("distribute");
    expect(spies.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("horizontal: sorts by left position before distributing", () => {
    // Same fixture but ids passed out of visual order.
    const a = makeElement({ left: "90px", top: "0px", width: "30px", height: "10px" });
    const b = makeElement({ left: "0px", top: "0px", width: "10px", height: "10px" });
    const c = makeElement({ left: "50px", top: "0px", width: "20px", height: "10px" });
    const { composer } = makeComposer({ a, b, c });
    new AlignmentHandler(composer).distribute(["a", "b", "c"], "horizontal");

    expect(styleValue(b, "left")).toBe("0px");
    expect(styleValue(c, "left")).toBe("40px");
    expect(styleValue(a, "left")).toBe("90px");
  });

  it("horizontal: overlapping elements produce a negative gap (current behavior)", () => {
    const a = makeElement({ left: "10px", top: "0px", width: "100px", height: "10px" });
    const b = makeElement({ left: "50px", top: "0px", width: "150px", height: "10px" }); // right 200
    const c = makeElement({ left: "200px", top: "0px", width: "50px", height: "10px" }); // right 250
    const { composer } = makeComposer({ a, b, c });
    new AlignmentHandler(composer).distribute(["a", "b", "c"], "horizontal");

    // span 10..250, total 300, gap = (240 - 300) / 2 = -30
    expect(styleValue(a, "left")).toBe("10px");
    expect(styleValue(b, "left")).toBe("80px"); // 10 + 100 - 30
    expect(styleValue(c, "left")).toBe("200px"); // 80 + 150 - 30
  });

  it("vertical: spaces elements with equal gaps between outermost edges", () => {
    const a = makeElement({ left: "0px", top: "0px", width: "10px", height: "10px" });
    const b = makeElement({ left: "0px", top: "40px", width: "10px", height: "10px" });
    const c = makeElement({ left: "0px", top: "100px", width: "10px", height: "20px" }); // bottom 120
    const { composer } = makeComposer({ a, b, c });
    new AlignmentHandler(composer).distribute(["a", "b", "c"], "vertical");

    // span 0..120, total height 40, gap = (120 - 40) / 2 = 40
    expect(styleValue(a, "top")).toBe("0px");
    expect(styleValue(b, "top")).toBe("50px"); // 0 + 10 + 40
    expect(styleValue(c, "top")).toBe("100px"); // 50 + 10 + 40
  });

  it("no-ops with fewer than 3 ids", () => {
    const { a, b, handler, spies } = makeFixture();
    handler.distribute(["a", "b"], "horizontal");

    expect(a.setStyle).not.toHaveBeenCalled();
    expect(b.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });

  it("no-ops when missing elements leave fewer than 3 resolvable bounds", () => {
    const { a, b, handler, spies } = makeFixture();
    handler.distribute(["a", "b", "ghost"], "horizontal");

    expect(a.setStyle).not.toHaveBeenCalled();
    expect(b.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });
});

describe("bounds parsing fallbacks", () => {
  it("elements without getStyles default to 0,0 100x100", () => {
    const bare = { setStyle: vi.fn() } as unknown as MockElement;
    const b = makeElement({ left: "300px", top: "0px", width: "100px", height: "100px" });
    const { composer } = makeComposer({ bare, b });
    new AlignmentHandler(composer).alignHorizontal(["bare", "b"], "right");

    // bare: left 0, width 100 -> right 100; b right 400 -> reference 400
    expect(styleValue(bare, "left")).toBe("300px");
    expect(styleValue(b, "left")).toBe("300px");
  });

  it("non-numeric left/top parse to 0", () => {
    const a = makeElement({ left: "auto", top: "auto", width: "50px", height: "50px" });
    const b = makeElement({ left: "100px", top: "0px", width: "50px", height: "50px" });
    const { composer } = makeComposer({ a, b });
    new AlignmentHandler(composer).alignHorizontal(["a", "b"], "left");

    expect(styleValue(a, "left")).toBe("0px");
    expect(styleValue(b, "left")).toBe("0px");
  });

  it("skips positioning when an element vanishes between bounds and positioning", () => {
    const a = makeElement({ left: "0px", top: "0px", width: "10px", height: "10px" });
    const b = makeElement({ left: "50px", top: "0px", width: "10px", height: "10px" });
    const registry: Record<string, MockElement> = { a, b };
    let calls = 0;
    const composer = {
      elements: {
        // Present during the bounds pass (first 2 lookups), gone afterwards.
        getElement: vi.fn((id: string) => (++calls <= 2 ? registry[id] : undefined)),
      },
      beginTransaction: vi.fn(),
      endTransaction: vi.fn(),
    } as unknown as Composer;

    expect(() => new AlignmentHandler(composer).alignHorizontal(["a", "b"], "left")).not.toThrow();
    expect(a.setStyle).not.toHaveBeenCalled();
    expect(b.setStyle).not.toHaveBeenCalled();
  });

  it("explicit height '0px' is currently treated as 100px tall (same coercion quirk)", () => {
    const zero = makeElement({ left: "0px", top: "0px", width: "10px", height: "0px" });
    const b = makeElement({ left: "0px", top: "100px", width: "10px", height: "100px" }); // bottom 200
    const { composer } = makeComposer({ zero, b });
    new AlignmentHandler(composer).alignVertical(["zero", "b"], "bottom");

    // Correct result for a 0-height element would be "200px"; the coerced
    // 100px default is subtracted instead.
    expect(styleValue(zero, "top")).toBe("100px");
  });

  it("elements with no setStyle method do not throw", () => {
    const silent = { getStyles: vi.fn(() => ({ left: "0px", top: "0px" })) };
    const b = makeElement({ left: "100px", top: "0px", width: "50px", height: "50px" });
    const { composer } = makeComposer({ silent: silent as unknown as MockElement, b });

    expect(() =>
      new AlignmentHandler(composer).alignHorizontal(["silent", "b"], "left")
    ).not.toThrow();
  });

  // Potential bug: getElementBounds uses `parseFloat(styles.width || "100") || 100`,
  // so an explicit width of "0px" (parseFloat -> 0, falsy) is treated as 100px.
  // A zero-width element is therefore right-aligned as if it were 100px wide
  // (its computed left = referenceX - 100 instead of referenceX).
  it.todo("explicit width '0px' should not be coerced to the 100px default");

  it("explicit width '0px' is currently treated as 100px wide (pins the quirk)", () => {
    const zero = makeElement({ left: "0px", top: "0px", width: "0px", height: "10px" });
    const b = makeElement({ left: "100px", top: "0px", width: "100px", height: "10px" }); // right 200
    const { composer } = makeComposer({ zero, b });
    new AlignmentHandler(composer).alignHorizontal(["zero", "b"], "right");

    // Correct result for a 0-width element would be "200px"; current
    // implementation subtracts the coerced 100px default.
    expect(styleValue(zero, "left")).toBe("100px");
  });
});
