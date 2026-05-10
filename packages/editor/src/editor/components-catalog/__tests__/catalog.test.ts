import { describe, it, expect } from "vitest";
import { CATALOG } from "../catalog";
import { DEFAULT_TOKENS } from "@/editor/design-system/constants";

describe("CATALOG", () => {
  it("ships at least one component per tier", () => {
    const tiers = new Set(CATALOG.map((c) => c.category));
    expect(tiers.has("atom")).toBe(true);
    expect(tiers.has("molecule")).toBe(true);
    expect(tiers.has("organism")).toBe(true);
  });

  it("has unique component ids", () => {
    const ids = CATALOG.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every variant in defaultBindings appears in variants[]", () => {
    for (const c of CATALOG) {
      const declared = new Set(c.variants);
      for (const variantKey of Object.keys(c.defaultBindings)) {
        expect(declared.has(variantKey), `${c.id}: defaultBindings has unknown variant "${variantKey}"`).toBe(true);
      }
    }
  });

  it("every binding tokenId resolves against DEFAULT_TOKENS", () => {
    const tokenIds = new Set(DEFAULT_TOKENS.map((t) => t.id));
    for (const c of CATALOG) {
      for (const [variant, bindings] of Object.entries(c.defaultBindings)) {
        for (const [css, b] of Object.entries(bindings)) {
          expect(
            tokenIds.has(b.tokenId),
            `${c.id}.${variant}.${css} → unknown token "${b.tokenId}"`,
          ).toBe(true);
        }
      }
    }
  });

  it("every variant has at least one binding", () => {
    for (const c of CATALOG) {
      for (const [variant, bindings] of Object.entries(c.defaultBindings)) {
        expect(
          Object.keys(bindings).length,
          `${c.id}.${variant} has empty bindings`,
        ).toBeGreaterThan(0);
      }
    }
  });
});
