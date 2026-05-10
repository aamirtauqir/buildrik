import { describe, it, expect } from "vitest";
import { parseImportJSON, diffTokens } from "../importUtils";
import type { DesignToken } from "../../types";

const tok = (id: string, value: string, extra: Partial<DesignToken> = {}): DesignToken => ({
  id,
  name: id,
  value,
  category: "colors",
  cssVar: `--buildrick-design-${id}`,
  type: "color",
  ...extra,
});

describe("parseImportJSON", () => {
  it("parses versioned format { schemaVersion, tokens }", () => {
    const raw = JSON.stringify({ schemaVersion: 2, tokens: [tok("color-brand", "#0055FF")] });
    const result = parseImportJSON(raw);
    expect(result.errors).toEqual([]);
    expect(result.tokens).toHaveLength(1);
    expect(result.tokens[0].id).toBe("color-brand");
  });

  it("parses legacy array format", () => {
    const raw = JSON.stringify([tok("color-brand", "#0055FF"), tok("color-bg", "#FFFFFF")]);
    const result = parseImportJSON(raw);
    expect(result.errors).toEqual([]);
    expect(result.tokens).toHaveLength(2);
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
});
