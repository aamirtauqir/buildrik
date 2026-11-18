/**
 * AlignmentHandler tests — align + distribute over RENDERED boxes (the
 * chrome's measurement, faked here), written as left/top deltas on top of
 * each element's computed offset. Static members are never written (ISS-C08).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, vi } from "vitest";
import { AlignmentHandler, type RenderedBox } from "../AlignmentHandler";
import type { Composer } from "@/engine/Composer";

interface MockElement {
  setStyle: ReturnType<typeof vi.fn>;
  box: RenderedBox;
}

/** A rendered box; by default absolute with css offset = rendered position. */
function makeElement(left: number, top: number, width: number, height: number, extra: Partial<RenderedBox> = {}): MockElement {
  return {
    setStyle: vi.fn(),
    box: { left, top, width, height, position: "absolute", cssLeft: left, cssTop: top, ...extra },
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
  const handler = new AlignmentHandler(composer, (id) => elements[id]?.box ?? null);
  return { composer, spies, handler };
}

function styleValue(el: MockElement, prop: string): string | undefined {
  const call = el.setStyle.mock.calls.find(([p]) => p === prop);
  return call?.[1];
}

/** Standard 3-element fixture. */
function makeFixture() {
  const a = makeElement(10, 10, 100, 50); // right 110, bottom 60
  const b = makeElement(200, 100, 50, 80); // right 250, bottom 180
  const c = makeElement(50, 300, 150, 20); // right 200, bottom 320
  return { a, b, c, ...makeComposer({ a, b, c }) };
}

describe("alignHorizontal", () => {
  it("left: moves all elements to the leftmost edge", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignHorizontal(["a", "b", "c"], "left");
    expect(styleValue(a, "left")).toBe("10px");
    expect(styleValue(b, "left")).toBe("10px");
    expect(styleValue(c, "left")).toBe("10px");
    expect(styleValue(a, "top")).toBeUndefined();
  });

  it("center: centers each element on the midpoint of the group extent", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignHorizontal(["a", "b", "c"], "center");
    expect(styleValue(a, "left")).toBe("80px");
    expect(styleValue(b, "left")).toBe("105px");
    expect(styleValue(c, "left")).toBe("55px");
  });

  it("right: aligns all right edges to the rightmost edge", () => {
    const { a, b, c, handler } = makeFixture();
    handler.alignHorizontal(["a", "b", "c"], "right");
    expect(styleValue(a, "left")).toBe("150px");
    expect(styleValue(b, "left")).toBe("200px");
    expect(styleValue(c, "left")).toBe("100px");
  });

  it("writes a delta on the computed offset, not the rendered position", () => {
    // Rendered at x=300 inside a parent at x=250: its css left is 50.
    const a = makeElement(100, 0, 10, 10);
    const b = makeElement(300, 0, 10, 10, { cssLeft: 50 });
    const { handler } = makeComposer({ a, b });
    handler.alignHorizontal(["a", "b"], "left");
    expect(styleValue(b, "left")).toBe("-150px");
  });

  it("relative members move; static members anchor but are never written", () => {
    const a = makeElement(0, 0, 10, 10, { position: "static" });
    const b = makeElement(40, 0, 10, 10, { position: "relative", cssLeft: 0 });
    const { handler } = makeComposer({ a, b });
    handler.alignHorizontal(["a", "b"], "left");
    expect(a.setStyle).not.toHaveBeenCalled();
    expect(styleValue(b, "left")).toBe("-40px");
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

  it("no-ops when missing elements leave fewer than 2 measurable boxes", () => {
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
    const a = makeElement(0, 0, 10, 10);
    const b = makeElement(50, 0, 10, 10);
    a.setStyle.mockImplementation(() => {
      throw new Error("boom");
    });
    const { handler, spies } = makeComposer({ a, b });
    expect(() => handler.alignHorizontal(["a", "b"], "left")).toThrow("boom");
    expect(spies.endTransaction).toHaveBeenCalledTimes(1);
  });

  it("a zero-width element aligns by its real width", () => {
    const zero = makeElement(0, 0, 0, 10);
    const b = makeElement(100, 0, 100, 10);
    const { handler } = makeComposer({ zero, b });
    handler.alignHorizontal(["zero", "b"], "right");
    expect(styleValue(zero, "left")).toBe("200px");
  });
});

describe("alignVertical", () => {
  it("top / middle / bottom", () => {
    let f = makeFixture();
    f.handler.alignVertical(["a", "b", "c"], "top");
    expect([styleValue(f.a, "top"), styleValue(f.b, "top"), styleValue(f.c, "top")]).toEqual(["10px", "10px", "10px"]);
    expect(styleValue(f.a, "left")).toBeUndefined();

    f = makeFixture();
    f.handler.alignVertical(["a", "b", "c"], "middle");
    expect([styleValue(f.a, "top"), styleValue(f.b, "top"), styleValue(f.c, "top")]).toEqual(["140px", "125px", "155px"]);

    f = makeFixture();
    f.handler.alignVertical(["a", "b", "c"], "bottom");
    expect([styleValue(f.a, "top"), styleValue(f.b, "top"), styleValue(f.c, "top")]).toEqual(["270px", "240px", "300px"]);
    expect(f.spies.beginTransaction).toHaveBeenCalledWith("align-vertical");
  });
});

describe("distribute", () => {
  it("horizontal: equal gaps between outermost edges, sorted by position", () => {
    const a = makeElement(90, 0, 30, 10);
    const b = makeElement(0, 0, 10, 10);
    const c = makeElement(50, 0, 20, 10);
    const { handler, spies } = makeComposer({ a, b, c });
    handler.distribute(["a", "b", "c"], "horizontal");
    expect(styleValue(b, "left")).toBe("0px");
    expect(styleValue(c, "left")).toBe("40px");
    expect(styleValue(a, "left")).toBe("90px");
    expect(spies.beginTransaction).toHaveBeenCalledWith("distribute");
  });

  it("vertical: equal gaps between outermost edges", () => {
    const a = makeElement(0, 0, 10, 10);
    const b = makeElement(0, 40, 10, 10);
    const c = makeElement(0, 100, 10, 20);
    const { handler } = makeComposer({ a, b, c });
    handler.distribute(["a", "b", "c"], "vertical");
    expect(styleValue(a, "top")).toBe("0px");
    expect(styleValue(b, "top")).toBe("50px");
    expect(styleValue(c, "top")).toBe("100px");
  });

  it("no-ops with fewer than 3 measurable boxes", () => {
    const { a, b, handler, spies } = makeFixture();
    handler.distribute(["a", "b", "ghost"], "horizontal");
    expect(a.setStyle).not.toHaveBeenCalled();
    expect(b.setStyle).not.toHaveBeenCalled();
    expect(spies.beginTransaction).not.toHaveBeenCalled();
  });
});
