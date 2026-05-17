import { describe, it, expect, vi } from "vitest";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../index";
import type { DesignToken } from "../../types";

describe("migrateDesignTokens", () => {
  it("CURRENT_SCHEMA_VERSION is 4 after B5-wire seed (semantic color aliases added 2026-05-17, on top of B1 v3)", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(4);
  });

  it("v3 → v4 injects 4 primitive + 4 semantic color tokens into stored projects when absent", () => {
    const existing: DesignToken[] = [
      {
        id: "color-primary",
        name: "Primary",
        value: "#3B82F6",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
      },
    ];
    const after = migrateDesignTokens(existing, 3, 4);
    // Existing token preserved.
    expect(after.find((t) => t.id === "color-primary")).toBeDefined();
    // 4 new primitives added.
    for (const id of ["color-blue-500", "color-slate-50", "color-slate-700", "color-red-500"]) {
      const t = after.find((x) => x.id === id);
      expect(t, `missing primitive ${id}`).toBeDefined();
      expect(t?.semanticKind).toBeUndefined();
      expect(t?.aliasOf).toBeUndefined();
    }
    // 4 new semantics added, each with aliasOf + semanticKind set.
    const semantics: Array<[string, string, string]> = [
      ["color-action", "color-blue-500", "action"],
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
    const existing: DesignToken[] = [
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
    const after = migrateDesignTokens(existing, 3, 4);
    // Only one color-action entry — user version preserved.
    const matches = after.filter((t) => t.id === "color-action");
    expect(matches).toHaveLength(1);
    expect(matches[0].value).toBe("#FF0000");
    expect(matches[0].name).toBe("Action (user-edited)");
  });

  it("is no-op for same-version (V1 → V1)", () => {
    const tokens: DesignToken[] = [
      {
        id: "color-primary",
        name: "Primary",
        value: "#FF0000",
        category: "colors",
        cssVar: "--buildrick-design-color-primary",
        type: "color",
      },
    ];
    expect(migrateDesignTokens(tokens, 1, 1)).toEqual(tokens);
  });

  it("logs warning and returns unchanged when no migration defined", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const tokens: DesignToken[] = [];
    // Start from CURRENT_SCHEMA_VERSION so all real migrations are skipped;
    // only the warning loop runs.
    const result = migrateDesignTokens(tokens, CURRENT_SCHEMA_VERSION, 99);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No migration"));
    expect(result).toEqual(tokens);
    warn.mockRestore();
  });

  it("is no-op when fromVersion >= toVersion", () => {
    const tokens: DesignToken[] = [];
    expect(migrateDesignTokens(tokens, 5, 3)).toEqual(tokens);
    expect(migrateDesignTokens(tokens, 5, 5)).toEqual(tokens);
  });
});
