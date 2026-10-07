/**
 * usePresetsForCategory — factory hook for a single PresetCategory's presets.
 *
 * Mirrors the token registries' per-kind shape so the StylePresetRegistryContext
 * fans out 11 categories. The list is seeded from the provider's cache (or
 * DEFAULT_PRESETS) and can be replaced wholesale by `hydrateFromExternal`.
 * There is no staging and no Save: Brand Part 1a (Task 10) removed both, and
 * nothing in the UI edits a preset yet (boards.json 306:2161).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetCategory, StylePreset } from "../types";

export interface PresetsForCategoryRegistry {
  presets: StylePreset[];
  /** Replace THIS category's presets from an external multi-category set. */
  hydrateFromExternal: (allPresets: StylePreset[]) => void;
}

export function usePresetsForCategory(
  category: PresetCategory,
  initialPresets: StylePreset[],
): PresetsForCategoryRegistry {
  const [presets, setPresets] = React.useState<StylePreset[]>(() =>
    initialPresets.filter((p) => p.category === category),
  );

  const hydrateFromExternal = React.useCallback(
    (allPresets: StylePreset[]) => setPresets(allPresets.filter((p) => p.category === category)),
    [category],
  );

  return { presets, hydrateFromExternal };
}
