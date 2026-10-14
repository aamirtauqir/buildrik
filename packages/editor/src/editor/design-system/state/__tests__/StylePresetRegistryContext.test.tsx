import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import {
  StylePresetRegistryProvider,
  useButtonPresets,
  useCardPresets,
  useResetAllPresets,
  PRESET_CATEGORIES,
} from "../StylePresetRegistryContext";
import type { StylePreset } from "@/editor/design-system/types";

const wrap = ({ children }: { children: React.ReactNode }) => (
  <StylePresetRegistryProvider projectId="preset-test">{children}</StylePresetRegistryProvider>
);

const mk = (id: string, category: StylePreset["category"]): StylePreset => ({
  id,
  friendlyName: id,
  category,
  variant: "primary",
  bindings: {},
});

beforeEach(() => {
  localStorage.clear();
});

describe("StylePresetRegistryContext", () => {
  it("exposes 11 PRESET_CATEGORIES matching the type union", () => {
    expect(PRESET_CATEGORIES).toHaveLength(11);
    expect(PRESET_CATEGORIES).toContain("button");
    expect(PRESET_CATEGORIES).toContain("layout");
  });

  it("loads presets from localStorage seeded blob", () => {
    localStorage.setItem(
      "buildrick-design-presets-preset-test-v1",
      JSON.stringify({ schemaVersion: 1, presets: [mk("button-primary", "button")] }),
    );
    const { result } = renderHook(() => useButtonPresets(), { wrapper: wrap });
    expect(result.current.presets).toHaveLength(1);
    expect(result.current.presets[0].id).toBe("button-primary");
  });

  it("falls back to DEFAULT_PRESETS when localStorage is empty", () => {
    const { result } = renderHook(() => useButtonPresets(), { wrapper: wrap });
    // DEFAULT_PRESETS is [] until E4 populates it; assertion is shape, not count.
    expect(Array.isArray(result.current.presets)).toBe(true);
  });

  it("isolated per category — cards don't see button presets", () => {
    localStorage.setItem(
      "buildrick-design-presets-preset-test-v1",
      JSON.stringify({
        schemaVersion: 1,
        presets: [mk("button-primary", "button"), mk("card-elevated", "card")],
      }),
    );
    const { result } = renderHook(
      () => ({ button: useButtonPresets(), card: useCardPresets() }),
      { wrapper: wrap },
    );
    expect(result.current.button.presets.map((p) => p.id)).toEqual(["button-primary"]);
    expect(result.current.card.presets.map((p) => p.id)).toEqual(["card-elevated"]);
  });

  it("useResetAllPresets fans out across categories", () => {
    const { result } = renderHook(
      () => ({
        button: useButtonPresets(),
        card: useCardPresets(),
        reset: useResetAllPresets(),
      }),
      { wrapper: wrap },
    );
    act(() => {
      result.current.reset([mk("button-new", "button"), mk("card-new", "card")]);
    });
    expect(result.current.button.presets[0].id).toBe("button-new");
    expect(result.current.card.presets[0].id).toBe("card-new");
  });

});
