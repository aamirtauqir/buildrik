/**
 * BK-11: one save path. ⌘S is the registry's `save`, which calls
 * composer.saveProject(); with the shell's save installed it runs that —
 * once — and never the storage adapter (which, for a site-bound editor, is
 * "none": it wrote nothing and marked the project saved).
 */
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createTestComposer, installEngineBrowserStubs, removeEngineBrowserStubs } from "@/engine/__tests__/test-utils/realComposer";

beforeAll(installEngineBrowserStubs);
afterAll(removeEngineBrowserStubs);

describe("Composer save handler (BK-11)", () => {
  it("routes saveProject — and the registry's save command — to the installed handler, once", async () => {
    const c = createTestComposer();
    const handler = vi.fn().mockResolvedValue(undefined);
    const storage = vi.spyOn(c, "saveToStorage");
    c.setSaveHandler(handler);
    await c.commands.run("save");
    expect(handler).toHaveBeenCalledTimes(1);
    expect(storage).not.toHaveBeenCalled();
  });

  it("falls back to storage when no handler is installed", async () => {
    const c = createTestComposer();
    const storage = vi.spyOn(c, "saveToStorage").mockResolvedValue(undefined);
    c.setSaveHandler(null);
    await c.saveProject();
    expect(storage).toHaveBeenCalledTimes(1);
  });

  it("counts every document change", () => {
    const c = createTestComposer();
    const before = c.getChangeSeq();
    c.markDirty();
    c.markDirty();
    expect(c.getChangeSeq()).toBe(before + 2);
  });
});
