import { describe, it, expect, vi } from "vitest";
import { loadTokensSafely } from "../useComposerInit";

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
    expect(loadTokensSafely(settings, "site-1")).toEqual({ settings, readOnly: false });
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
});
