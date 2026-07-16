/**
 * Object helper tests — pick/omit, path get/set/has, flatten/unflatten,
 * and map/filter/invert transforms.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  pick,
  omit,
  get,
  set,
  has,
  flatten,
  unflatten,
  mapValues,
  mapKeys,
  filterObject,
  invert,
} from "../object";

describe("pick / omit", () => {
  const obj = { a: 1, b: 2, c: 3 };

  it("pick keeps only the listed keys that exist", () => {
    expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 });
    expect(pick(obj, ["a", "nope" as keyof typeof obj])).toEqual({ a: 1 });
  });

  it("omit removes the listed keys without mutating the source", () => {
    expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 });
    expect(obj).toEqual({ a: 1, b: 2, c: 3 });
  });
});

describe("get", () => {
  const obj = { user: { name: "X", tags: ["a", "b"] }, zero: 0, nil: null };

  it("resolves dot paths and bracket indices", () => {
    expect(get(obj, "user.name")).toBe("X");
    expect(get(obj, "user.tags[1]")).toBe("b");
    expect(get(obj, ["user", "tags", "0"])).toBe("a");
  });

  it("returns falsy-but-defined values as-is", () => {
    expect(get(obj, "zero", 99)).toBe(0);
    expect(get(obj, "nil", "fallback")).toBeNull();
  });

  it("returns the default for missing / broken paths", () => {
    expect(get(obj, "user.missing", "d")).toBe("d");
    expect(get(obj, "nil.deeper", "d")).toBe("d");
    expect(get(obj, "totally.absent")).toBeUndefined();
  });
});

describe("set", () => {
  it("sets nested values immutably (source untouched)", () => {
    const src = { a: { b: 1 }, other: { keep: true } };
    const out = set(src, "a.b", 2);

    expect(out.a.b).toBe(2);
    expect(src.a.b).toBe(1);
    expect(out.other).toEqual({ keep: true });
  });

  it("creates intermediate objects and arrays for numeric keys", () => {
    const out = set({} as Record<string, unknown>, "list[0].name", "first");
    expect(out).toEqual({ list: [{ name: "first" }] });
    expect(Array.isArray((out as { list: unknown[] }).list)).toBe(true);
  });

  it("returns the object unchanged for an empty path", () => {
    const src = { a: 1 };
    expect(set(src, [], 9)).toBe(src);
  });
});

describe("has", () => {
  const obj = { a: { b: { c: undefined } }, arr: [1] };

  it("detects existing paths — including keys set to undefined", () => {
    expect(has(obj, "a.b")).toBe(true);
    expect(has(obj, "a.b.c")).toBe(true); // key exists, value undefined
    expect(has(obj, "arr[0]")).toBe(true);
  });

  it("rejects missing paths and paths through null/undefined", () => {
    expect(has(obj, "a.x")).toBe(false);
    expect(has(obj, "a.b.c.d")).toBe(false);
    expect(has(obj, "arr[5]")).toBe(false);
  });
});

describe("flatten / unflatten", () => {
  it("flattens nested plain objects with dot keys", () => {
    expect(flatten({ a: { b: 1, c: { d: 2 } }, e: 3 })).toEqual({
      "a.b": 1,
      "a.c.d": 2,
      e: 3,
    });
  });

  it("treats arrays as leaf values (not flattened)", () => {
    expect(flatten({ a: { list: [1, 2] } })).toEqual({ "a.list": [1, 2] });
  });

  it("supports a custom separator and round-trips through unflatten", () => {
    const src = { a: { b: 1 }, c: 2 };
    expect(flatten(src, "", "/")).toEqual({ "a/b": 1, c: 2 });
    expect(unflatten(flatten(src))).toEqual(src);
    expect(unflatten({ "x/y": 1 }, "/")).toEqual({ x: { y: 1 } });
  });
});

describe("mapValues / mapKeys / filterObject / invert", () => {
  it("mapValues transforms values with (value, key)", () => {
    expect(mapValues({ a: 1, b: 2 }, (v, k) => `${k}${v * 10}`)).toEqual({
      a: "a10",
      b: "b20",
    });
  });

  it("mapKeys transforms keys with (key, value)", () => {
    expect(mapKeys({ a: 1, b: 2 }, (k) => k.toUpperCase())).toEqual({ A: 1, B: 2 });
  });

  it("filterObject keeps entries matching the predicate", () => {
    expect(filterObject({ a: 1, b: 2, c: 3 }, (v) => v % 2 === 1)).toEqual({ a: 1, c: 3 });
  });

  it("invert swaps keys and (stringified) values", () => {
    expect(invert({ a: 1, b: "x" })).toEqual({ "1": "a", x: "b" });
  });
});
