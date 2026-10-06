import { describe, it, expect, vi } from "vitest";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../index";
import type { LegacyDesignToken } from "@/engine/designSystem/types";

/** Steps up to v5 read and write legacy rows; v6 is migrateTokensToV6's. */
const migrateLegacy = (rows: LegacyDesignToken[], from: number, to: number) =>
  migrateDesignTokens(rows, from, to) as LegacyDesignToken[];

describe("migrateDesignTokens", () => {
  it("CURRENT_SCHEMA_VERSION is 6 after the v6 token shape (2026-10-06, on top of the v5 brand-blue rename)", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(6);
  });

  it("v3 → v4 injects 4 primitive + 4 semantic color tokens into stored projects when absent", () => {
    const existing: LegacyDesignToken[] = [
      {
        id: "color-primary",
        name: "Primary",
        value: "#3B82F6",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
      },
    ];
    const after = migrateLegacy(existing, 3, 4);
    // Existing token preserved.
    expect(after.find((t) => t.id === "color-primary")).toBeDefined();
    // 4 new primitives added.
    for (const id of ["color-brand-500", "color-slate-50", "color-slate-700", "color-red-500"]) {
      const t = after.find((x) => x.id === id);
      expect(t, `missing primitive ${id}`).toBeDefined();
      expect(t?.semanticKind).toBeUndefined();
      expect(t?.aliasOf).toBeUndefined();
    }
    // 4 new semantics added, each with aliasOf + semanticKind set.
    const semantics: Array<[string, string, string]> = [
      ["color-action", "color-brand-500", "action"],
      ["color-surface", "color-slate-50", "surface"],
      ["color-text-primary", "color-slate-700", "text"],
      ["color-feedback-error", "color-red-500", "feedback"],
    ];
    for (const [id, target, kind] of semantics) {
      const t = after.find((x) => x.id === id);
      expect(t, `missing semantic ${id}`).toBeDefined();
      expect(t?.semanticKind).toBe(kind);
      expect(t?.aliasOf).toBe(target);
    }
  });

  it("v3 → v4 does NOT duplicate seeds already present in stored projects", () => {
    const existing: LegacyDesignToken[] = [
      {
        id: "color-action",
        name: "Action (user-edited)",
        value: "#FF0000",
        category: "colors",
        cssVar: "--buildrick-design-color-action",
        type: "color",
        semanticKind: "action",
        aliasOf: "color-blue-500",
      },
    ];
    const after = migrateLegacy(existing, 3, 4);
    // Only one color-action entry — user version preserved.
    const matches = after.filter((t) => t.id === "color-action");
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe("#FF0000");
    expect(matches[0].name).toBe("Action (user-edited)");
  });

  it("is no-op for same-version (V1 → V1)", () => {
    const tokens: LegacyDesignToken[] = [
      {
        id: "color-primary",
        name: "Primary",
        value: "#FF0000",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
      },
    ];
    expect(migrateLegacy(tokens, 1, 1)).toEqual(tokens);
  });

  it("logs warning and returns unchanged when no migration defined", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const tokens: LegacyDesignToken[] = [];
    // Start from CURRENT_SCHEMA_VERSION so all real migrations are skipped;
    // only the warning loop runs.
    const result = migrateDesignTokens(tokens, CURRENT_SCHEMA_VERSION, 99);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No migration"));
    expect(result).toEqual(tokens);
    warn.mockRestore();
  });

  it("is no-op when fromVersion >= toVersion", () => {
    const tokens: LegacyDesignToken[] = [];
    expect(migrateDesignTokens(tokens, 5, 3)).toEqual(tokens);
    expect(migrateDesignTokens(tokens, 5, 5)).toEqual(tokens);
  });
});
