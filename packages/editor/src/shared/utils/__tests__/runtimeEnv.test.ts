/**
 * runtimeEnv tests — dual Vite/Next env reading and strict "true"-string
 * feature gating. The module reads env at import time, so each test resets
 * the module registry and re-imports after stubbing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

async function loadRuntimeEnv() {
  return import("../runtimeEnv");
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DASHBOARD_URL — dual-context resolution", () => {
  it("prefers the Vite key when both contexts define a value", async () => {
    vi.stubEnv("VITE_DASHBOARD_URL", "https://vite.example");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://next.example");
    const env = await loadRuntimeEnv();
    expect(env.DASHBOARD_URL).toBe("https://vite.example");
  });

  it("falls back to the Next.js key when the Vite key is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://next.example");
    const env = await loadRuntimeEnv();
    expect(env.DASHBOARD_URL).toBe("https://next.example");
  });

  it("falls back to the window origin when neither key is set", async () => {
    const env = await loadRuntimeEnv();
    expect(env.DASHBOARD_URL).toBe(window.location.origin);
  });
});

describe("SENTRY_DSN", () => {
  it("is undefined when unset (dev no-Sentry mode)", async () => {
    const env = await loadRuntimeEnv();
    expect(env.SENTRY_DSN).toBeUndefined();
  });

  it("reads the Vite key", async () => {
    vi.stubEnv("VITE_SENTRY_DSN", "https://key@sentry.io/1");
    const env = await loadRuntimeEnv();
    expect(env.SENTRY_DSN).toBe("https://key@sentry.io/1");
  });
});

describe("feature flags — exact 'true' string gating", () => {
  it("default to false when unset", async () => {
    const env = await loadRuntimeEnv();
    expect(env.FEATURE_PUBLISH).toBe(false);
    expect(env.FEATURE_COMPONENTS_V2).toBe(false);
    expect(env.FEATURE_DS_AI).toBe(false);
    expect(env.FEATURE_COLLAB).toBe(false);
  });

  it("enable only on the exact lowercase string 'true'", async () => {
    vi.stubEnv("VITE_FEATURE_PUBLISH", "true");
    const env = await loadRuntimeEnv();
    expect(env.FEATURE_PUBLISH).toBe(true);
  });

  it("reject 'TRUE', '1', 'yes' — no boolean coercion", async () => {
    vi.stubEnv("VITE_FEATURE_PUBLISH", "TRUE");
    vi.stubEnv("VITE_FEATURE_COMPONENTS_V2", "1");
    vi.stubEnv("VITE_FEATURE_DS_AI", "yes");
    const env = await loadRuntimeEnv();
    expect(env.FEATURE_PUBLISH).toBe(false);
    expect(env.FEATURE_COMPONENTS_V2).toBe(false);
    expect(env.FEATURE_DS_AI).toBe(false);
  });

  it("read the NEXT_PUBLIC_* fallback when the Vite key is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURE_COLLAB", "true");
    const env = await loadRuntimeEnv();
    expect(env.FEATURE_COLLAB).toBe(true);
  });
});
