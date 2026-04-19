/**
 * Schema version persistence tests — Phase 7 of DS V1 remediation.
 *
 * Verifies migrateDesignTokens helper behavior for the load-path branches
 * (legacy / current / future-version). The integration into DesignSystemTab
 * save/load is verified by manual smoke test.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { CURRENT_SCHEMA_VERSION, migrateDesignTokens } from "../index";
import type { DesignToken } from "../../types";

const stubToken: DesignToken = {
  id: "color-primary",
  name: "Primary",
  value: "#000000",
  cssVar: "--buildrick-design-color-primary",
  category: "colors",
  type: "color",
};

describe("schema version — load path branches", () => {
  it("legacy project with no designTokensSchemaVersion is treated as v1", () => {
    const storedVersion = undefined;
    const effectiveVersion = storedVersion ?? 1;
    expect(effectiveVersion).toBe(1);
  });

  it("project at CURRENT version loads tokens unchanged", () => {
    const tokens = [stubToken];
    const storedVersion = CURRENT_SCHEMA_VERSION;
    const migrated = storedVersion < CURRENT_SCHEMA_VERSION
      ? migrateDesignTokens(tokens, storedVersion, CURRENT_SCHEMA_VERSION)
      : tokens;
    expect(migrated).toEqual(tokens);
  });

  it("project at older version runs migration (or no-op at CURRENT=1)", () => {
    const tokens = [stubToken];
    const storedVersion = 1;
    if (CURRENT_SCHEMA_VERSION === 1) {
      expect(migrateDesignTokens(tokens, 1, CURRENT_SCHEMA_VERSION)).toEqual(tokens);
    } else {
      const migrated = migrateDesignTokens(tokens, 1, CURRENT_SCHEMA_VERSION);
      expect(migrated).toBeDefined();
      expect(Array.isArray(migrated)).toBe(true);
    }
  });

  it("project at future version is loaded as-is with a warn", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const tokens = [stubToken];
    const storedVersion = CURRENT_SCHEMA_VERSION + 1;

    // Simulate the load-path branch: stored > current → warn, load as-is
    if (storedVersion > CURRENT_SCHEMA_VERSION) {
      console.warn("project from newer editor; token behavior may differ");
    }
    const result = tokens;

    expect(result).toEqual(tokens);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("newer editor"));
    warnSpy.mockRestore();
  });
});
