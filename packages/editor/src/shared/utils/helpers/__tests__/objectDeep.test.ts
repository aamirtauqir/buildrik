/**
 * helpers/objectDeep — deepClone / deepMerge / deepEqual / shallowEqual.
 * The manual-clone fallback branches are exercised by stubbing away
 * structuredClone.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { deepClone, deepMerge, deepEqual, shallowEqual } from "../objectDeep";

describe("deepClone (native structuredClone path)", () => {
  it("deep-clones nested plain objects", () => {
    const src = { a: 1, b: { c: [1, 2, 3] } };
    const clone = deepClone(src);
    expect(clone).toEqual(src);
    expect(clone).not.toBe(src);
    expect(clone.b).not.toBe(src.b);
  });

  it("returns primitives untouched", () => {
    expect(deepClone(5)).toBe(5);
    expect(deepClone("x")).toBe("x");
    expect(deepClone(null)).toBeNull();
  });
});

describe("deepClone (manual fallback, structuredClone unavailable)", () => {
  afterEach(() => vi.unstubAllGlobals());

  const withoutStructuredClone = (fn: () => void) => {
    vi.stubGlobal("structuredClone", undefined);
    fn();
  };

  it("clones Date, RegExp, Map, Set, Array and plain objects", () => {
    withoutStructuredClone(() => {
      const d = deepClone(new Date(1000));
      expect(d).toBeInstanceOf(Date);
      expect(d.getTime()).toBe(1000);

      const re = deepClone(/ab/gi);
      expect(re.source).toBe("ab");
      expect(re.flags).toBe("gi");

      const map = deepClone(new Map([["k", { v: 1 }]]));
      expect(map.get("k")).toEqual({ v: 1 });

      const set = deepClone(new Set([1, 2]));
      expect([...set]).toEqual([1, 2]);

      const arr = deepClone([{ a: 1 }]);
      expect(arr[0]).toEqual({ a: 1 });

      const obj = deepClone({ a: { b: 2 } });
      expect(obj).toEqual({ a: { b: 2 } });
    });
  });

  it("clones a typed-array view and an ArrayBuffer", () => {
    withoutStructuredClone(() => {
      const view = deepClone(new Uint8Array([1, 2, 3]));
      expect(Array.from(view)).toEqual([1, 2, 3]);

      const buf = deepClone(new ArrayBuffer(4));
      expect(buf.byteLength).toBe(4);
    });
  });

  it("returns functions as-is (structuredClone would throw)", () => {
    withoutStructuredClone(() => {
      const fn = () => 1;
      expect(deepClone(fn)).toBe(fn);
    });
  });
});

describe("deepMerge", () => {
  it("recursively merges nested objects, leaving the target untouched", () => {
    const target = { a: 1, b: { c: 2 } };
    const merged = deepMerge(target as Record<string, unknown>, { b: { d: 3 } } as never);
    expect(merged).toEqual({ a: 1, b: { c: 2, d: 3 } });
    expect(target).toEqual({ a: 1, b: { c: 2 } }); // immutable
  });

  it("skips undefined sources and undefined values", () => {
    const merged = deepMerge({ a: 1 } as Record<string, unknown>, undefined as never, {
      a: undefined,
    } as never);
    expect(merged).toEqual({ a: 1 });
  });

  it("overwrites scalars from later sources", () => {
    expect(deepMerge({ a: 1 } as Record<string, unknown>, { a: 2 } as never)).toEqual({ a: 2 });
  });
});

describe("deepEqual", () => {
  it("compares primitives and identity", () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual("a", "b")).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual(1, "1")).toBe(false); // typeof differs
  });

  it("compares Dates and RegExps by value", () => {
    expect(deepEqual(new Date(5), new Date(5))).toBe(true);
    expect(deepEqual(new Date(5), new Date(6))).toBe(false);
    expect(deepEqual(/a/g, /a/g)).toBe(true);
    expect(deepEqual(/a/g, /a/i)).toBe(false);
  });

  it("compares Maps and Sets", () => {
    expect(deepEqual(new Map([["a", 1]]), new Map([["a", 1]]))).toBe(true);
    expect(deepEqual(new Map([["a", 1]]), new Map([["a", 2]]))).toBe(false);
    expect(deepEqual(new Set([1, 2]), new Set([1, 2]))).toBe(true);
    expect(deepEqual(new Set([1]), new Set([1, 2]))).toBe(false);
  });

  it("compares arrays and objects deeply", () => {
    expect(deepEqual([1, [2]], [1, [2]])).toBe(true);
    expect(deepEqual([1], [1, 2])).toBe(false);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it("treats array-vs-object as unequal", () => {
    expect(deepEqual([1], { 0: 1 })).toBe(false);
  });
});

describe("shallowEqual", () => {
  it("is true for same reference and matching shallow keys", () => {
    const obj = { a: 1 };
    expect(shallowEqual(obj, obj)).toBe(true);
    expect(shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it("is false for differing key counts or values", () => {
    expect(shallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    // nested objects compared by reference only
    const inner = { x: 1 };
    expect(shallowEqual({ a: inner }, { a: { x: 1 } })).toBe(false);
    expect(shallowEqual({ a: inner }, { a: inner })).toBe(true);
  });
});
