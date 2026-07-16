/**
 * Array helper tests — trimming, uniqueness/grouping, sorting, transforms,
 * set operations, finding/filtering, sampling, and moving.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import {
  trimArray,
  trimArrayStart,
  unique,
  uniqueBy,
  groupBy,
  sortBy,
  chunk,
  shuffle,
  range,
  zip,
  unzip,
  difference,
  intersection,
  union,
  first,
  last,
  partition,
  compact,
  flattenArray,
  sample,
  move,
} from "../array";

describe("trimArray / trimArrayStart", () => {
  it("trimArray keeps the NEWEST entries (tail)", () => {
    expect(trimArray([1, 2, 3, 4, 5], 3)).toEqual([3, 4, 5]);
  });

  it("trimArrayStart keeps the OLDEST entries (head)", () => {
    expect(trimArrayStart([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it("both return the same array when within the limit", () => {
    const arr = [1, 2];
    expect(trimArray(arr, 5)).toBe(arr);
    expect(trimArrayStart(arr, 5)).toBe(arr);
  });
});

describe("unique / uniqueBy / groupBy", () => {
  it("unique removes duplicates preserving first-seen order", () => {
    expect(unique([3, 1, 3, 2, 1])).toEqual([3, 1, 2]);
  });

  it("uniqueBy works with a key name or selector fn", () => {
    const items = [
      { id: 1, v: "a" },
      { id: 1, v: "b" },
      { id: 2, v: "c" },
    ];
    expect(uniqueBy(items, "id")).toEqual([items[0], items[2]]);
    expect(uniqueBy(items, (i) => i.id)).toEqual([items[0], items[2]]);
  });

  it("groupBy buckets by key or selector, stringifying keys", () => {
    const items = [
      { type: "a", n: 1 },
      { type: "b", n: 2 },
      { type: "a", n: 3 },
    ];
    expect(groupBy(items, "type")).toEqual({
      a: [items[0], items[2]],
      b: [items[1]],
    });
    expect(groupBy(items, (i) => i.n % 2)).toEqual({
      "1": [items[0], items[2]],
      "0": [items[1]],
    });
  });
});

describe("sortBy", () => {
  it("sorts ascending by a key without mutating the input", () => {
    const arr = [{ v: 3 }, { v: 1 }, { v: 2 }];
    const sorted = sortBy(arr, "v");
    expect(sorted.map((x) => x.v)).toEqual([1, 2, 3]);
    expect(arr.map((x) => x.v)).toEqual([3, 1, 2]);
  });

  it("uses later keys as tie-breakers", () => {
    const arr = [
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 0, b: 9 },
    ];
    expect(sortBy(arr, "a", "b")).toEqual([
      { a: 0, b: 9 },
      { a: 1, b: 1 },
      { a: 1, b: 2 },
    ]);
  });

  it("sorts null/undefined values last", () => {
    const arr = [{ v: null as number | null }, { v: 1 }, { v: 0 }];
    expect(sortBy(arr, "v").map((x) => x.v)).toEqual([0, 1, null]);
  });
});

describe("chunk / shuffle / range", () => {
  it("chunk splits with a smaller final chunk", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 3)).toEqual([]);
  });

  it("shuffle returns a permutation without mutating the input", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = shuffle(arr);
    expect(arr).toEqual([1, 2, 3, 4, 5]);
    expect([...out].sort()).toEqual([...arr].sort());
  });

  it("range supports single-arg, start/end, step, and negative step", () => {
    expect(range(3)).toEqual([0, 1, 2]);
    expect(range(2, 5)).toEqual([2, 3, 4]);
    expect(range(0, 10, 5)).toEqual([0, 5]);
    expect(range(3, 0, -1)).toEqual([3, 2, 1]);
    expect(range(1, 5, 0)).toEqual([]); // zero step yields nothing (no infinite loop)
  });
});

describe("zip / unzip", () => {
  it("zip pairs elements, padding shorter arrays with undefined", () => {
    expect(zip([1, 2], [3, 4])).toEqual([
      [1, 3],
      [2, 4],
    ]);
    expect(zip([1, 2], [3])).toEqual([
      [1, 3],
      [2, undefined],
    ]);
  });

  it("unzip inverts zip and handles empty input", () => {
    expect(
      unzip([
        [1, 3],
        [2, 4],
      ])
    ).toEqual([
      [1, 2],
      [3, 4],
    ]);
    expect(unzip([])).toEqual([]);
  });
});

describe("set operations", () => {
  it("difference keeps items of arr1 not in arr2", () => {
    expect(difference([1, 2, 3], [2, 4])).toEqual([1, 3]);
  });

  it("intersection keeps items present in both", () => {
    expect(intersection([1, 2, 3], [2, 3, 4])).toEqual([2, 3]);
  });

  it("union merges and dedupes across arrays", () => {
    expect(union([1, 2], [2, 3], [3, 4])).toEqual([1, 2, 3, 4]);
  });
});

describe("first / last / partition / compact / flattenArray", () => {
  it("first/last without predicate return the ends", () => {
    expect(first([1, 2, 3])).toBe(1);
    expect(last([1, 2, 3])).toBe(3);
    expect(first([])).toBeUndefined();
    expect(last([])).toBeUndefined();
  });

  it("first/last with predicate find from the correct end", () => {
    const arr = [1, 2, 3, 4];
    expect(first(arr, (n) => n % 2 === 0)).toBe(2);
    expect(last(arr, (n) => n % 2 === 0)).toBe(4);
    expect(last(arr, (n) => n > 10)).toBeUndefined();
  });

  it("partition splits into [pass, fail]", () => {
    expect(partition([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([
      [2, 4],
      [1, 3],
    ]);
  });

  it("compact removes all falsy values", () => {
    expect(compact([0, 1, null, 2, undefined, false, "", 3])).toEqual([1, 2, 3]);
  });

  it("flattenArray flattens fully by default and by depth when given", () => {
    expect(flattenArray([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
    expect(flattenArray([1, [2, [3]]], 1)).toEqual([1, 2, [3]]);
  });
});

describe("sample / move", () => {
  it("sample returns N distinct positions from the source", () => {
    const arr = [1, 2, 3, 4, 5];
    const out = sample(arr, 3);
    expect(out).toHaveLength(3);
    out.forEach((v) => expect(arr).toContain(v));
    expect(new Set(out).size).toBe(3);
  });

  it("sample caps at the array length", () => {
    expect(sample([1, 2], 10)).toHaveLength(2);
  });

  it("move relocates an element without mutating the source", () => {
    const arr = ["a", "b", "c"];
    expect(move(arr, 0, 2)).toEqual(["b", "c", "a"]);
    expect(move(arr, 2, 0)).toEqual(["c", "a", "b"]);
    expect(arr).toEqual(["a", "b", "c"]);
  });
});
