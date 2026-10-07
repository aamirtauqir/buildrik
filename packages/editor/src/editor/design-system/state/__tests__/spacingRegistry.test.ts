/**
 * spacingRegistry — the three presets produce explicit, predictable pixel
 * values, each applied as ONE write; the active preset is read off the values
 * (a hand edit makes it "custom"), and Reset puts the seed spacing back.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { spacingRegistry } from "../spacingRegistry";
import { useProjectTokens } from "../useProjectTokens";
import type { DesignToken } from "@/editor/design-system/types";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { EVENTS } from "@/shared/constants/events";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

const SPACING_IDS = [
  "space-1", "space-2", "space-3", "space-4", "space-5",
  "space-6", "space-8", "space-10", "space-12",
] as const;

function fakeComposer() {
  const listeners = new Map<string, Set<() => void>>();
  let settings = { designTokens: DEFAULT_TOKENS, designTokensSchemaVersion: 6 };
  const composer = {
    getProjectSettings: () => settings,
    designSystem: {
      readOnly: false,
      setTokens: vi.fn((next: DesignToken[]) => {
        settings = { designTokens: next, designTokensSchemaVersion: 6 };
        listeners.get(EVENTS.SETTINGS_CHANGE)?.forEach((l) => l());
        return true;
      }),
    },
    on: (evt: string, l: () => void) => {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt)!.add(l);
    },
    off: (evt: string, l: () => void) => listeners.get(evt)?.delete(l),
  };
  return composer;
}

function getValues(tokens: DesignToken[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const id of SPACING_IDS) result[id] = parseFloat(resolveTokenLiteral(tokens, id, "light") ?? "");
  return result;
}

function setup() {
  const composer = fakeComposer();
  const hook = renderHook(() => {
    const { all, commit } = useProjectTokens(composer as never);
    return spacingRegistry(all, commit);
  });
  return { composer, result: hook.result };
}

describe("spacingRegistry presets", () => {
  it("compact preset produces expected values in one write", () => {
    const { composer, result } = setup();
    act(() => {
      result.current.applyPreset("compact");
    });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(1);
    expect(getValues(result.current.tokens)).toEqual({
      "space-1": 2, "space-2": 6, "space-3": 8, "space-4": 12,
      "space-5": 16, "space-6": 20, "space-8": 24, "space-10": 32, "space-12": 40,
    });
  });

  it("normal preset produces expected values", () => {
    const { result } = setup();
    act(() => {
      result.current.applyPreset("compact");
    });
    act(() => {
      result.current.applyPreset("normal");
    });
    expect(getValues(result.current.tokens)).toEqual({
      "space-1": 4, "space-2": 8, "space-3": 12, "space-4": 16,
      "space-5": 20, "space-6": 24, "space-8": 32, "space-10": 40, "space-12": 48,
    });
  });

  it("spacious preset produces expected values (all even numbers)", () => {
    const { result } = setup();
    act(() => {
      result.current.applyPreset("spacious");
    });
    const values = getValues(result.current.tokens);
    expect(values).toEqual({
      "space-1": 6, "space-2": 12, "space-3": 16, "space-4": 20,
      "space-5": 24, "space-6": 32, "space-8": 40, "space-10": 48, "space-12": 64,
    });
    Object.values(values).forEach((v) => expect(v % 2).toBe(0));
  });
});

describe("spacingRegistry — activePreset is read off the values", () => {
  it("the seed is the Normal preset", () => {
    const { result } = setup();
    expect(result.current.activePreset).toBe("normal");
  });

  it("applying a preset makes it active", () => {
    const { result } = setup();
    act(() => {
      result.current.applyPreset("compact");
    });
    expect(result.current.activePreset).toBe("compact");
  });

  it("a hand edit makes the scale custom (null)", () => {
    const { result } = setup();
    act(() => {
      result.current.applyPreset("spacious");
    });
    act(() => {
      result.current.updateToken("space-4", "99px");
    });
    expect(result.current.activePreset).toBeNull();
  });

  it("Reset puts the seed spacing back in one write", () => {
    const { composer, result } = setup();
    act(() => {
      result.current.applyPreset("spacious");
    });
    act(() => {
      result.current.resetToDefaults();
    });
    expect(composer.designSystem.setTokens).toHaveBeenCalledTimes(2);
    expect(result.current.activePreset).toBe("normal");
    expect(getValues(result.current.tokens)["space-1"]).toBe(4);
  });
});
