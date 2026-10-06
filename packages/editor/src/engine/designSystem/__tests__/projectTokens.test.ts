/**
 * mergeProjectTokens — the site's saved tokens over the seed.
 *
 * Regression (2026-09-24): a dark value saved through Brand's Apply was
 * dropped on the next load, because the merge copied `value` only.
 */
import { describe, it, expect } from "vitest";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import { mergeProjectTokens } from "../projectTokens";
import { DEFAULT_TOKENS } from "../defaultTokens";
import { v6Token } from "@/engine/__tests__/test-utils/v6Token";

describe("mergeProjectTokens", () => {
  it("keeps a saved dark value across the reload merge", () => {
    const saved = setTokenLiteral(
      setTokenLiteral(DEFAULT_TOKENS, "color-action", "light", "#C81E1E"),
      "color-action", "dark", "#76A9FA",
    );
    const merged = mergeProjectTokens(saved);
    expect(resolveTokenLiteral(merged, "color-action", "light")).toBe("#C81E1E");
    expect(resolveTokenLiteral(merged, "color-action", "dark")).toBe("#76A9FA");
  });

  it("a saved light-only edit keeps the seed's dark value", () => {
    const saved = setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C81E1E");
    const merged = mergeProjectTokens(saved);
    expect(resolveTokenLiteral(merged, "color-primary", "light")).toBe("#C81E1E");
    expect(resolveTokenLiteral(merged, "color-primary", "dark")).toBe(
      resolveTokenLiteral(DEFAULT_TOKENS, "color-primary", "dark"),
    );
  });

  it("unsaved tokens are the seed, untouched", () => {
    const merged = mergeProjectTokens([]);
    expect(merged).toEqual(DEFAULT_TOKENS);
  });
});

describe("mergeProjectTokens — added tokens", () => {
  it("keeps a token the site added (not in the seed) across the reload merge", () => {
    const pink = v6Token({ id: "color-brand-pink", name: "Brand Pink", value: "#E74694", group: "brand" });
    const merged = mergeProjectTokens([pink]);
    expect(resolveTokenLiteral(merged, "color-brand-pink", "light")).toBe("#E74694");
    expect(merged).toHaveLength(DEFAULT_TOKENS.length + 1);
  });
});
