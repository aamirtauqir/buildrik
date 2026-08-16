/**
 * featureFlags tests — the FEATURES map mirrors runtimeEnv, and
 * isFeatureEnabled is a plain lookup. Module state is import-time,
 * so tests reset modules and re-import.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// runtimeEnv reads env at import time. The root vitest config runs from the
// repo root and auto-loads `.env`/`.env.local`, where dev flags like
// VITE_FEATURE_PUBLISH are ON — which would flip the "default off" assertions.
// Clear every feature key (both context prefixes) so the baseline is hermetic
// regardless of which config/cwd runs the file.
const FEATURE_KEYS = ["PUBLISH", "DS_AI", "COLLAB"].flatMap((n) => [
  `VITE_FEATURE_${n}`,
  `NEXT_PUBLIC_FEATURE_${n}`,
]);

beforeEach(() => {
  vi.resetModules();
  for (const k of FEATURE_KEYS) vi.stubEnv(k, undefined as unknown as string);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("FEATURES / isFeatureEnabled", () => {
  it("all flags default off", async () => {
    const { FEATURES, isFeatureEnabled } = await import("../featureFlags");
    expect(FEATURES).toEqual({
      publish: false,
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
    expect(FEATURES.dsAi).toBe(false);
    expect(isFeatureEnabled("publish")).toBe(true);
    expect(isFeatureEnabled("dsAi")).toBe(false);
  });
});
