/**
 * Unification spec §550 — readUnifiedEditorFlag (server-side flag read).
 * Dev/Phase 1 implementation reads NEXT_PUBLIC_UNIFIED_EDITOR env var.
 * Edge Config wiring deferred — test asserts current contract only.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Stub server-only import so vitest can load the module under jsdom.
vi.mock("server-only", () => ({}));

describe("readUnifiedEditorFlag", () => {
  const origEnv = process.env.NEXT_PUBLIC_UNIFIED_EDITOR;

  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    if (origEnv === undefined) delete process.env.NEXT_PUBLIC_UNIFIED_EDITOR;
    else process.env.NEXT_PUBLIC_UNIFIED_EDITOR = origEnv;
  });

  it('returns true when NEXT_PUBLIC_UNIFIED_EDITOR="true"', async () => {
    process.env.NEXT_PUBLIC_UNIFIED_EDITOR = "true";
    const { readUnifiedEditorFlag } = await import("../unified-flag.server");
    await expect(readUnifiedEditorFlag()).resolves.toBe(true);
  });

  it("returns false when env var is unset", async () => {
    delete process.env.NEXT_PUBLIC_UNIFIED_EDITOR;
    const { readUnifiedEditorFlag } = await import("../unified-flag.server");
    await expect(readUnifiedEditorFlag()).resolves.toBe(false);
  });

  it('returns false for non-"true" truthy values ("1", "yes", etc.)', async () => {
    process.env.NEXT_PUBLIC_UNIFIED_EDITOR = "1";
    const { readUnifiedEditorFlag } = await import("../unified-flag.server");
    await expect(readUnifiedEditorFlag()).resolves.toBe(false);
  });

  it("returns false for empty string", async () => {
    process.env.NEXT_PUBLIC_UNIFIED_EDITOR = "";
    const { readUnifiedEditorFlag } = await import("../unified-flag.server");
    await expect(readUnifiedEditorFlag()).resolves.toBe(false);
  });
});
