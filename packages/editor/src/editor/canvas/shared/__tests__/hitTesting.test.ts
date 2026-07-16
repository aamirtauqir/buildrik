/**
 * shared/hitTesting — element detection at screen coordinates.
 *
 * buildElementStack reads document.elementsFromPoint; findElementWithHitExpansion
 * walks a direct-hit fast path then falls back to an expanded-hitbox scan. jsdom
 * returns zero-rects from getBoundingClientRect, so candidate rects are stubbed
 * per element instance.
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, afterEach, vi } from "vitest";
import { HIT_EXPANSION, buildElementStack, findElementWithHitExpansion } from "../hitTesting";

function makeCandidate(
  id: string,
  rect: { left: number; top: number; width: number; height: number }
): HTMLElement {
  const el = document.createElement("div");
  el.setAttribute("data-buildrick-id", id);
  el.getBoundingClientRect = () =>
    ({
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      width: rect.width,
      height: rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => ({}),
    }) as DOMRect;
  document.body.appendChild(el);
  return el;
}

/** jsdom does not implement elementsFromPoint — install a stub we can control. */
function stubElementsFromPoint(result: Element[]): void {
  (document as unknown as { elementsFromPoint: (x: number, y: number) => Element[] }).elementsFromPoint =
    () => result;
}

afterEach(() => {
  document.body.replaceChildren();
  delete (document as unknown as { elementsFromPoint?: unknown }).elementsFromPoint;
  vi.restoreAllMocks();
});

describe("HIT_EXPANSION", () => {
  it("is a 4px expansion constant", () => {
    expect(HIT_EXPANSION).toBe(4);
  });
});

describe("buildElementStack", () => {
  it("returns only data-buildrick-id values in z-order from elementsFromPoint", () => {
    const tagged = document.createElement("div");
    tagged.setAttribute("data-buildrick-id", "top");
    const untagged = document.createElement("div"); // no attribute — filtered out
    const tagged2 = document.createElement("div");
    tagged2.setAttribute("data-buildrick-id", "bottom");

    stubElementsFromPoint([tagged, untagged, tagged2]);

    expect(buildElementStack(10, 10)).toEqual(["top", "bottom"]);
  });

  it("returns an empty array when nothing is under the point", () => {
    stubElementsFromPoint([]);
    expect(buildElementStack(0, 0)).toEqual([]);
  });
});

describe("findElementWithHitExpansion — direct hit", () => {
  it("returns the nearest data-buildrick-id ancestor via closest()", () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-buildrick-id", "wrap-1");
    const child = document.createElement("span");
    wrapper.appendChild(child);
    document.body.appendChild(wrapper);

    // Direct hit short-circuits before any getBoundingClientRect math.
    expect(findElementWithHitExpansion(child, 999, 999)).toBe(wrapper);
  });
});

describe("findElementWithHitExpansion — expanded hitbox fallback", () => {
  it("matches a candidate when the point is inside its rect", () => {
    const target = document.createElement("div"); // no tagged ancestor → fallback path
    document.body.appendChild(target);
    const c1 = makeCandidate("c1", { left: 0, top: 0, width: 10, height: 10 });
    makeCandidate("c2", { left: 100, top: 100, width: 10, height: 10 });

    expect(findElementWithHitExpansion(target, 5, 5)).toBe(c1);
  });

  it("catches a point within HIT_EXPANSION px outside the rect edge", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    const c1 = makeCandidate("c1", { left: 0, top: 0, width: 10, height: 10 });

    // 2px past the right edge — inside the 4px expansion.
    expect(findElementWithHitExpansion(target, 12, 5)).toBe(c1);
  });

  it("returns null when the point is beyond the expanded hitbox of every candidate", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    makeCandidate("c1", { left: 0, top: 0, width: 10, height: 10 });

    // 5px past the right edge — outside the 4px expansion.
    expect(findElementWithHitExpansion(target, 15, 5)).toBeNull();
  });

  it("prefers the smaller (more specific) element when several overlap the point", () => {
    const target = document.createElement("div");
    document.body.appendChild(target);
    // Large container centered far from the point + a tiny element on the point.
    makeCandidate("big", { left: 0, top: 0, width: 100, height: 100 });
    const small = makeCandidate("small", { left: 0, top: 0, width: 10, height: 10 });

    expect(findElementWithHitExpansion(target, 5, 5)).toBe(small);
  });
});
