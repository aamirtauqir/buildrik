/**
 * featureFlags tests — the FEATURES map mirrors runtimeEnv, and
 * isFeatureEnabled is a plain lookup. Module state is import-time,
 * so tests reset modules and re-import.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("FEATURES / isFeatureEnabled", () => {
  it("all flags default off", async () => {
    const { FEATURES, isFeatureEnabled } = await import("../featureFlags");
    expect(FEATURES).toEqual({
      publish: false,
      componentsV2: false,
      dsAi: false,
      collab: false,
    });
    expect(isFeatureEnabled("publish")).toBe(false);
    expect(isFeatureEnabled("collab")).toBe(false);
  });

  it("reflects VITE_FEATURE_* = 'true' through the named keys", async () => {
    vi.stubEnv("VITE_FEATURE_PUBLISH", "true");
    vi.stubEnv("VITE_FEATURE_COLLAB", "true");
    const { FEATURES, isFeatureEnabled } = await import("../featureFlags");

    expect(FEATURES.publish).toBe(true);
    expect(FEATURES.collab).toBe(true);
    expect(FEATURES.componentsV2).toBe(false);
    expect(isFeatureEnabled("publish")).toBe(true);
    expect(isFeatureEnabled("dsAi")).toBe(false);
  });
});
