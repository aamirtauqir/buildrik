import { describe, it, expect } from "vitest";
import { mergeProjectTokens } from "../projectTokens";
import { DEFAULT_TOKENS_V5 } from "@/engine/designSystem/defaultTokens";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";

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
});
