import { describe, it, expect, vi } from "vitest";
import { migrateDesignTokens, CURRENT_SCHEMA_VERSION } from "../index";
import type { DesignToken } from "../../types";

describe("migrateDesignTokens", () => {
  it("CURRENT_SCHEMA_VERSION is 3 after B1 lock (replacedBy field added 2026-05-16, on top of B5 v2)", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(3);
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
    const result = migrateDesignTokens(tokens, 1, 99);
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
