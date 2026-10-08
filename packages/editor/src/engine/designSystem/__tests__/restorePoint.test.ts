import { describe, it, expect } from "vitest";
import { resolveTokenLiteral, setTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@buildrik/shared/schemas/design-tokens";
import { DEFAULT_TOKENS, DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { restoredTokens } from "../restorePoint";

const custom: DesignToken = {
  id: "color-brand-x", name: "Brand X", kind: "color", layer: "semantic", modes: { light: { value: "#0E7490" } },
  category: "colors", cssVar: "--buildrick-design-color-brand-x", type: "color",
};
const none = { count: () => 0 as const };

describe("restoredTokens (spec §8, test 13)", () => {
  it("puts a v6 point back over the seed", () => {
    const saved = setTokenLiteral(DEFAULT_TOKENS, "color-primary", "light", "#C2410C");
    const out = restoredTokens({ designTokens: saved, tokensSchemaVersion: 6 }, DEFAULT_TOKENS, none);
    if (!out.ok) throw new Error(out.reason);
    expect(resolveTokenLiteral(out.tokens, "color-primary", "light")).toBe("#C2410C");
  });

  it("migrates an older point (theme-push / migration rows are v5) before restoring", () => {
    const out = restoredTokens({ designTokens: DEFAULT_TOKENS_V5, tokensSchemaVersion: 5 }, DEFAULT_TOKENS, none);
    expect(out.ok).toBe(true);
  });

  it("keeps an in-use token the snapshot does not have (1b removal guard would refuse otherwise)", () => {
    const out = restoredTokens({ designTokens: [], tokensSchemaVersion: 6 }, [...DEFAULT_TOKENS, custom], {
      count: (id) => (id === "color-brand-x" ? 2 : 0),
    });
    if (!out.ok) throw new Error(out.reason);
    expect(out.tokens.some((t) => t.id === "color-brand-x")).toBe(true);
  });

  it("drops an unused site-only token and refuses a point that does not validate", () => {
    const ok = restoredTokens({ designTokens: [], tokensSchemaVersion: 6 }, [...DEFAULT_TOKENS, custom], none);
    expect(ok.ok && ok.tokens.some((t) => t.id === "color-brand-x")).toBe(false);
    expect(restoredTokens({ designTokens: [{ id: "x" }], tokensSchemaVersion: 6 }, DEFAULT_TOKENS, none).ok).toBe(false);
  });
});
