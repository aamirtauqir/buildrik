import { describe, it, expect, vi } from "vitest";
import { PluginManager } from "../PluginManager";

describe("PluginManager", () => {
  it("does not register plugin if load fails", async () => {
    const pm = new PluginManager({} as any);
    const config = { id: "p1", plugin: { id: "p1", name: "P1", version: "1", initialize: vi.fn().mockRejectedValue(new Error("fail")) }, enabled: true };
    await expect(pm.register(config as any)).rejects.toThrow("fail");
    expect(pm.isRegistered("p1")).toBe(false);
  });
});
