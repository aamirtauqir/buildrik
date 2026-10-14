import { describe, it, expect } from "vitest";
import { parseImportJSON, diffTokens } from "../importUtils";
import type { DesignToken } from "@/editor/design-system/types";
import type { LegacyDesignToken } from "@/engine/designSystem/types";
import { v6Token, type V6TokenSpec } from "@/engine/__tests__/test-utils/v6Token";

/** A row as a pre-v6 export wrote it. */
const legacy = (id: string, value: string, extra: Partial<LegacyDesignToken> = {}): LegacyDesignToken => ({
  id, name: id, value, category: "colors", cssVar: `--buildrick-design-${id}`, type: "color", ...extra,
});

const tok = (id: string, value: string, extra: Partial<V6TokenSpec> = {}): DesignToken => (v6Token({
  id,
  name: id,
  value,
  category: "colors",
  cssVar: `--buildrick-design-${id}`,
  type: "color",
  ...extra,
}));

describe("parseImportJSON", () => {
  it("parses versioned format { schemaVersion, tokens }", () => {
    const raw = JSON.stringify({ schemaVersion: 2, tokens: [legacy("color-brand", "#0055FF")] });
    const result = parseImportJSON(raw);
    expect(result.errors).toEqual([]);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].id).toBe("color-brand");
  });

  it("parses legacy array format", () => {
    const raw = JSON.stringify([legacy("color-brand", "#0055FF"), legacy("color-bg", "#FFFFFF")]);
    const result = parseImportJSON(raw);
    expect(result.errors).toEqual([]);
    expect(result.tokens).toHaveLength(2);
  });

  it("carries a legacy row's light and dark values into v6 modes, one token per row", () => {
    const raw = JSON.stringify([legacy("color-brand", "#0055FF", { darkValue: "#001133" })]);
    const [t] = parseImportJSON(raw).tokens;
    expect(t.modes).toEqual({ light: { value: "#0055FF" }, dark: { value: "#001133" } });
  });

  it("parses a v6 export (every row carries modes) as saved, aliases included", () => {
    const raw = JSON.stringify([tok("color-base", "#0055FF"), tok("color-brand", "", { alias: "color-base" })]);
    const result = parseImportJSON(raw);
    expect(result.errors).toEqual([]);
    expect(result.tokens.map((t) => t.id)).toEqual(["color-base", "color-brand"]);
  });

  it("rejects a v6 export whose alias points at a token it does not carry", () => {
    const raw = JSON.stringify([tok("color-brand", "", { alias: "color-missing" })]);
    expect(parseImportJSON(raw).errors[0]).toMatch(/color-missing/);
  });

  it("returns error on invalid JSON", () => {
    const result = parseImportJSON("{not json");
    expect(result.tokens).toEqual([]);
    expect(result.errors[0]).toMatch(/parse/i);
  });

  it("returns error on missing required field", () => {
    const raw = JSON.stringify([{ id: "x", value: "v" }]); // no cssVar / category / type
    const result = parseImportJSON(raw);
    expect(result.tokens).toEqual([]);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error when payload is neither array nor versioned object", () => {
    const raw = JSON.stringify({ random: true });
    const result = parseImportJSON(raw);
    expect(result.tokens).toEqual([]);
    expect(result.errors[0]).toMatch(/format/i);
  });

  it("rejects empty token arrays as malformed", () => {
    const raw = JSON.stringify([]);
    const result = parseImportJSON(raw);
    expect(result.tokens).toEqual([]);
    expect(result.errors[0]).toMatch(/empty/i);
  });
});

describe("diffTokens", () => {
  it("classifies new tokens as added", () => {
    const current = [tok("color-brand", "#0055FF")];
    const incoming = [tok("color-brand", "#0055FF"), tok("color-accent", "#FF00AA")];
    const diff = diffTokens(current, incoming);
    expect(diff.added.map((t) => t.id)).toEqual(["color-accent"]);
    expect(diff.modified).toEqual([]);
  });

  it("classifies value changes as modified with prev/next pair", () => {
    const current = [tok("color-brand", "#0055FF")];
    const incoming = [tok("color-brand", "#FF0000")];
    const diff = diffTokens(current, incoming);
    expect(diff.added).toEqual([]);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0].id).toBe("color-brand");
    expect(diff.modified[0].previousValue).toBe("#0055FF");
    expect(diff.modified[0].nextValue).toBe("#FF0000");
  });

  it("ignores tokens with identical values", () => {
    const current = [tok("color-brand", "#0055FF")];
    const incoming = [tok("color-brand", "#0055FF")];
    const diff = diffTokens(current, incoming);
    expect(diff.added).toEqual([]);
    expect(diff.modified).toEqual([]);
  });

  it("does not surface removals (v1 import never deletes)", () => {
    const current = [tok("color-brand", "#0055FF"), tok("color-bg", "#FFF")];
    const incoming = [tok("color-brand", "#0055FF")];
    const diff = diffTokens(current, incoming);
    expect(diff.added).toEqual([]);
    expect(diff.modified).toEqual([]);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // §2-B13 (FIXED) — diffTokens now compares darkValue alongside value. A
  // token whose incoming darkValue differs (light value identical) is
  // classified as modified, so the import UI surfaces the change and the dark
  // variant lands instead of silently disappearing.
  // ───────────────────────────────────────────────────────────────────────────
  describe("§2-B13 diffTokens compares darkValue (fixed)", () => {
    it("classifies a darkValue-only change as modified", () => {
      const current = [tok("color-brand", "#0055FF", { dark: "#001133" })];
      const incoming = [tok("color-brand", "#0055FF", { dark: "#FFFFFF" })];
      const diff = diffTokens(current, incoming);
      expect(diff.added).toEqual([]);
      expect(diff.modified).toHaveLength(1);
      expect(diff.modified[0].id).toBe("color-brand");
    });
  });
});
