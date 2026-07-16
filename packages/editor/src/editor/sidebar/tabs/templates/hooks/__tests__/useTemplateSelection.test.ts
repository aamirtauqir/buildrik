// @vitest-environment jsdom
/**
 * useTemplateSelection — filter + pagination pure-logic tests.
 *
 * Covers the category/type pills → templateType sync, name/subCategory/search
 * filtering, the my-templates localStorage branch, and pagination bounds +
 * reset-on-filter-change. Rendered via renderHook (no DOM assertions needed).
 *
 * @license BSD-3-Clause
 */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTemplateSelection } from "../useTemplateSelection";
import { SITE_TEMPLATES } from "../../templatesData";
import { STORAGE_KEYS } from "@/shared/constants/storageKeys";

const PAGE_SIZE = 6;
const TOTAL = SITE_TEMPLATES.length; // 10 in current data

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useTemplateSelection — defaults", () => {
  it("starts on 'all' with the full template set on page 1", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    expect(result.current.activeFilter).toBe("all");
    expect(result.current.templateType).toBe(null);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.filteredTemplates.length).toBe(TOTAL);
    expect(result.current.totalPages).toBe(Math.ceil(TOTAL / PAGE_SIZE));
    expect(result.current.paginatedTemplates.length).toBe(PAGE_SIZE);
  });
});

describe("useTemplateSelection — search filter", () => {
  it("matches template names case-insensitively", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setSearchQ("saas"));
    const names = result.current.filteredTemplates.map((t) => t.name);
    expect(names).toEqual(["SaaS Landing", "SaaS Pro"]);
  });

  it("ignores case for the query (E-COMMERCE → E-Commerce)", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setSearchQ("E-COMMERCE"));
    expect(result.current.filteredTemplates.map((t) => t.name)).toEqual(["E-Commerce"]);
  });

  it("returns empty list but keeps totalPages at a floor of 1 for no matches", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setSearchQ("zzznotatemplate"));
    expect(result.current.filteredTemplates).toHaveLength(0);
    expect(result.current.paginatedTemplates).toHaveLength(0);
    expect(result.current.totalPages).toBe(1);
  });
});

describe("useTemplateSelection — subCategory filter", () => {
  it("narrows to templates tagged with the selected subCategory", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setSubCategory("hero"));
    // site-portfolio is the only 'hero' subCategory template in current data.
    expect(result.current.filteredTemplates.map((t) => t.id)).toEqual(["site-portfolio"]);

    act(() => result.current.setSubCategory("features"));
    expect(result.current.filteredTemplates.map((t) => t.id)).toEqual(["site-saas-landing"]);
  });

  it("returns nothing when no template carries the subCategory", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setSubCategory("footer"));
    expect(result.current.filteredTemplates).toHaveLength(0);
  });
});

describe("useTemplateSelection — pill → templateType sync", () => {
  it("auto-derives templateType from the active category pill", () => {
    const { result } = renderHook(() => useTemplateSelection(false));

    act(() => result.current.setActiveFilter("site-pages"));
    expect(result.current.templateType).toBe("page");

    act(() => result.current.setActiveFilter("sections"));
    expect(result.current.templateType).toBe("section");

    act(() => result.current.setActiveFilter("all"));
    expect(result.current.templateType).toBe(null);
  });

  it("filters by templateType — no current SITE_TEMPLATE is type 'section', so 'sections' yields none", () => {
    // Every SITE_TEMPLATES entry is type "hero"; selecting the Sections pill
    // sets templateType="section", which none match. This pins the type
    // filter's exclusion behaviour, not a defect in the hook.
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setActiveFilter("sections"));
    expect(result.current.filteredTemplates).toHaveLength(0);
  });
});

describe("useTemplateSelection — pagination", () => {
  it("slices the current page and returns the tail on the last page", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    expect(result.current.paginatedTemplates).toHaveLength(PAGE_SIZE);

    act(() => result.current.setCurrentPage(2));
    expect(result.current.paginatedTemplates).toHaveLength(TOTAL - PAGE_SIZE);
    expect(result.current.paginatedTemplates.map((t) => t.id)).toEqual(
      SITE_TEMPLATES.slice(PAGE_SIZE).map((t) => t.id)
    );
  });

  it("resets to page 1 when the search query changes", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setCurrentPage(2));
    expect(result.current.currentPage).toBe(2);

    act(() => result.current.setSearchQ("s"));
    expect(result.current.currentPage).toBe(1);
  });

  it("resets to page 1 when the subCategory changes", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => result.current.setCurrentPage(2));
    act(() => result.current.setSubCategory("hero"));
    expect(result.current.currentPage).toBe(1);
  });
});

describe("useTemplateSelection — clearAll", () => {
  it("resets query, filter, type, subCategory, detail, and page", () => {
    const { result } = renderHook(() => useTemplateSelection(false));
    act(() => {
      result.current.setSearchQ("saas");
      result.current.setActiveFilter("site-pages");
      result.current.setSubCategory("hero");
      result.current.setDetailId("site-saas-landing");
      result.current.setCurrentPage(2);
    });
    act(() => result.current.clearAll());
    expect(result.current.searchQ).toBe("");
    expect(result.current.activeFilter).toBe("all");
    expect(result.current.templateType).toBe(null);
    expect(result.current.subCategory).toBe(null);
    expect(result.current.detailId).toBe(null);
    expect(result.current.currentPage).toBe(1);
  });
});

describe("useTemplateSelection — my-templates branch", () => {
  it("reads user-saved templates from localStorage and searches within them", () => {
    localStorage.setItem(
      STORAGE_KEYS.MY_TEMPLATES,
      JSON.stringify([
        { id: "mt1", name: "My Hero", html: "<div>1</div>" },
        { id: "mt2", name: "My Footer", html: "<div>2</div>" },
      ])
    );
    const { result } = renderHook(() => useTemplateSelection(false));

    act(() => result.current.setActiveFilter("my-templates"));
    expect(result.current.filteredTemplates.map((t) => t.id)).toEqual(["mt1", "mt2"]);

    act(() => result.current.setSearchQ("hero"));
    expect(result.current.filteredTemplates.map((t) => t.name)).toEqual(["My Hero"]);
  });
});
