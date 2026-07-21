import { describe, it, expect } from "vitest";
import { paginationRange } from "../pagination-range";

describe("paginationRange", () => {
  it("lists every page when total is small", () => {
    expect(paginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("caps with ellipses in the middle", () => {
    expect(paginationRange(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
  });

  it("does not add a left ellipsis near the start", () => {
    expect(paginationRange(2, 12)).toEqual([1, 2, 3, "…", 12]);
  });

  it("does not add a right ellipsis near the end", () => {
    expect(paginationRange(11, 12)).toEqual([1, "…", 10, 11, 12]);
  });

  it("returns [1] for a single page", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
  });
});
