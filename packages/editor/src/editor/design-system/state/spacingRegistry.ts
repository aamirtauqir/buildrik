/**
 * spacingRegistry — the spacing kind + its preset actions (`spacingRegistry`),
 * built over the project's tokens and the provider's one commit. No JSX.
 * @license BSD-3-Clause
 */

import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "../types";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { kindRegistry } from "./useTokensForKind";

export type SpacingPreset = "compact" | "normal" | "spacious";

/** Explicit pixel values per preset — all values on the 4px grid */
const PRESET_VALUES: Record<SpacingPreset, Record<string, number>> = {
  compact: {
    "space-1": 2, "space-2": 6, "space-3": 8, "space-4": 12,
    "space-5": 16, "space-6": 20, "space-8": 24, "space-10": 32, "space-12": 40,
  },
  normal: {
    "space-1": 4, "space-2": 8, "space-3": 12, "space-4": 16,
    "space-5": 20, "space-6": 24, "space-8": 32, "space-10": 40, "space-12": 48,
  },
  spacious: {
    "space-1": 6, "space-2": 12, "space-3": 16, "space-4": 20,
    "space-5": 24, "space-6": 32, "space-8": 40, "space-10": 48, "space-12": 64,
  },
};

function applyPresetToTokens(tokens: DesignToken[], preset: SpacingPreset): DesignToken[] {
  const values = PRESET_VALUES[preset];
  return tokens.reduce((acc, t) => {
    const px = values[t.id];
    return px === undefined ? acc : setTokenLiteral(acc, t.id, "light", `${px}px`);
  }, tokens);
}

/** The preset every spacing token currently matches, or null once any has been hand-edited. */
function presetOf(tokens: readonly DesignToken[]): SpacingPreset | null {
  const presets = Object.keys(PRESET_VALUES) as SpacingPreset[];
  return (
    presets.find((p) =>
      Object.entries(PRESET_VALUES[p]).every(
        ([id, px]) => !tokens.some((t) => t.id === id) || resolveTokenLiteral(tokens, id, "light") === `${px}px`,
      ),
    ) ?? null
  );
}

/** Spacing is a kind like any other, plus Brand's ⋯ menu: apply a whole
 *  preset, or put the seed spacing back — each one write, one ⌘Z. */
export function spacingRegistry(all: DesignToken[], commit: (next: DesignToken[], label: string) => boolean) {
  const base = kindRegistry("spacing", all, commit);
  return {
    ...base,
    activePreset: presetOf(base.tokens),
    applyPreset: (preset: SpacingPreset) => commit(applyPresetToTokens(all, preset), "Apply spacing preset"),
    resetToDefaults: () =>
      commit(
        [...all.filter((t) => t.kind !== "spacing"), ...DEFAULT_TOKENS.filter((t) => t.kind === "spacing")],
        "Reset spacing",
      ),
  };
}

export type SpacingRegistry = ReturnType<typeof spacingRegistry>;
