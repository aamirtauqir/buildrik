/**
 * PluginManager lifecycle — register/unregister, enable/disable,
 * dependency validation, error events, and loadFromUrl security guards.
 *
 * Complements the existing PluginManager.test.ts (which pins only the
 * "failed load does not half-register" invariant). The feature is
 * flag-gated in the UI but the engine surface is fully testable.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { PluginManager } from "../PluginManager";
import { EVENTS } from "@/shared/constants";
import type { Composer } from "../Composer";
import type { Plugin } from "@/shared/types/plugins";

function makeManager(): PluginManager {
  return new PluginManager({ marker: "composer" } as unknown as Composer);
}

function makePlugin(id: string, overrides: Partial<Plugin> = {}): Plugin {
  return {
    id,
    name: `Plugin ${id}`,
    version: "1.0.0",
    initialize: vi.fn(async () => {}),
    destroy: vi.fn(async () => {}),
    ...overrides,
  };
}

function capture(manager: PluginManager, event: string): unknown[] {
  const calls: unknown[] = [];
  manager.on(event, (payload) => calls.push(payload));
  return calls;
}

describe("register", () => {
  it("initializes the plugin with the composer and emits plugin:loaded + plugin:registered", async () => {
    const manager = makeManager();
    const loaded = capture(manager, EVENTS.PLUGIN_LOADED);
    const registered = capture(manager, EVENTS.PLUGIN_REGISTERED);
    const plugin = makePlugin("p1");

    await manager.register({ plugin });

    expect(plugin.initialize).toHaveBeenCalledWith(
      expect.objectContaining({ marker: "composer" }),
    );
    expect(manager.has("p1")).toBe(true);
    expect(manager.isRegistered("p1")).toBe(true);
    expect(manager.isLoaded("p1")).toBe(true);
    expect(manager.isEnabled("p1")).toBe(true);
    expect(manager.getMetadata("p1")).toMatchObject({
      id: "p1",
      name: "Plugin p1",
      version: "1.0.0",
      enabled: true,
      loaded: true,
    });
    expect(loaded).toEqual([{ id: "p1", plugin }]);
    expect(registered).toEqual([{ id: "p1", plugin }]);
  });

  it("supports constructor-style plugins with options", async () => {
    const manager = makeManager();
    const init = vi.fn();
    class MyPlugin implements Plugin {
      id = "ctor";
      name = "Ctor";
      version = "0.1.0";
      constructor(public options?: Record<string, unknown>) {}
      initialize = init;
    }

    await manager.register({ plugin: MyPlugin, options: { flag: true } });

    expect(manager.has("ctor")).toBe(true);
    expect((manager.get("ctor") as MyPlugin).options).toEqual({ flag: true });
    expect(init).toHaveBeenCalled();
  });

  it("rejects duplicate ids", async () => {
    const manager = makeManager();
    await manager.register({ plugin: makePlugin("p1") });
    await expect(manager.register({ plugin: makePlugin("p1") })).rejects.toThrow(
      /already registered/,
    );
  });

  it("rejects when a dependency is not registered, accepts when it is", async () => {
    const manager = makeManager();
    const dependent = makePlugin("child", { dependencies: ["base"] });

    await expect(manager.register({ plugin: dependent })).rejects.toThrow(
      /depends on "base"/,
    );

    await manager.register({ plugin: makePlugin("base") });
    await expect(manager.register({ plugin: dependent })).resolves.toBeUndefined();
  });

  it("enabled:false registers without initializing (loaded=false)", async () => {
    const manager = makeManager();
    const plugin = makePlugin("lazy");

    await manager.register({ plugin, enabled: false });

    expect(plugin.initialize).not.toHaveBeenCalled();
    expect(manager.has("lazy")).toBe(true);
    expect(manager.isLoaded("lazy")).toBe(false);
    expect(manager.isEnabled("lazy")).toBe(false);
  });
});

describe("enable / disable", () => {
  it("enable loads a disabled plugin and emits plugin:enabled", async () => {
    const manager = makeManager();
    const plugin = makePlugin("lazy");
    await manager.register({ plugin, enabled: false });
    const enabled = capture(manager, EVENTS.PLUGIN_ENABLED);

    await manager.enable("lazy");

    expect(plugin.initialize).toHaveBeenCalled();
    expect(manager.isLoaded("lazy")).toBe(true);
    expect(manager.isEnabled("lazy")).toBe(true);
    expect(enabled).toEqual([{ id: "lazy" }]);
  });

  it("enable on an already-enabled plugin is a no-op (no duplicate event)", async () => {
    const manager = makeManager();
    await manager.register({ plugin: makePlugin("p1") });
    const enabled = capture(manager, EVENTS.PLUGIN_ENABLED);

    await manager.enable("p1");

    expect(enabled).toEqual([]);
  });

  it("disable unloads (calls destroy) and emits plugin:disabled + plugin:unloaded", async () => {
    const manager = makeManager();
    const plugin = makePlugin("p1");
    await manager.register({ plugin });
    const disabled = capture(manager, EVENTS.PLUGIN_DISABLED);
    const unloaded = capture(manager, EVENTS.PLUGIN_UNLOADED);

    await manager.disable("p1");

    expect(plugin.destroy).toHaveBeenCalled();
    expect(manager.isLoaded("p1")).toBe(false);
    expect(manager.isEnabled("p1")).toBe(false);
    expect(disabled).toEqual([{ id: "p1" }]);
    expect(unloaded).toEqual([{ id: "p1", plugin }]);
  });

  it("enable/disable on unknown ids throws", async () => {
    const manager = makeManager();
    await expect(manager.enable("ghost")).rejects.toThrow(/not found/);
    await expect(manager.disable("ghost")).rejects.toThrow(/not found/);
  });
});

describe("error paths", () => {
  it("initialize failure emits plugin:error, records meta.error, and rethrows via load", async () => {
    const manager = makeManager();
    const boom = new Error("init failed");
    const plugin = makePlugin("bad", {
      initialize: vi.fn(async () => {
        throw boom;
      }),
    });
    const errors = capture(manager, EVENTS.PLUGIN_ERROR);
    await manager.register({ plugin, enabled: false });

    await expect(manager.enable("bad")).rejects.toThrow("init failed");

    expect(errors).toEqual([{ id: "bad", error: boom }]);
    expect(manager.getMetadata("bad")?.error).toBe("init failed");
    expect(manager.isLoaded("bad")).toBe(false);
  });

  it("destroy failure during unload emits plugin:error and rethrows", async () => {
    const manager = makeManager();
    const boom = new Error("teardown failed");
    const plugin = makePlugin("fragile", {
      destroy: vi.fn(async () => {
        throw boom;
      }),
    });
    await manager.register({ plugin });
    const errors = capture(manager, EVENTS.PLUGIN_ERROR);

    await expect(manager.unload("fragile")).rejects.toThrow("teardown failed");

    expect(errors).toEqual([{ id: "fragile", error: boom }]);
    expect(manager.getMetadata("fragile")?.error).toBe("teardown failed");
  });
});

describe("unregister", () => {
  it("unloads first, removes the plugin, and emits plugin:unregistered", async () => {
    const manager = makeManager();
    const plugin = makePlugin("p1");
    await manager.register({ plugin });
    const unregistered = capture(manager, EVENTS.PLUGIN_UNREGISTERED);

    await manager.unregister("p1");

    expect(plugin.destroy).toHaveBeenCalled();
    expect(manager.has("p1")).toBe(false);
    expect(manager.getMetadata("p1")).toBeUndefined();
    expect(unregistered).toEqual([{ id: "p1" }]);
  });

  it("throws for unknown ids", async () => {
    const manager = makeManager();
    await expect(manager.unregister("ghost")).rejects.toThrow(/not found/);
  });
});

describe("loadFromUrl security guards", () => {
  it("rejects non-https URLs and emits plugin:error", async () => {
    const manager = makeManager();
    const errors = capture(manager, EVENTS.PLUGIN_ERROR);

    await expect(manager.loadFromUrl("http://cdn.jsdelivr.net/x.js")).rejects.toThrow(
      /must be loaded over HTTPS/,
    );
    expect(errors).toHaveLength(1);
  });

  it("rejects hosts outside the allowlist", async () => {
    const manager = makeManager();

    await expect(manager.loadFromUrl("https://evil.example/x.js")).rejects.toThrow(
      /is not allowed/,
    );
  });

  it("honors a custom allowlist", async () => {
    const manager = makeManager();

    await expect(
      manager.loadFromUrl("https://cdn.jsdelivr.net/x.js", {
        allowedHosts: ["my.host.only"],
      }),
    ).rejects.toThrow(/is not allowed/);
  });

  it("appends a script tag (with integrity) for an allowlisted https URL", async () => {
    const manager = makeManager();
    const appended: HTMLScriptElement[] = [];
    const spy = vi.spyOn(document.head, "appendChild").mockImplementation((node: Node) => {
      const script = node as HTMLScriptElement;
      appended.push(script);
      queueMicrotask(() => script.onload?.(new Event("load")));
      return node;
    });
    const loadedFromUrl = capture(manager, EVENTS.PLUGIN_LOADED_FROM_URL);

    await manager.loadFromUrl("https://cdn.jsdelivr.net/npm/x@1/dist/x.js", {
      integrity: "sha384-abc",
    });

    expect(appended).toHaveLength(1);
    expect(appended[0].src).toBe("https://cdn.jsdelivr.net/npm/x@1/dist/x.js");
    expect(appended[0].integrity).toBe("sha384-abc");
    expect(appended[0].crossOrigin).toBe("anonymous");
    expect(loadedFromUrl).toEqual([{ url: "https://cdn.jsdelivr.net/npm/x@1/dist/x.js" }]);
    spy.mockRestore();
  });
});

describe("destroy", () => {
  it("unloads every plugin (tolerating failures) and clears all state", async () => {
    const manager = makeManager();
    const ok = makePlugin("ok");
    const fragile = makePlugin("fragile", {
      destroy: vi.fn(async () => {
        throw new Error("nope");
      }),
    });
    await manager.register({ plugin: ok });
    await manager.register({ plugin: fragile });

    await manager.destroy();

    expect(ok.destroy).toHaveBeenCalled();
    expect(manager.getAll()).toHaveLength(0);
    expect(manager.getAllMetadata()).toHaveLength(0);
  });
});
