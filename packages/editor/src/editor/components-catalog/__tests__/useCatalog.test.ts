import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCatalog } from "../useCatalog";

describe("useCatalog", () => {
  it("all returns the full catalog", () => {
    const { result } = renderHook(() => useCatalog());
    expect(result.current.all.length).toBeGreaterThan(0);
  });

  it("getById returns undefined for unknown id", () => {
    const { result } = renderHook(() => useCatalog());
    expect(result.current.getById("nonsense")).toBeUndefined();
  });

  it("getById returns the matching ComponentType", () => {
    const { result } = renderHook(() => useCatalog());
    expect(result.current.getById("button")?.name).toBe("Button");
  });

  it("filterByTier returns only that tier", () => {
    const { result } = renderHook(() => useCatalog());
    const atoms = result.current.filterByTier("atom");
    expect(atoms.length).toBeGreaterThan(0);
    expect(atoms.every((c) => c.category === "atom")).toBe(true);
  });

  it("search('butt') matches Button by name", () => {
    const { result } = renderHook(() => useCatalog());
    const matches = result.current.search("butt");
    expect(matches.find((c) => c.id === "button")).toBeTruthy();
  });

  it("empty search returns full catalog", () => {
    const { result } = renderHook(() => useCatalog());
    expect(result.current.search("").length).toBe(result.current.all.length);
  });
});
