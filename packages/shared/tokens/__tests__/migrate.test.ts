// packages/shared/tokens/__tests__/migrate.test.ts
import { describe, it, expect } from "vitest";
import { migrateTokensToV6, TokenMigrationError } from "../migrate";
import { resolveTokenLiteral } from "../resolve";
import seedOnly from "./__fixtures__/seed-only.json";
import customColours from "./__fixtures__/custom-colours.json";
import darkValues from "./__fixtures__/dark-values.json";
import duplicates from "./__fixtures__/duplicates.json";
import malformed from "./__fixtures__/malformed.json";

type V5 = {
  id: string; value: string; darkValue?: string; cssVar: string; category?: string; kind?: string;
  type?: string; name?: string; aliasOf?: string; replacedBy?: string; group?: string;
};
const clone = (rows: unknown): V5[] => JSON.parse(JSON.stringify(rows));
const edit = (rows: V5[], id: string, patch: Partial<V5>) => rows.map((t) => (t.id === id ? { ...t, ...patch } : t));
const colour = (id: string, value: string, extra: Partial<V5> = {}): V5 => ({
  id, name: id, value, category: "colors", type: "color", cssVar: `--buildrick-design-${id}`, ...extra,
});

/** Every v5 var name must resolve to the exact same literal, in both modes. */
function expectSameResolvedValues(v5: V5[]) {
  const v6 = migrateTokensToV6(v5);
  for (const old of v5) {
    const holder = v6.find((t) => t.cssVar === old.cssVar || t.legacyNames?.includes(old.cssVar));
    expect(holder, `no token answers to ${old.cssVar}`).toBeDefined();
    expect(resolveTokenLiteral(v6, holder!.id, "light"), `${old.id} light`).toBe(old.value.trim());
    const isColour = old.category === "colors" || old.kind === "color";
    const dark = isColour && old.darkValue?.trim() ? old.darkValue.trim() : old.value.trim();
    expect(resolveTokenLiteral(v6, holder!.id, "dark"), `${old.id} dark`).toBe(dark);
  }
}

describe("migrateTokensToV6", () => {
  it.each([
    ["seed only", seedOnly],
    ["custom colours", customColours],
    ["dark values", darkValues],
    ["duplicates", duplicates],
  ])("keeps every resolved value identical: %s", (_name, fixture) => {
    expectSameResolvedValues(fixture as V5[]);
  });

  it("aliases a semantic colour equal to a primitive instead of copying it", () => {
    const v6 = migrateTokensToV6(seedOnly);
    const primary = v6.find((t) => t.id === "color-primary")!;
    expect(primary.layer).toBe("semantic");
    expect(primary.modes.light).toEqual({ alias: "color-brand-500" });
  });

  it("creates a deterministic custom primitive for an unmatched value", () => {
    const a = migrateTokensToV6(customColours);
    const b = migrateTokensToV6(customColours);
    expect(a).toEqual(b);
    expect(a.some((t) => t.id.startsWith("custom-") && t.layer === "primitive")).toBe(true);
  });

  it("does not collide with an existing custom-<id> token", () => {
    const input = [
      ...seedOnly,
      { id: "custom-color-primary", name: "Mine", value: "#123456", category: "colors", cssVar: "--buildrick-design-custom-color-primary", type: "color" },
    ];
    const ids = migrateTokensToV6(input.map((t) => (t.id === "color-primary" ? { ...t, value: "#ABCDEF" } : t))).map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("merges equal duplicates and keeps the dropped var as a legacy name", () => {
    const v6 = migrateTokensToV6(duplicates);
    expect(v6.find((t) => t.id === "color-action")).toBeUndefined();
    expect(v6.find((t) => t.id === "color-primary")!.legacyNames).toContain("--buildrick-design-color-action");
  });

  it("keeps unequal duplicates as separate tokens", () => {
    const input = (duplicates as V5[]).map((t) => (t.id === "color-action" ? { ...t, value: "#FF0000" } : t));
    expect(migrateTokensToV6(input).find((t) => t.id === "color-action")).toBeDefined();
  });

  describe("v5 value semantics (aliasOf is metadata, value is what shipped)", () => {
    it("keeps a recoloured semantic that still carries aliasOf", () => {
      const rows = edit(clone(seedOnly), "color-action", { value: "#FF0000" });
      expectSameResolvedValues(rows);
      expect(migrateTokensToV6(rows).find((t) => t.id === "color-action")!.modes.light).not.toEqual({ alias: "color-brand-500" });
    });
    it("keeps the semantic's own value when its aliasOf target was recoloured", () => {
      const rows = edit(clone(seedOnly), "color-brand-500", { value: "#FF0000" });
      expectSameResolvedValues(rows);
    });
    it("drops darkValue on non-colour tokens", () => {
      const space = clone(seedOnly).find((t) => t.category === "spacing")!;
      const rows = edit(clone(seedOnly), space.id, { darkValue: "99px" });
      expectSameResolvedValues(rows);
      expect(migrateTokensToV6(rows).find((t) => t.id === space.id)!.modes.dark).toBeUndefined();
    });
    it("rewrites aliasOf and replacedBy that point at a merged-away duplicate", () => {
      const rows = [
        ...clone(duplicates),
        colour("color-x", "#1A56DB", { aliasOf: "color-action", replacedBy: "color-action" }),
      ];
      expectSameResolvedValues(rows);
      const x = migrateTokensToV6(rows).find((t) => t.id === "color-x")!;
      expect(x.replacedBy).toBe("color-primary");
    });
    it("keeps hex case exactly", () => {
      const rows = edit(clone(seedOnly), "color-secondary", { value: "#1a56db" });
      expectSameResolvedValues(rows);
      const v6 = migrateTokensToV6(rows);
      expect(resolveTokenLiteral(v6, "color-secondary", "light")).toBe("#1a56db");
      expect(v6.find((t) => t.id === "color-secondary")!.modes.light).not.toEqual({ alias: "color-brand-500" });
    });
    it("custom primitives avoid existing cssVars as well as ids", () => {
      const rows = [
        ...edit(clone(seedOnly), "color-secondary", { value: "#ABCDEF" }),
        colour("foo", "#000001", { cssVar: "--buildrick-design-custom-color-secondary" }),
      ];
      expectSameResolvedValues(rows);
      const vars = migrateTokensToV6(rows).map((t) => t.cssVar);
      expect(new Set(vars).size).toBe(vars.length);
    });
    it("migrates a v5 primitive that has a darkValue as a semantic token", () => {
      const rows = edit(clone(seedOnly), "color-slate-700", { darkValue: "#010203" });
      expectSameResolvedValues(rows);
      expect(migrateTokensToV6(rows).find((t) => t.id === "color-slate-700")!.layer).toBe("semantic");
    });
  });

  it("never shares a custom primitive between semantic tokens", () => {
    const v6 = migrateTokensToV6(seedOnly);
    const aliasers = new Map<string, string[]>();
    for (const t of v6) {
      for (const ref of [t.modes.light, t.modes.dark]) {
        if (ref && "alias" in ref && ref.alias.startsWith("custom-")) aliasers.set(ref.alias, [...(aliasers.get(ref.alias) ?? []), t.id]);
      }
    }
    for (const [prim, ids] of aliasers) expect(ids, prim).toHaveLength(1);
    expect(v6.find((t) => t.id === "color-success")!.modes.light).toEqual({ alias: "custom-color-success" });
  });

  it("still aliases a real seed primitive on an exact value match", () => {
    const v6 = migrateTokensToV6(seedOnly);
    expect(v6.find((t) => t.id === "color-text")!.modes.light).toEqual({ alias: "color-slate-700" });
  });

  describe("duplicate ids in one list", () => {
    const v6 = migrateTokensToV6(seedOnly);
    it("the --buildrick-design-<id> row keeps the id; an equal --bd-* row folds into legacyNames", () => {
      const sm = v6.filter((t) => t.id.startsWith("radius-sm"));
      expect(sm.map((t) => t.id)).toEqual(["radius-sm"]);
      expect(sm[0].cssVar).toBe("--buildrick-design-radius-sm");
      expect(sm[0].legacyNames).toContain("--bd-radius-sm");
      expect(v6.find((t) => t.id === "radius-md")!.legacyNames).toContain("--bd-radius-md");
    });
    it("an unequal --bd-* row keeps its var under a suffixed id", () => {
      expect(v6.find((t) => t.id === "shadow-sm")!.cssVar).toBe("--buildrick-design-shadow-sm");
      expect(v6.find((t) => t.cssVar === "--bd-shadow-sm")!.id).toBe("shadow-sm-2");
    });
  });

  it("infers kind from the id before falling back to category", () => {
    const v6 = migrateTokensToV6(seedOnly);
    const kind = (id: string) => v6.find((t) => t.id === id)!.kind;
    for (const id of ["radius-none", "radius-sm", "radius-lg", "radius-xl", "radius-full"]) expect(kind(id), id).toBe("radius");
    expect(kind("shadow-sm")).toBe("shadow");
    expect(kind("space-4")).toBe("spacing");
    expect(kind("font-heading")).toBe("type");
    expect(kind("font-size-sm")).toBe("type");
    const rows = [
      { id: "z-top", name: "z", value: "9", category: "layout", cssVar: "--buildrick-design-z-top", type: "number" },
      { id: "opacity-10", name: "o", value: "0.1", category: "effects", cssVar: "--buildrick-design-opacity-10", type: "number" },
      { id: "duration-fast", name: "d", value: "100ms", category: "effects", cssVar: "--buildrick-design-duration-fast", type: "string" },
    ];
    expect(migrateTokensToV6(rows).map((t) => t.kind)).toEqual(["zindex", "opacity", "motion"]);
  });

  it("throws a typed error on malformed input and never returns partial data", () => {
    expect(() => migrateTokensToV6(malformed)).toThrow(TokenMigrationError);
    expect(() => migrateTokensToV6(null)).toThrow(TokenMigrationError);
  });
});
