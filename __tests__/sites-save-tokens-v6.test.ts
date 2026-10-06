import { describe, it, expect, afterEach, vi } from "vitest";
import { checkTokenPayload } from "@/server/services/brand-tokens";
import { migrateTokensToV6 } from "@buildrik/shared/tokens";
import v5seed from "@/packages/shared/tokens/__tests__/__fixtures__/seed-only.json";

const v6 = migrateTokensToV6(v5seed);
const invalidV5 = [{ id: "My Token", name: "Mine", value: "#000", category: "colors", cssVar: "--my token", type: "color" }];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkTokenPayload", () => {
  it("passes saves without tokens", () => {
    expect(checkTokenPayload({ seo: {} }, {})).toEqual({ kind: "no-tokens" });
  });

  it("refuses an invalid v6 payload with TOKENS_INVALID", () => {
    const bad = { designTokens: [{ ...v6[0], modes: { light: { alias: "missing" } } }], designTokensSchemaVersion: 6 };
    expect(() => checkTokenPayload(bad, {})).toThrow(expect.objectContaining({ code: "TOKENS_INVALID" }));
  });

  it("refuses an invalid darkMode", () => {
    expect(() => checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6, darkMode: "dim" }, { designTokensSchemaVersion: 6 }))
      .toThrow(expect.objectContaining({ code: "TOKENS_INVALID" }));
  });

  it("refuses an old payload over a newer store (stale tab)", () => {
    expect(() => checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 5 }, { designTokensSchemaVersion: 6 }))
      .toThrow(expect.objectContaining({ code: "TOKENS_STALE_CLIENT" }));
  });

  it("accepts a valid v6 payload over a v6 store as same-version", () => {
    const r = checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6 }, { designTokensSchemaVersion: 6 });
    expect(r.kind).toBe("same-version");
  });

  it("marks the first migrated save", () => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    const r = checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6 }, { designTokens: v5seed, designTokensSchemaVersion: 5 });
    expect(r).toMatchObject({ kind: "first-migrated", storedTokens: v5seed, storedVersion: 5 });
  });

  it("migrates an old payload over an old store server-side (switch on)", () => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    const r = checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 5 }, { designTokensSchemaVersion: 5 });
    expect(r.kind).toBe("first-migrated");
  });

  it("leaves an old payload over an old store unmigrated when the switch is off", () => {
    vi.stubEnv("BRAND_TOKENS_V2", "");
    const r = checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 5 }, { designTokensSchemaVersion: 5 });
    expect(r).toEqual({ kind: "unchanged" });
  });

  it("accepts an unmigratable v5 payload over a v5 store unchanged (switch on, read-only site)", () => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    const r = checkTokenPayload({ designTokens: invalidV5, designTokensSchemaVersion: 5 }, { designTokens: invalidV5, designTokensSchemaVersion: 5 });
    expect(r).toEqual({ kind: "unchanged" });
  });

  it.each([999, 6.5, "6", -1, 0])("refuses designTokensSchemaVersion %j as TOKENS_INVALID", (version) => {
    expect(() => checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: version }, { designTokensSchemaVersion: 6 }))
      .toThrow(expect.objectContaining({ code: "TOKENS_INVALID" }));
  });

  it("only migrates a v5 payload server-side: a v3 payload with the switch on stays unchanged", () => {
    vi.stubEnv("BRAND_TOKENS_V2", "on");
    expect(checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 3 }, { designTokensSchemaVersion: 3 }))
      .toEqual({ kind: "unchanged" });
    expect(checkTokenPayload({ designTokens: v5seed }, {})).toEqual({ kind: "unchanged" });
  });

  describe("kill switch off", () => {
    it("refuses a first migrated save: the switch is server-enforced, not just an editor hint", () => {
      vi.stubEnv("BRAND_TOKENS_V2", "");
      expect(() => checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6 }, { designTokens: v5seed, designTokensSchemaVersion: 5 }))
        .toThrow(expect.objectContaining({ code: "TOKENS_STALE_CLIENT", message: "Brand upgrade is paused — reload to continue." }));
    });
    it("still accepts a save over an already-v6 store", () => {
      vi.stubEnv("BRAND_TOKENS_V2", "");
      expect(checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6 }, { designTokensSchemaVersion: 6 }).kind).toBe("same-version");
    });
  });

  describe("tokensMigrationHold", () => {
    it("refuses a first migrated save while held", () => {
      expect(() => checkTokenPayload({ designTokens: v6, designTokensSchemaVersion: 6 }, { designTokens: v5seed, designTokensSchemaVersion: 5 }, { hold: true }))
        .toThrow(expect.objectContaining({ code: "TOKENS_STALE_CLIENT" }));
    });
    it("leaves a v5 payload unmigrated while held, even with the switch on", () => {
      vi.stubEnv("BRAND_TOKENS_V2", "on");
      expect(checkTokenPayload({ designTokens: v5seed, designTokensSchemaVersion: 5 }, { designTokensSchemaVersion: 5 }, { hold: true }))
        .toEqual({ kind: "unchanged" });
    });
  });
});
