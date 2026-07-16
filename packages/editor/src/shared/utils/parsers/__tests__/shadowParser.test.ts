/**
 * parsers/shadowParser — box-shadow parse + serialize round-trips.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { parseBoxShadow, serializeBoxShadow, type BoxShadow } from "../shadowParser";

describe("parseBoxShadow", () => {
  it("parses offsets, blur, spread and a trailing rgba color", () => {
    const [s] = parseBoxShadow("2px 4px 6px 8px rgba(0,0,0,0.5)");
    expect(s).toMatchObject({
      offsetX: 2,
      offsetY: 4,
      blurRadius: 6,
      spreadRadius: 8,
      inset: false,
    });
    expect(s.color).toMatchObject({ r: 0, g: 0, b: 0 });
  });

  it("flags inset shadows and defaults spread to 0", () => {
    const [s] = parseBoxShadow("inset 1px 2px 3px #ff0000");
    expect(s.inset).toBe(true);
    expect(s.spreadRadius).toBe(0);
    expect(s.color).toMatchObject({ r: 255, g: 0, b: 0 });
  });

  it("defaults to black when no color is present", () => {
    const [s] = parseBoxShadow("2px 3px");
    expect(s.color).toMatchObject({ r: 0, g: 0, b: 0 });
    expect(s.offsetX).toBe(2);
    expect(s.offsetY).toBe(3);
  });

  it("parses multiple comma-separated shadows", () => {
    const shadows = parseBoxShadow("1px 1px 0 #000, inset 2px 2px 0 #fff");
    expect(shadows).toHaveLength(2);
    expect(shadows[0].inset).toBe(false);
    expect(shadows[1].inset).toBe(true);
  });

  it("ignores shadows with fewer than two numeric values", () => {
    expect(parseBoxShadow("5px")).toEqual([]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseBoxShadow("")).toEqual([]);
  });
});

describe("serializeBoxShadow", () => {
  it("serializes a single shadow", () => {
    const shadow: BoxShadow = {
      offsetX: 2,
      offsetY: 4,
      blurRadius: 6,
      spreadRadius: 8,
      color: { r: 0, g: 0, b: 0 },
      inset: false,
    };
    expect(serializeBoxShadow([shadow])).toBe("2px 4px 6px 8px rgb(0, 0, 0)");
  });

  it("prefixes inset shadows", () => {
    const shadow: BoxShadow = {
      offsetX: 1,
      offsetY: 1,
      blurRadius: 0,
      spreadRadius: 0,
      color: { r: 255, g: 255, b: 255 },
      inset: true,
    };
    expect(serializeBoxShadow([shadow])).toBe("inset 1px 1px 0px 0px rgb(255, 255, 255)");
  });

  it("round-trips parse → serialize → parse", () => {
    const input = "3px 5px 7px 2px rgba(10,20,30,0.5)";
    const parsed = parseBoxShadow(input);
    const reparsed = parseBoxShadow(serializeBoxShadow(parsed));
    expect(reparsed[0]).toMatchObject({
      offsetX: 3,
      offsetY: 5,
      blurRadius: 7,
      spreadRadius: 2,
    });
  });
});
