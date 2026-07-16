/**
 * errorTracking tests — the dev-bypass contract: every export is a no-op
 * without VITE_SENTRY_DSN, and wires through @sentry/react when set.
 * SENTRY_DSN is captured at import time via runtimeEnv, so tests reset
 * modules and re-import after stubbing.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/react";

vi.mock("@sentry/react", () => {
  const scope = { setExtra: vi.fn() };
  return {
    init: vi.fn(),
    captureException: vi.fn(),
    withScope: vi.fn((cb: (s: typeof scope) => void) => cb(scope)),
    setUser: vi.fn(),
    __scope: scope,
  };
});

const mocked = Sentry as unknown as {
  init: ReturnType<typeof vi.fn>;
  captureException: ReturnType<typeof vi.fn>;
  withScope: ReturnType<typeof vi.fn>;
  setUser: ReturnType<typeof vi.fn>;
  __scope: { setExtra: ReturnType<typeof vi.fn> };
};

async function loadModule() {
  return import("../errorTracking");
}

const flushAsync = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("without a DSN (dev bypass)", () => {
  it("initErrorTracking resolves without calling Sentry.init", async () => {
    const { initErrorTracking } = await loadModule();
    await expect(initErrorTracking()).resolves.toBeUndefined();
    expect(mocked.init).not.toHaveBeenCalled();
  });

  it("captureError is a no-op", async () => {
    const { captureError } = await loadModule();
    captureError(new Error("boom"), { where: "test" });
    await flushAsync();
    expect(mocked.captureException).not.toHaveBeenCalled();
    expect(mocked.withScope).not.toHaveBeenCalled();
  });

  it("setUser is a no-op", async () => {
    const { setUser } = await loadModule();
    setUser("user-1");
    await flushAsync();
    expect(mocked.setUser).not.toHaveBeenCalled();
  });
});

describe("with VITE_SENTRY_DSN set", () => {
  const DSN = "https://key@o0.ingest.sentry.io/1";

  beforeEach(() => {
    vi.stubEnv("VITE_SENTRY_DSN", DSN);
  });

  it("initErrorTracking calls Sentry.init with the DSN", async () => {
    const { initErrorTracking } = await loadModule();
    await initErrorTracking();
    expect(mocked.init).toHaveBeenCalledTimes(1);
    expect(mocked.init).toHaveBeenCalledWith(expect.objectContaining({ dsn: DSN }));
  });

  it("captureError without context reports directly", async () => {
    const { captureError } = await loadModule();
    const err = new Error("boom");
    captureError(err);
    await vi.waitFor(() => expect(mocked.captureException).toHaveBeenCalledWith(err));
    expect(mocked.withScope).not.toHaveBeenCalled();
  });

  it("captureError with context attaches extras via withScope", async () => {
    const { captureError } = await loadModule();
    const err = new Error("boom");
    captureError(err, { jobId: "j1", mode: "vercel" });

    await vi.waitFor(() => expect(mocked.captureException).toHaveBeenCalledWith(err));
    expect(mocked.withScope).toHaveBeenCalledTimes(1);
    expect(mocked.__scope.setExtra).toHaveBeenCalledWith("jobId", "j1");
    expect(mocked.__scope.setExtra).toHaveBeenCalledWith("mode", "vercel");
  });

  it("setUser forwards the id and clears on null", async () => {
    const { setUser } = await loadModule();
    setUser("user-1");
    await vi.waitFor(() => expect(mocked.setUser).toHaveBeenCalledWith({ id: "user-1" }));

    setUser(null);
    await vi.waitFor(() => expect(mocked.setUser).toHaveBeenCalledWith(null));
  });
});
