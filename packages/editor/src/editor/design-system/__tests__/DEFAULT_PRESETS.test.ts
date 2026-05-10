import { describe, it, expect } from "vitest";
import { DEFAULT_PRESETS, DEFAULT_TOKENS } from "../constants";
import { PRESET_CATEGORIES } from "../state/StylePresetRegistryContext";

describe("DEFAULT_PRESETS", () => {
  it("has at least one preset for every category", () => {
    const tokenIds = new Set(DEFAULT_TOKENS.map((t) => t.id));
    const seenCategories = new Set(DEFAULT_PRESETS.map((p) => p.category));
    for (const c of PRESET_CATEGORIES) {
      expect(seenCategories.has(c), `category "${c}" missing from DEFAULT_PRESETS`).toBe(true);
    }
    // Sanity: every binding tokenId resolves against DEFAULT_TOKENS.
    for (const preset of DEFAULT_PRESETS) {
      for (const [css, b] of Object.entries(preset.bindings)) {
        expect(tokenIds.has(b.tokenId), `${preset.id}.${css} → unknown token "${b.tokenId}"`).toBe(true);
      }
    }
  });

  it("has unique preset ids", () => {
    const ids = DEFAULT_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every preset has at least one binding", () => {
    for (const p of DEFAULT_PRESETS) {
      expect(Object.keys(p.bindings).length, `${p.id} has no bindings`).toBeGreaterThan(0);
    }
  });
});
