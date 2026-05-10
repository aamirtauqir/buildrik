/**
 * usePresetsForCategory — factory hook for a single PresetCategory's presets.
 *
 * Mirrors useTokensForKind shape so the StylePresetRegistryContext can fan
 * out 11 categories the same way TokenRegistryContext fans out 14 kinds.
 *
 * Persistence: this hook tracks `presets` (live) vs `savedPresets` (last
 * Apply). Diff-based isDirty matches the token-side contract — additions,
 * modifications, and deletions all light dirty. Apply runs through the
 * containing context's persistAll → composer.setProjectSettings.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { PresetCategory, StylePreset } from "../types";

interface PresetsForCategoryState {
  presets: StylePreset[];
  savedPresets: StylePreset[];
  isDirty: boolean;
}

interface PresetsForCategoryActions {
  updatePreset: (id: string, patch: Partial<Omit<StylePreset, "id" | "category">>) => void;
  addPreset: (preset: StylePreset) => void;
  deletePreset: (id: string) => void;
  markSaved: () => void;
  discardAll: () => void;
  /** Replace presets + savedPresets for THIS category from an external multi-category set. */
  hydrateFromExternal: (allPresets: StylePreset[]) => void;
}

export type PresetsForCategoryRegistry = PresetsForCategoryState & PresetsForCategoryActions;

function presetsEqual(a: StylePreset[], b: StylePreset[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i];
    const y = b.find((p) => p.id === x.id);
    if (!y) return false;
    if (x.friendlyName !== y.friendlyName) return false;
    if (x.variant !== y.variant) return false;
    // Bindings: shallow compare on cssProperty → tokenId pairs.
    const xKeys = Object.keys(x.bindings);
    const yKeys = Object.keys(y.bindings);
    if (xKeys.length !== yKeys.length) return false;
    for (const k of xKeys) {
      if (x.bindings[k]?.tokenId !== y.bindings[k]?.tokenId) return false;
    }
  }
  return true;
}

export function usePresetsForCategory(
  category: PresetCategory,
  initialPresets: StylePreset[],
): PresetsForCategoryRegistry {
  const seed = React.useMemo(
    () => initialPresets.filter((p) => p.category === category),
    [initialPresets, category],
  );

  const [presets, setPresets] = React.useState<StylePreset[]>(seed);
  const [savedPresets, setSavedPresets] = React.useState<StylePreset[]>(seed);

  const isDirty = !presetsEqual(presets, savedPresets);

  const updatePreset = React.useCallback(
    (id: string, patch: Partial<Omit<StylePreset, "id" | "category">>) => {
      setPresets((prev) => {
        const idx = prev.findIndex((p) => p.id === id);
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...patch };
        return next;
      });
    },
    [],
  );

  const addPreset = React.useCallback((preset: StylePreset) => {
    setPresets((prev) => (prev.some((p) => p.id === preset.id) ? prev : [...prev, preset]));
  }, []);

  const deletePreset = React.useCallback((id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Use functional setter to read latest `presets` synchronously — needed
  // when callers chain markSaved right after updatePreset in the same event
  // handler. See feedback_setter_closure_stale_state.md for prior incidents.
  const markSaved = React.useCallback(() => {
    setPresets((latest) => {
      setSavedPresets(latest);
      return latest;
    });
  }, []);

  const discardAll = React.useCallback(() => {
    setSavedPresets((latestSaved) => {
      setPresets(latestSaved);
      return latestSaved;
    });
  }, []);

  const hydrateFromExternal = React.useCallback(
    (allPresets: StylePreset[]) => {
      const filtered = allPresets.filter((p) => p.category === category);
      setPresets(filtered);
      setSavedPresets(filtered);
    },
    [category],
  );

  return {
    presets,
    savedPresets,
    isDirty,
    updatePreset,
    addPreset,
    deletePreset,
    markSaved,
    discardAll,
    hydrateFromExternal,
  };
}
