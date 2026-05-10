import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePresetsForCategory } from "../usePresetsForCategory";
import type { StylePreset } from "../../types";

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

  it("updatePreset patches a preset's friendlyName", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    act(() => {
      result.current.updatePreset("button-primary", { friendlyName: "Renamed" });
    });
    expect(result.current.presets.find((p) => p.id === "button-primary")?.friendlyName).toBe("Renamed");
    expect(result.current.isDirty).toBe(true);
  });

  it("addPreset appends a new preset to the category", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    const before = result.current.presets.length;
    act(() => {
      result.current.addPreset(mk("button-secondary", "button", "secondary"));
    });
    expect(result.current.presets).toHaveLength(before + 1);
    expect(result.current.isDirty).toBe(true);
  });

  it("deletePreset removes by id", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    act(() => {
      result.current.deletePreset("button-ghost");
    });
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-primary"]);
    expect(result.current.isDirty).toBe(true);
  });

  it("markSaved snapshots current state as savedPresets", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    act(() => {
      result.current.updatePreset("button-primary", { friendlyName: "Edit" });
      result.current.markSaved();
    });
    expect(result.current.isDirty).toBe(false);
  });

  it("discardAll reverts to savedPresets", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    act(() => {
      result.current.updatePreset("button-primary", { friendlyName: "Edit" });
      result.current.discardAll();
    });
    expect(result.current.presets.find((p) => p.id === "button-primary")?.friendlyName).toBe("button-primary");
    expect(result.current.isDirty).toBe(false);
  });

  it("hydrateFromExternal replaces presets + saved snapshot", () => {
    const { result } = renderHook(() => usePresetsForCategory("button", seed));
    act(() => {
      result.current.hydrateFromExternal([
        mk("button-replaced", "button", "primary"),
        mk("card-stays-out", "card"),
      ]);
    });
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-replaced"]);
    expect(result.current.isDirty).toBe(false);
  });
});
