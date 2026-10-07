import { describe, it, expect, vi } from "vitest";
import { loadTokensSafely } from "../useComposerInit";
import { DEFAULT_TOKENS } from "@/engine/designSystem/defaultTokens";

vi.mock("@/shared/utils/errorTracking", () => ({ captureError: vi.fn() }));
import { captureError } from "@/shared/utils/errorTracking";

type Settings = { designTokens?: unknown[]; designTokensSchemaVersion?: number; darkMode?: unknown };

describe("loadTokensSafely", () => {
  it("keeps the old tokens, marks Brand read-only and reports when migration throws", () => {
    const settings = { designTokens: [null], designTokensSchemaVersion: 5 };
    const r = loadTokensSafely(settings, "site-1");
    expect(r.readOnly).toBe(true);
    expect(r.settings).toBe(settings);
    expect(captureError).toHaveBeenCalledWith(expect.any(Error), expect.objectContaining({ siteId: "site-1", fromVersion: 5 }));
  });

  it("migrates a valid v5 site", () => {
    const input: Settings = { designTokens: [], designTokensSchemaVersion: 5 };
    const r = loadTokensSafely(input, "site-1");
    expect(r.readOnly).toBe(false);
    expect(r.settings.designTokensSchemaVersion).toBe(6);
    expect(r.settings.darkMode).toBe("off");
  });

  it("leaves a site that is already v6 untouched", () => {
    const settings = { designTokens: [], designTokensSchemaVersion: 6 };
    expect(loadTokensSafely(settings, "site-1")).toEqual({ settings, readOnly: false, migrated: false });
  });

  it("walks a v3 site through the v1–v5 steps before v6", () => {
    const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 3 }, "site-1");
    expect(r.readOnly).toBe(false);
    expect(r.settings.designTokensSchemaVersion).toBe(6);
  });

  it("never touches a site that has no saved tokens", () => {
    const settings = { designTokensSchemaVersion: undefined };
    expect(loadTokensSafely(settings, "site-1").settings).toBe(settings);
  });

  it("does not migrate when the switch is off; Brand read-only for an unmigrated site", () => {
    const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "s", { switchOn: false, hold: false });
    expect(r.settings.designTokensSchemaVersion).toBe(5);
    expect(r.readOnly).toBe(true);
    expect(r.reason).toBe("switch_off");
  });

  it("an already-migrated site works normally with the switch off", () => {
    const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 6 }, "s", { switchOn: false, hold: false });
    expect(r.readOnly).toBe(false);
  });

  it("a held site is never migrated", () => {
    const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "s", { switchOn: true, hold: true });
    expect(r.settings.designTokensSchemaVersion).toBe(5);
    expect(r.readOnly).toBe(true);
    expect(r.reason).toBe("held");
  });

  it("reports a successful migration", () => {
    const r = loadTokensSafely({ designTokens: [], designTokensSchemaVersion: 5 }, "s", { switchOn: true, hold: false });
    expect(r.migrated).toBe(true);
  });

  describe("v6-shaped rows (M3)", () => {
    const broken = [{ ...DEFAULT_TOKENS[0], modes: { light: { alias: "nowhere" } } }];

    it("a missing version over v6-shaped rows is read as v6, never pushed through the v5 chain", () => {
      const settings = { designTokens: DEFAULT_TOKENS };
      const r = loadTokensSafely(settings, "s");
      expect(r).toEqual({ settings, readOnly: false, migrated: false });
    });

    it.each([
      ["stated v6", { designTokens: broken, designTokensSchemaVersion: 6 }],
      ["inferred v6", { designTokens: broken }],
    ])("%s rows that fail validation open read-only (reason failed), not editable on the seed", (_l, settings) => {
      const r = loadTokensSafely(settings, "s");
      expect(r.readOnly).toBe(true);
      expect(r.reason).toBe("failed");
      expect(r.settings).toBe(settings);
    });
  });
});
