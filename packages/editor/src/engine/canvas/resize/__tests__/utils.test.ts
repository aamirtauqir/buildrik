/**
 * engine/canvas/resize/utils — cursor mapping, angle math, handle predicates,
 * and DOM/coord helpers.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, afterEach } from "vitest";
import {
  getDOMElement,
  getCanvasBounds,
  getCursor,
  setResizeCursor,
  resetCursor,
  getClientCoords,
  normalizeAngle,
  calculateAngle,
  affectsWidth,
  affectsHeight,
  affectsLeft,
  affectsTop,
  isCornerHandle,
  isEdgeHandle,
} from "../utils";
import type { AnyHandle } from "../types";

describe("getCursor", () => {
  it("returns the grab cursor for rotation", () => {
    expect(getCursor("rotation")).toBe("grab");
  });
  it("maps each handle to its resize cursor", () => {
    expect(getCursor("nw")).toBe("nwse-resize");
    expect(getCursor("n")).toBe("ns-resize");
    expect(getCursor("e")).toBe("ew-resize");
  });
  it("defaults to 'default' for an unknown handle", () => {
    expect(getCursor("bogus" as AnyHandle)).toBe("default");
  });
});

describe("setResizeCursor / resetCursor", () => {
  afterEach(() => resetCursor());

  it("sets body cursor + disables selection, then clears", () => {
    setResizeCursor("e");
    expect(document.body.style.cursor).toBe("ew-resize");
    expect(document.body.style.userSelect).toBe("none");

    resetCursor();
    expect(document.body.style.cursor).toBe("");
    expect(document.body.style.userSelect).toBe("");
  });
});

describe("normalizeAngle", () => {
  it("wraps into the 0..360 range", () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-10)).toBe(350);
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(720)).toBe(0);
  });
});

describe("calculateAngle", () => {
  it("computes the angle from center to point in degrees", () => {
    expect(calculateAngle(0, 0, 1, 0)).toBe(0);
    expect(calculateAngle(0, 0, 0, 1)).toBe(90);
    expect(calculateAngle(0, 0, -1, 0)).toBe(180);
  });
});

describe("handle predicates", () => {
  it("affectsWidth / affectsHeight", () => {
    expect(affectsWidth("e")).toBe(true);
    expect(affectsWidth("n")).toBe(false);
    expect(affectsWidth("ne")).toBe(true);
    expect(affectsHeight("n")).toBe(true);
    expect(affectsHeight("e")).toBe(false);
    expect(affectsHeight("sw")).toBe(true);
  });
  it("affectsLeft / affectsTop", () => {
    expect(affectsLeft("w")).toBe(true);
    expect(affectsLeft("nw")).toBe(true);
    expect(affectsLeft("e")).toBe(false);
    expect(affectsTop("n")).toBe(true);
    expect(affectsTop("ne")).toBe(true);
    expect(affectsTop("s")).toBe(false);
  });
  it("isCornerHandle / isEdgeHandle are mutually exclusive", () => {
    expect(isCornerHandle("nw")).toBe(true);
    expect(isCornerHandle("n")).toBe(false);
    expect(isEdgeHandle("n")).toBe(true);
    expect(isEdgeHandle("nw")).toBe(false);
  });
});

describe("getClientCoords", () => {
  it("extracts clientX/clientY", () => {
    expect(getClientCoords({ clientX: 5, clientY: 6 } as MouseEvent)).toEqual({ x: 5, y: 6 });
  });
});

describe("getDOMElement / getCanvasBounds", () => {
  it("returns null when the element is absent", () => {
    expect(getDOMElement("no-such-id")).toBeNull();
  });
  it("falls back to default canvas bounds when there is no canvas", () => {
    expect(getCanvasBounds()).toEqual({ x: 0, y: 0, width: 1440, height: 900 });
  });
});
