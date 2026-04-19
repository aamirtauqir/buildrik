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

  it("warns in development when token is missing", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    getToken("nonexistent" as TokenName);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("not defined"));
    warn.mockRestore();
    process.env.NODE_ENV = originalEnv;
  });
});
