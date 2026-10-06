/**
 * Schema v5 — the brand-blue rename (2026-08-16).
 *
 * `color-blue-500` held #2D6DFF, which is blue-500 in no ramp, while
 * `color-primary` in the same seed held #3B82F6 — so a new site shipped two
 * different brand blues and one of them lied about its own name.
 *
 * The rename is the first customer of a framework built in v3 and never used,
 * which is exactly why it is pinned here: the one thing a rename migration
 * must never do is change a value. A site already published with #2D6DFF is
 * that colour until its owner says otherwise; only the id, name and cssVar
 * move, and the old CSS variable keeps resolving through the export shim.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { lightAliasOf, resolveTokenLiteral } from "@buildrik/shared/tokens";
import { migrateDesignTokens } from "../index";
import { generateCompatibilityShim } from "../../utils/exportUtils";
import { DEFAULT_TOKENS } from "../../constants";
import type { LegacyDesignToken } from "@/engine/designSystem/types";

/** Steps up to v5 read and write legacy rows; v6 is migrateTokensToV6's. */
const migrateLegacy = (rows: LegacyDesignToken[], from: number, to: number) =>
  migrateDesignTokens(rows, from, to) as LegacyDesignToken[];

const stored = (over: Partial<LegacyDesignToken> = {}): LegacyDesignToken => ({
  id: "color-blue-500",
  name: "Blue 500",
  value: "#2D6DFF",
  category: "colors",
  cssVar: "--buildrick-design-color-blue-500",
  type: "color",
  group: "primitive",
  ...over,
});

describe("v5 — brand primitive rename", () => {
  it("renames the id, the name and the cssVar", () => {
    const [t] = migrateLegacy([stored()], 4, 5);
    expect(t.id).toBe("color-brand-500");
    expect(t.name).toBe("Brand 500");
    expect(t.cssVar).toBe("--buildrick-design-color-brand-500");
  });

  it("does NOT touch the value — a published site keeps the colour it shipped", () => {
    const [t] = migrateLegacy([stored()], 4, 5);
    expect(t.value).toBe("#2D6DFF");
  });

  it("keeps a value the user chose themselves", () => {
    const [t] = migrateLegacy([stored({ value: "#FF0000" })], 4, 5);
    expect(t.value).toBe("#FF0000");
    expect(t.id).toBe("color-brand-500");
  });

  it("repoints every alias that pointed at the old id", () => {
    const tokens = migrateLegacy(
      [
        stored(),
        stored({
          id: "color-action",
          name: "Action",
          cssVar: "--buildrick-design-color-action",
          group: "semantic",
          semanticKind: "action",
          aliasOf: "color-blue-500",
        }),
      ],
      4,
      5
    );
    expect(tokens.find((t) => t.id === "color-action")?.aliasOf).toBe("color-brand-500");
    // And no token is left pointing at an id that no longer exists.
    const ids = new Set(tokens.map((t) => t.id));
    for (const t of tokens) {
      if (t.aliasOf) expect(ids.has(t.aliasOf)).toBe(true);
    }
  });

  it("leaves a token set that never had the old id completely alone", () => {
    const before = [stored({ id: "color-slate-50", cssVar: "--x", aliasOf: undefined })];
    const after = migrateLegacy(before, 4, 5);
    expect(after).toEqual(before);
  });

  it("does not leave a bridge token behind — the Tokens screen shows one primitive, not two", () => {
    const after = migrateLegacy([stored()], 4, 5);
    expect(after).toHaveLength(1);
    expect(after.find((t) => t.id === "color-blue-500")).toBeUndefined();
  });

  it("the export shim keeps the old CSS variable resolving for two versions", () => {
    const shim = generateCompatibilityShim(5);
    expect(shim).toContain("--buildrick-design-color-blue-500: var(--buildrick-design-color-brand-500);");
    // Out of the retention window again at v7.
    expect(generateCompatibilityShim(7)).toBe("");
  });
});

describe("the seed the rename was for", () => {
  it("ships ONE brand blue — primary, the primitive and action all agree", () => {
    const light = (id: string) => resolveTokenLiteral(DEFAULT_TOKENS, id, "light");
    expect(light("color-primary")).toBe("#1A56DB");
    expect(light("color-brand-500")).toBe("#1A56DB");
    expect(light("color-action")).toBe("#1A56DB");
    const action = DEFAULT_TOKENS.find((t) => t.id === "color-action");
    expect(action && lightAliasOf(action)).toBe("color-brand-500");
  });

  it("no longer seeds the retired cobalt anywhere", () => {
    const shipsCobalt = (id: string) =>
      (["light", "dark"] as const).some((m) => /#2d6dff/i.test(resolveTokenLiteral(DEFAULT_TOKENS, id, m) ?? ""));
    expect(DEFAULT_TOKENS.filter((t) => shipsCobalt(t.id))).toEqual([]);
  });
});
