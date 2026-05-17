import { describe, it, expect } from "vitest";
import { tokenIsSemantic, filterTokensByMode } from "../semanticKind";
import type { DesignToken } from "../../types";

function makeToken(id: string, overrides: Partial<DesignToken> = {}): DesignToken {
  return {
    id, name: id, value: "#000",
    category: "colors", cssVar: `--bd-${id}`, type: "color", kind: "color",
    ...overrides,
  };
}

describe("tokenIsSemantic", () => {
  it("returns false for a token without semanticKind", () => {
    expect(tokenIsSemantic(makeToken("color.brand.primary"))).toBe(false);
  });

  it("returns true for a token with semanticKind = 'action'", () => {
    expect(tokenIsSemantic(makeToken("action.default", { semanticKind: "action", aliasOf: "color.brand.primary" }))).toBe(true);
  });

  it("returns true for each of action/surface/text/feedback", () => {
    const kinds: Array<"action" | "surface" | "text" | "feedback"> = ["action", "surface", "text", "feedback"];
    for (const sk of kinds) {
      expect(tokenIsSemantic(makeToken(`x.${sk}`, { semanticKind: sk, aliasOf: "x" }))).toBe(true);
    }
  });
});

describe("filterTokensByMode", () => {
  const tokens: DesignToken[] = [
    makeToken("color.brand.primary"),                                          // primitive
    makeToken("color.brand.secondary"),                                        // primitive
    makeToken("action.default", { semanticKind: "action", aliasOf: "color.brand.primary" }), // semantic
    makeToken("surface.card", { semanticKind: "surface", aliasOf: "color.brand.secondary" }), // semantic
  ];

  it("'pro' mode returns ALL tokens (primitives + semantics)", () => {
    const result = filterTokensByMode(tokens, "pro");
    expect(result.map((t) => t.id)).toEqual([
      "color.brand.primary",
      "color.brand.secondary",
      "action.default",
      "surface.card",
    ]);
  });

  it("'beginner' mode returns ONLY semantic tokens", () => {
    const result = filterTokensByMode(tokens, "beginner");
    expect(result.map((t) => t.id)).toEqual(["action.default", "surface.card"]);
  });

  it("'beginner' mode returns empty array when no semantics exist", () => {
    const primitivesOnly = [makeToken("color.brand.primary"), makeToken("color.brand.secondary")];
    expect(filterTokensByMode(primitivesOnly, "beginner")).toEqual([]);
  });

  it("'pro' mode returns empty array when input is empty", () => {
    expect(filterTokensByMode([], "pro")).toEqual([]);
  });
});
