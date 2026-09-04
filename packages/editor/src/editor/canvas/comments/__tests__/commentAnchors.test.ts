/**
 * commentAnchors tests — selector escaping, resolution, pin math, orphan
 * detection (S5 shell state 6 + orphan-comment recovery).
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  anchorSelector,
  elementIdFromSelector,
  resolveAnchor,
  pinPosition,
  pointToFractions,
  detectOrphans,
  type AnchoredComment,
} from "../commentAnchors";

function makeRoot(html: string): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = html;
  document.body.appendChild(root);
  return root;
}

function comment(over: Partial<AnchoredComment>): AnchoredComment {
  return {
    id: "c1",
    pageId: "p1",
    x: null,
    y: null,
    targetSelector: null,
    status: "OPEN",
    ...over,
  };
}

describe("anchorSelector", () => {
  it("builds a data-buildrick-id attribute selector", () => {
    expect(anchorSelector("el-42")).toBe('[data-buildrick-id="el-42"]');
  });

  it("escapes quotes and backslashes so ids cannot break the selector", () => {
    expect(anchorSelector('a"b\\c')).toBe('[data-buildrick-id="a\\"b\\\\c"]');
  });
});

describe("elementIdFromSelector", () => {
  it("is the inverse of anchorSelector", () => {
    expect(elementIdFromSelector(anchorSelector("el-42"))).toBe("el-42");
  });

  it("round-trips an id with quotes and backslashes", () => {
    const id = 'a"b\\c';
    expect(elementIdFromSelector(anchorSelector(id))).toBe(id);
  });

  it("returns null for an unpinned note and a malformed selector", () => {
    expect(elementIdFromSelector(null)).toBeNull();
    expect(elementIdFromSelector(":::not-a-selector")).toBeNull();
  });
});

describe("resolveAnchor", () => {
  it("resolves an existing element", () => {
    const root = makeRoot('<div data-buildrick-id="el-1">x</div>');
    expect(resolveAnchor(root, anchorSelector("el-1"))?.textContent).toBe("x");
  });

  it("returns null for a missing element", () => {
    const root = makeRoot("<div>x</div>");
    expect(resolveAnchor(root, anchorSelector("gone"))).toBeNull();
  });

  it("returns null (never throws) for an invalid selector", () => {
    const root = makeRoot("<div>x</div>");
    expect(resolveAnchor(root, ":::not-a-selector")).toBeNull();
  });
});

describe("pinPosition", () => {
  it("uses page fractions against the content scroll size", () => {
    const root = makeRoot("");
    Object.defineProperty(root, "scrollWidth", { value: 1000, configurable: true });
    Object.defineProperty(root, "scrollHeight", { value: 2000, configurable: true });
    expect(pinPosition(comment({ x: 0.25, y: 0.5 }), root)).toEqual({ left: 250, top: 1000 });
  });

  it("clamps out-of-range fractions", () => {
    const root = makeRoot("");
    Object.defineProperty(root, "scrollWidth", { value: 100, configurable: true });
    Object.defineProperty(root, "scrollHeight", { value: 100, configurable: true });
    expect(pinPosition(comment({ x: 2, y: -1 }), root)).toEqual({ left: 100, top: 0 });
  });

  it("returns null for an unpinned general note", () => {
    const root = makeRoot("");
    expect(pinPosition(comment({}), root)).toBeNull();
  });
});

describe("pointToFractions", () => {
  it("maps a client point to 0..1 fractions of the content rect", () => {
    const root = makeRoot("");
    root.getBoundingClientRect = () =>
      ({ left: 100, top: 200, width: 400, height: 800, right: 500, bottom: 1000 }) as DOMRect;
    expect(pointToFractions(300, 600, root)).toEqual({ x: 0.5, y: 0.5 });
  });

  it("clamps points outside the rect", () => {
    const root = makeRoot("");
    root.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 100, height: 100, right: 100, bottom: 100 }) as DOMRect;
    expect(pointToFractions(-50, 500, root)).toEqual({ x: 0, y: 1 });
  });
});

describe("detectOrphans", () => {
  const root = makeRoot('<div data-buildrick-id="alive"></div>');

  it("flags OPEN pinned comments on the active page whose anchor is gone", () => {
    const cs = [
      comment({ id: "dead", targetSelector: anchorSelector("deleted-el") }),
      comment({ id: "ok", targetSelector: anchorSelector("alive") }),
    ];
    expect(detectOrphans(cs, root, "p1")).toEqual(["dead"]);
  });

  it("ignores resolved comments, other pages, and unpinned notes", () => {
    const cs = [
      comment({ id: "resolved", targetSelector: anchorSelector("gone"), status: "RESOLVED" }),
      comment({ id: "other-page", targetSelector: anchorSelector("gone"), pageId: "p2" }),
      comment({ id: "general", targetSelector: null }),
      comment({ id: "no-page", targetSelector: anchorSelector("gone"), pageId: null }),
    ];
    expect(detectOrphans(cs, root, "p1")).toEqual([]);
  });
});
