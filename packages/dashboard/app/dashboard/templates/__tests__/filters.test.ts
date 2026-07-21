import { describe, it, expect } from "vitest";
import {
  templateFiltersFromParams,
  templateFiltersToQuery,
  DEFAULT_TEMPLATE_FILTERS,
} from "../filters";

describe("templateFiltersFromParams", () => {
  it("returns defaults for empty params", () => {
    expect(templateFiltersFromParams(new URLSearchParams())).toEqual(DEFAULT_TEMPLATE_FILTERS);
  });

  it("reads valid values", () => {
    const f = templateFiltersFromParams(
      new URLSearchParams("category=BUSINESS&difficulty=ADVANCED&sort=newest&search=cafe&page=3")
    );
    expect(f).toEqual({ category: "BUSINESS", difficulty: "ADVANCED", sort: "newest", search: "cafe", page: 3 });
  });

  it("falls back on invalid enum values", () => {
    const f = templateFiltersFromParams(new URLSearchParams("category=NOPE&difficulty=X&sort=Y"));
    expect(f.category).toBe("ALL");
    expect(f.difficulty).toBe("ALL");
    expect(f.sort).toBe("popular");
  });

  it("clamps a bad page to 1", () => {
    expect(templateFiltersFromParams(new URLSearchParams("page=0")).page).toBe(1);
    expect(templateFiltersFromParams(new URLSearchParams("page=-4")).page).toBe(1);
    expect(templateFiltersFromParams(new URLSearchParams("page=abc")).page).toBe(1);
  });
});

describe("templateFiltersToQuery", () => {
  it("omits defaults", () => {
    expect(templateFiltersToQuery(DEFAULT_TEMPLATE_FILTERS)).toBe("");
  });

  it("serializes only non-defaults", () => {
    expect(
      templateFiltersToQuery({ category: "BLOG", difficulty: "ALL", sort: "popular", search: "  hi ", page: 2 })
    ).toBe("?category=BLOG&search=hi&page=2");
  });
});
