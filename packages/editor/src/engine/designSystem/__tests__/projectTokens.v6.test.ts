import { describe, it, expect, vi } from "vitest";
import { mergeProjectTokens } from "../projectTokens";
import { DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import { validateTokens } from "@buildrik/shared/schemas/design-tokens";

describe("mergeProjectTokens on v6", () => {
  it("migrates a v5 save and keeps the saved primary colour", () => {
    const saved = DEFAULT_TOKENS_V5.map((t) => (t.id === "color-primary" ? { ...t, value: "#C2410C" } : t));
    const merged = mergeProjectTokens(saved, 5);
    expect(resolveTokenLiteral(merged, "color-primary", "light")).toBe("#C2410C");
  });

  it("keeps a token the site added", () => {
    const added = { ...DEFAULT_TOKENS_V5[0], id: "my-brand", name: "Mine", cssVar: "--buildrick-design-my-brand", value: "#123456" };
    expect(mergeProjectTokens([...DEFAULT_TOKENS_V5, added], 5).some((t) => t.id === "my-brand")).toBe(true);
  });

  it("passes v6 input through unchanged", () => {
    const v6 = mergeProjectTokens(DEFAULT_TOKENS_V5, 5);
    expect(mergeProjectTokens(v6, 6)).toEqual(v6);
  });

  it("returns the seed, without throwing, for malformed v6 input", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    expect(mergeProjectTokens([{ id: 1 }], 6)).toEqual(DEFAULT_TOKENS);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("infers v5 when no version is given and migrates", () => {
    const saved = DEFAULT_TOKENS_V5.map((t) => (t.id === "color-primary" ? { ...t, value: "#C2410C" } : t));
    expect(resolveTokenLiteral(mergeProjectTokens(saved), "color-primary", "light")).toBe("#C2410C");
  });

  it("returns the seed for a v5 row whose id fails the v6 id rule", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const bad = { ...DEFAULT_TOKENS_V5[0], id: "My Token" };
    expect(mergeProjectTokens([...DEFAULT_TOKENS_V5, bad], 5)).toEqual(DEFAULT_TOKENS);
    warn.mockRestore();
  });

  it("seed passes validateTokens", () => {
    expect(validateTokens(DEFAULT_TOKENS).ok).toBe(true);
  });

  it("carries a v1 save through the whole chain to v6", () => {
    const v1 = [{
      id: "color-primary", name: "Primary", value: "#3B82F6", category: "colors",
      cssVar: "--buildrick-design-color-primary", type: "color",
    }];
    expect(resolveTokenLiteral(mergeProjectTokens(v1, 1), "color-primary", "light")).toBe("#3B82F6");
  });
});
