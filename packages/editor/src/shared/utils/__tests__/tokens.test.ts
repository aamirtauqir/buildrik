import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getToken } from "../tokens";
import type { TokenName } from "../token-names";

describe("getToken", () => {
  beforeEach(() => {
    document.documentElement.style.setProperty("--buildrick-accent", "#2D6DFF");
    document.documentElement.style.setProperty("--buildrick-bg-panel", "#F8FAFC");
  });

  afterEach(() => {
    document.documentElement.style.removeProperty("--buildrick-accent");
    document.documentElement.style.removeProperty("--buildrick-bg-panel");
  });

  it("returns trimmed value for defined token", () => {
    expect(getToken("accent")).toBe("#2D6DFF");
    expect(getToken("bg-panel")).toBe("#F8FAFC");
  });

  it("returns empty string for missing token", () => {
    expect(getToken("nonexistent" as TokenName)).toBe("");
  });

  /* The dev guard reads IS_DEV_BUILD now, not `process.env.NODE_ENV` — that
     global does not exist in the Vite demo, so the warning branch threw there
     instead of warning. IS_DEV_BUILD is resolved once at module load, so
     stubbing NODE_ENV mid-test no longer reaches it; the module is re-imported
     with the env in place instead. */
  it("warns in development when token is missing", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const { getToken: freshGetToken } = await import("../tokens");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    freshGetToken("nonexistent" as TokenName);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not defined"));
    warn.mockRestore();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
