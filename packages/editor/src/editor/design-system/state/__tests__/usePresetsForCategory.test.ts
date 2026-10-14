import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePresetsForCategory } from "../usePresetsForCategory";
import type { StylePreset } from "@/editor/design-system/types";

const mk = (id: string, category: StylePreset["category"], variant = "primary"): StylePreset => ({
  id,
  friendlyName: id,
  category,
  variant,
  bindings: {},
});

const seed: StylePreset[] = [
  mk("button-primary", "button", "primary"),
  mk("button-ghost", "button", "ghost"),
  mk("card-elevated", "card", "elevated"),
];

describe("usePresetsForCategory", () => {
  it("filters seed presets to its own category", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-primary", "button-ghost"]);
  });

  it("hydrateFromExternal replaces the category's presets", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    act(() => {
      result.current.hydrateFromExternal([
        mk("button-replaced", "button", "primary"),
        mk("card-stays-out", "card"),
      ]);
    });
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-replaced"]);
  });
});
