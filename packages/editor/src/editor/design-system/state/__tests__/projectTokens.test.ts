/**
 * mergeProjectTokens — the site's saved tokens over the seed.
 *
 * Regression (2026-09-24): a dark value saved through Brand's Apply was
 * dropped on the next load, because the merge copied `value` only.
 */
import { describe, it, expect } from "vitest";
import { mergeProjectTokens } from "../projectTokens";
import { DEFAULT_TOKENS } from "../../constants";
import type { DesignToken } from "../../types";

const action = DEFAULT_TOKENS.find((t) => t.id === "color-action")!;

describe("mergeProjectTokens", () => {
  it("keeps a saved dark value across the reload merge", () => {
    const saved = [{ ...action, value: "#C81E1E", darkValue: "#76A9FA" }] as DesignToken[];
    const merged = mergeProjectTokens(saved).find((t) => t.id === "color-action")!;
    expect(merged.value).toBe("#C81E1E");
    expect(merged.darkValue).toBe("#76A9FA");
  });

  it("a saved row with no dark value keeps the seed's", () => {
    const saved = [{ id: action.id, name: action.name, value: "#C81E1E" }] as DesignToken[];
    const merged = mergeProjectTokens(saved).find((t) => t.id === "color-action")!;
    expect(merged.value).toBe("#C81E1E");
    expect(merged.darkValue).toBe(action.darkValue);
  });

  it("unsaved tokens are the seed, untouched", () => {
    const merged = mergeProjectTokens([]);
    expect(merged).toEqual(DEFAULT_TOKENS);
  });
});

describe("mergeProjectTokens — added tokens", () => {
  it("keeps a token the site added (not in the seed) across the reload merge", () => {
    const pink = { id: "color-brand-pink", name: "Brand Pink", value: "#E74694", category: "colors", cssVar: "--buildrick-design-color-brand-pink", type: "color", group: "brand" } as DesignToken;
    const merged = mergeProjectTokens([pink]);
    expect(merged.find((t) => t.id === "color-brand-pink")?.value).toBe("#E74694");
    expect(merged).toHaveLength(DEFAULT_TOKENS.length + 1);
  });
});
