import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as React from "react";
import type { Composer } from "@/engine";
import {
  StylePresetRegistryProvider,
  useButtonPresets,
  useCardPresets,
  PRESET_CATEGORIES,
} from "../StylePresetRegistryContext";
import { DEFAULT_PRESETS } from "@/editor/design-system/constants";
import type { StylePreset } from "@/editor/design-system/types";

const mk = (id: string, category: StylePreset["category"]): StylePreset => ({
  id,
  friendlyName: id,
  category,
  variant: "primary",
  bindings: {},
});

/** Just enough composer: project settings plus the settings-change event. */
function fakeComposer(designPresets?: StylePreset[]) {
  let settings: { designPresets?: StylePreset[] } = { designPresets };
  const handlers = new Map<string, Set<() => void>>();
  const composer = {
    getProjectSettings: () => settings,
    on: (e: string, h: () => void) => {
      if (!handlers.has(e)) handlers.set(e, new Set());
      handlers.get(e)!.add(h);
    },
    off: (e: string, h: () => void) => handlers.get(e)?.delete(h),
  };
  const setPresets = (next: StylePreset[]) => {
    settings = { designPresets: next };
    handlers.get("settings:change")?.forEach((h) => h());
  };
  return { composer: composer as unknown as Composer, setPresets };
}

const wrapWith = (composer: Composer | null) =>
  function Wrap({ children }: { children: React.ReactNode }) {
    return <StylePresetRegistryProvider composer={composer}>{children}</StylePresetRegistryProvider>;
  };

beforeEach(() => {
  localStorage.clear();
});

describe("StylePresetRegistryContext", () => {
  it("exposes 11 PRESET_CATEGORIES matching the type union", () => {
    expect(PRESET_CATEGORIES).toHaveLength(11);
    expect(PRESET_CATEGORIES).toContain("button");
    expect(PRESET_CATEGORIES).toContain("layout");
  });

  it("reads the project's designPresets (B-3)", () => {
    const { composer } = fakeComposer([mk("button-primary", "button")]);
    const { result } = renderHook(() => useButtonPresets(), { wrapper: wrapWith(composer) });
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-primary"]);
  });

  it("ignores the old per-browser cache (B-3)", () => {
    localStorage.setItem(
      "buildrick-design-presets-default-v1",
      JSON.stringify({ schemaVersion: 1, presets: [mk("from-cache", "button")] }),
    );
    const { composer } = fakeComposer([mk("from-project", "button")]);
    const { result } = renderHook(() => useButtonPresets(), { wrapper: wrapWith(composer) });
    expect(result.current.presets.map((p) => p.id)).toEqual(["from-project"]);
  });

  it("falls back to DEFAULT_PRESETS when the project has none", () => {
    const { composer } = fakeComposer(undefined);
    const { result } = renderHook(() => useButtonPresets(), { wrapper: wrapWith(composer) });
    expect(result.current.presets).toEqual(DEFAULT_PRESETS.filter((p) => p.category === "button"));
  });

  it("isolated per category — cards don't see button presets", () => {
    const { composer } = fakeComposer([mk("button-primary", "button"), mk("card-elevated", "card")]);
    const { result } = renderHook(
      () => ({ button: useButtonPresets(), card: useCardPresets() }),
      { wrapper: wrapWith(composer) },
    );
    expect(result.current.button.presets.map((p) => p.id)).toEqual(["button-primary"]);
    expect(result.current.card.presets.map((p) => p.id)).toEqual(["card-elevated"]);
  });

  it("re-reads on a settings change (undo, restore, another write)", () => {
    const { composer, setPresets } = fakeComposer([mk("button-old", "button")]);
    const { result } = renderHook(() => useButtonPresets(), { wrapper: wrapWith(composer) });
    act(() => setPresets([mk("button-new", "button")]));
    expect(result.current.presets.map((p) => p.id)).toEqual(["button-new"]);
  });
});
