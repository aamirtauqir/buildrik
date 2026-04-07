import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBuildTab } from "./useBuildTab";

// Mock localStorage + sessionStorage
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe("useBuildTab — search clear restores categories", () => {
  it("restores open categories after clearing search", () => {
    const { result } = renderHook(() => useBuildTab(null, undefined));

    // Open a category
    act(() => {
      result.current.toggleCat("basic");
    });
    expect(result.current.openCats.has("basic")).toBe(true);

    // Start searching — this should remember the open cats
    act(() => {
      result.current.setSearchQuery("button");
    });
    expect(result.current.searchQuery).toBe("button");

    // Clear search
    act(() => {
      result.current.setSearchQuery("");
    });

    // Open cats should be restored
    expect(result.current.openCats.has("basic")).toBe(true);
  });
});
