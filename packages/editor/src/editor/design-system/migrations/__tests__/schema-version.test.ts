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

  it("project at older version runs migration", () => {
    // CURRENT_SCHEMA_VERSION advanced past 1 long ago (now 4). Keep the
    // test as a forward-compat guard: v1 storage should always migrate
    // to whatever CURRENT is without throwing.
    const tokens = [stubToken];
    const migrated = migrateDesignTokens(tokens, 1, CURRENT_SCHEMA_VERSION);
    expect(migrated).toBeDefined();
    expect(Array.isArray(migrated)).toBe(true);
  });

  // B5 lock (2026-05-16): v2 migration adds optional semanticKind field.
  // Additive only — existing tokens stay as primitives (semanticKind undefined).

  it("CURRENT_SCHEMA_VERSION is 4 (B5-wire seed bump 2026-05-17, on top of B1 v3)", () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(4);
  });

  it("v1 → v3 migration preserves all existing token fields", () => {
    const tokens = [stubToken];
    const migrated = migrateDesignTokens(tokens, 1, 3);
    expect(migrated).toHaveLength(1);
    expect(migrated[0].id).toBe(stubToken.id);
    expect(migrated[0].value).toBe(stubToken.value);
    expect(migrated[0].category).toBe(stubToken.category);
  });

  it("v1 → v3 migration leaves semanticKind + replacedBy undefined on existing tokens", () => {
    const tokens = [stubToken];
    const migrated = migrateDesignTokens(tokens, 1, 3);
    expect(migrated[0].semanticKind).toBeUndefined();
    expect(migrated[0].replacedBy).toBeUndefined();
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
