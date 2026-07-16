/**
 * DataManager — source registry, binding resolution, condition evaluation,
 * contexts, globals, watch, and element binding application.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi } from "vitest";
import { DataManager } from "../DataManager";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../Composer";
import type { DataBinding, DataSource } from "@/shared/types/data";

function makeManager(): DataManager {
  return new DataManager({} as unknown as Composer);
}

function userSource(): DataSource {
  return {
    id: "user",
    name: "User",
    type: "object",
    data: { profile: { name: "Ada", age: 36 }, tags: ["a", "b"] },
  };
}

function binding(partial: Partial<DataBinding> = {}): DataBinding {
  return { type: "variable", sourceId: "user", path: "profile.name", ...partial };
}

describe("source registration", () => {
  it("registerSource stores the source and emits source:registered + source:updated", () => {
    const dm = makeManager();
    const registered = vi.fn();
    const updated = vi.fn();
    dm.on(EVENTS.DATA_SOURCE_REGISTERED, registered);
    dm.on(EVENTS.DATA_SOURCE_UPDATED, updated);

    const source = userSource();
    dm.registerSource(source);

    expect(dm.getSource("user")).toBe(source);
    expect(registered).toHaveBeenCalledWith(source);
    expect(updated).toHaveBeenCalledWith({ id: "user", data: source.data });
  });

  it("registering a duplicate id throws", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    expect(() => dm.registerSource(userSource())).toThrow(/already exists/);
  });

  it("unregisterSource removes and emits source:unregistered + source:updated(undefined)", () => {
    const dm = makeManager();
    const unregistered = vi.fn();
    const updated = vi.fn();
    dm.registerSource(userSource());
    dm.on(EVENTS.DATA_SOURCE_UNREGISTERED, unregistered);
    dm.on(EVENTS.DATA_SOURCE_UPDATED, updated);

    dm.unregisterSource("user");

    expect(dm.getSource("user")).toBeUndefined();
    expect(unregistered).toHaveBeenCalledWith({ id: "user" });
    expect(updated).toHaveBeenCalledWith({ id: "user", data: undefined });
  });

  it("unregisterSource of an unknown id is a silent no-op", () => {
    const dm = makeManager();
    const unregistered = vi.fn();
    dm.on(EVENTS.DATA_SOURCE_UNREGISTERED, unregistered);
    dm.unregisterSource("ghost");
    expect(unregistered).not.toHaveBeenCalled();
  });

  it("updateSourceData replaces data and emits source:updated; unknown id throws", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const updated = vi.fn();
    dm.on(EVENTS.DATA_SOURCE_UPDATED, updated);

    dm.updateSourceData("user", { profile: { name: "Grace" } });

    expect(updated).toHaveBeenCalledWith({ id: "user", data: { profile: { name: "Grace" } } });
    expect((dm.getSource("user")?.data as { profile: { name: string } }).profile.name).toBe(
      "Grace",
    );
    expect(() => dm.updateSourceData("ghost", {})).toThrow(/not found/);
  });

  it("getAllSources lists every registered source", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    dm.registerSource({ id: "items", name: "Items", type: "array", data: [1, 2] });
    expect(dm.getAllSources().map((s) => s.id)).toEqual(["user", "items"]);
  });
});

describe("resolve", () => {
  it("resolves a dotted path against object data", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());

    const result = await dm.resolve(binding());

    expect(result).toEqual({ success: true, value: "Ada" });
  });

  it("returns fallback with success:false when the source is missing", async () => {
    const dm = makeManager();
    const result = await dm.resolve(binding({ sourceId: "ghost", fallback: "N/A" }));
    expect(result.success).toBe(false);
    expect(result.value).toBe("N/A");
    expect(result.error).toMatch(/not found/);
  });

  it("uses fallback when the path resolves to undefined (success stays true)", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const result = await dm.resolve(binding({ path: "profile.missing", fallback: "fb" }));
    expect(result).toEqual({ success: true, value: "fb" });
  });

  it("calls getData for function sources", async () => {
    const dm = makeManager();
    const getData = vi.fn(async () => ({ now: 42 }));
    dm.registerSource({ id: "fn", name: "Fn", type: "function", getData });

    const result = await dm.resolve(binding({ sourceId: "fn", path: "now" }));

    expect(getData).toHaveBeenCalled();
    expect(result.value).toBe(42);
  });

  it("applies the transform function to the resolved value", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const result = await dm.resolve(
      binding({ transform: (v) => String(v).toUpperCase() }),
    );
    expect(result.value).toBe("ADA");
  });

  it("returns fallback with the error message when the transform throws", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const result = await dm.resolve(
      binding({
        fallback: "fb",
        transform: () => {
          throw new Error("bad transform");
        },
      }),
    );
    expect(result).toEqual({ success: false, value: "fb", error: "bad transform" });
  });

  it("context variables win over source data for the same path", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const ctx = dm.createContext();
    ctx.set("profile.name", "FromContext");

    const result = await dm.resolve(binding(), ctx);

    expect(result.value).toBe("FromContext");
  });
});

describe("evaluateCondition", () => {
  const dm = makeManager();
  dm.registerSource({
    id: "stats",
    name: "Stats",
    type: "object",
    data: { count: 5, label: "hello world", list: [] },
  });

  it.each([
    [{ left: 5, operator: "==" as const, right: 5 }, true],
    [{ left: 5, operator: "!=" as const, right: 4 }, true],
    [{ left: 5, operator: ">" as const, right: 4 }, true],
    [{ left: 5, operator: "<" as const, right: 4 }, false],
    [{ left: 5, operator: ">=" as const, right: 5 }, true],
    [{ left: 4, operator: "<=" as const, right: 5 }, true],
    [{ left: "hello world", operator: "contains" as const, right: "lo wo" }, true],
    [{ left: "hello", operator: "startsWith" as const, right: "he" }, true],
    [{ left: "hello", operator: "endsWith" as const, right: "lo" }, true],
    [{ left: "x", operator: "exists" as const }, true],
    [{ left: null, operator: "exists" as const }, false],
    [{ left: "", operator: "empty" as const }, true],
    [{ left: [], operator: "empty" as const }, true],
  ])("evaluates %j → %s", async (expr, expected) => {
    expect(await dm.evaluateCondition(expr as never)).toBe(expected);
  });

  it("resolves binding operands before comparing", async () => {
    const result = await dm.evaluateCondition({
      left: { type: "variable", sourceId: "stats", path: "count" },
      operator: ">",
      right: 3,
    } as never);
    expect(result).toBe(true);
  });

  it("AND groups require every condition; OR groups require any", async () => {
    const t = { left: 1, operator: "==" as const, right: 1 };
    const f = { left: 1, operator: "==" as const, right: 2 };

    expect(await dm.evaluateCondition({ operator: "AND", conditions: [t, f] } as never)).toBe(
      false,
    );
    expect(await dm.evaluateCondition({ operator: "AND", conditions: [t, t] } as never)).toBe(
      true,
    );
    expect(await dm.evaluateCondition({ operator: "OR", conditions: [f, t] } as never)).toBe(true);
    expect(await dm.evaluateCondition({ operator: "OR", conditions: [f, f] } as never)).toBe(
      false,
    );
  });

  it("unknown operator returns false", async () => {
    expect(
      await dm.evaluateCondition({ left: 1, operator: "matches", right: 1 } as never),
    ).toBe(false);
  });
});

describe("contexts + globals", () => {
  it("child context falls through to parent; set shadows locally", () => {
    const dm = makeManager();
    const parent = dm.createContext();
    parent.set("theme", "dark");
    const child = dm.createContext(parent);

    expect(child.get("theme")).toBe("dark");
    child.set("theme", "light");
    expect(child.get("theme")).toBe("light");
    expect(parent.get("theme")).toBe("dark");
  });

  it("setGlobalVariable stores in the global context and emits global:updated", () => {
    const dm = makeManager();
    const handler = vi.fn();
    dm.on(EVENTS.DATA_GLOBAL_UPDATED, handler);

    dm.setGlobalVariable("locale", "en");

    expect(dm.getGlobalVariable("locale")).toBe("en");
    expect(dm.getGlobalContext().get("locale")).toBe("en");
    expect(handler).toHaveBeenCalledWith({ name: "locale", value: "en" });
  });
});

describe("import / export / clear", () => {
  it("importSampleData auto-creates typed sources and emits sample:imported", () => {
    const dm = makeManager();
    const imported = vi.fn();
    dm.on(EVENTS.DATA_SAMPLE_IMPORTED, imported);

    dm.importSampleData(JSON.stringify({ products: [1, 2], settings: { a: 1 } }));

    expect(dm.getSource("products")?.type).toBe("array");
    expect(dm.getSource("settings")?.type).toBe("object");
    expect(imported).toHaveBeenCalledWith({ products: [1, 2], settings: { a: 1 } });
  });

  it("exportData serializes object/array sources but skips function sources", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    dm.registerSource({ id: "fn", name: "Fn", type: "function", getData: async () => 1 });

    const exported = JSON.parse(dm.exportData());

    expect(Object.keys(exported)).toEqual(["user"]);
  });

  it("clear drops all sources, resets globals, and emits data:cleared", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    dm.setGlobalVariable("x", 1);
    const cleared = vi.fn();
    dm.on(EVENTS.DATA_CLEARED, cleared);

    dm.clear();

    expect(dm.getAllSources()).toHaveLength(0);
    expect(dm.getGlobalVariable("x")).toBeUndefined();
    expect(cleared).toHaveBeenCalled();
  });
});

describe("watch", () => {
  it("throws for an unknown source", () => {
    const dm = makeManager();
    expect(() => dm.watch("ghost.path", vi.fn())).toThrow(/not found/);
  });

  it("immediate option fires the callback with the current value", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const cb = vi.fn();

    dm.watch("user.profile.name", cb, { immediate: true });

    expect(cb).toHaveBeenCalledWith("Ada");
  });

  it("fires on updateSourceData for the watched source and stops after unwatch", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const cb = vi.fn();

    const unwatch = dm.watch("user.profile.name", cb);
    dm.updateSourceData("user", { profile: { name: "Grace" } });
    expect(cb).toHaveBeenCalledWith("Grace");

    cb.mockClear();
    unwatch();
    dm.updateSourceData("user", { profile: { name: "Alan" } });
    expect(cb).not.toHaveBeenCalled();
  });

  it("ignores updates to other sources", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    dm.registerSource({ id: "other", name: "Other", type: "object", data: {} });
    const cb = vi.fn();

    dm.watch("user.profile.name", cb);
    dm.updateSourceData("other", { profile: { name: "X" } });

    expect(cb).not.toHaveBeenCalled();
  });
});

describe("element binding application", () => {
  function makeElementMock() {
    return {
      setDataBinding: vi.fn(),
      setContent: vi.fn(),
      setAttribute: vi.fn(),
      removeAttribute: vi.fn(),
      getChildren: vi.fn(() => []),
      removeChild: vi.fn(),
      duplicate: vi.fn(),
      getDataBindings: vi.fn(() => ({})),
    };
  }

  it("bindVariable stores the binding and writes the resolved value as content", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const el = makeElementMock();

    dm.bindVariable(el as never, "user", "profile.name");
    await vi.waitFor(() => expect(el.setContent).toHaveBeenCalledWith("Ada"));

    expect(el.setDataBinding).toHaveBeenCalledWith(
      "content",
      expect.objectContaining({ type: "variable", sourceId: "user", path: "profile.name" }),
    );
  });

  it("bindVariable resolves a named transform from the central registry", async () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const el = makeElementMock();

    dm.bindVariable(el as never, "user", "profile.name", { transform: "uppercase" });

    await vi.waitFor(() => expect(el.setContent).toHaveBeenCalledWith("ADA"));
  });

  it("bindVariable falls back when the source is missing", async () => {
    const dm = makeManager();
    const el = makeElementMock();

    dm.bindVariable(el as never, "ghost", "x", { fallback: "fb" });

    await vi.waitFor(() => expect(el.setContent).toHaveBeenCalledWith("fb"));
  });

  it("bindCondition toggles data-condition-hidden from the condition result", async () => {
    const dm = makeManager();
    const elVisible = makeElementMock();
    const elHidden = makeElementMock();

    dm.bindCondition(elVisible as never, { left: 1, operator: "==", right: 1 } as never);
    dm.bindCondition(elHidden as never, { left: 1, operator: "==", right: 2 } as never);

    await vi.waitFor(() =>
      expect(elVisible.removeAttribute).toHaveBeenCalledWith("data-condition-hidden"),
    );
    await vi.waitFor(() =>
      expect(elHidden.setAttribute).toHaveBeenCalledWith("data-condition-hidden", "true"),
    );
  });

  it("bindCollection clears existing children and duplicates one child per item", async () => {
    const dm = makeManager();
    dm.registerSource({
      id: "catalog",
      name: "Catalog",
      type: "object",
      data: { items: ["x", "y", "z"] },
    });
    const el = makeElementMock();
    const existingChild = { id: "old" };
    el.getChildren.mockReturnValue([existingChild] as never);
    el.duplicate.mockImplementation(() => ({ getDataBindings: () => ({}), setContent: vi.fn() }));

    dm.bindCollection(el as never, "catalog", "items", "item");

    await vi.waitFor(() => expect(el.duplicate).toHaveBeenCalledTimes(3));
    expect(el.removeChild).toHaveBeenCalledWith(existingChild);
  });
});

describe("destroy", () => {
  it("clears sources and listeners", () => {
    const dm = makeManager();
    dm.registerSource(userSource());
    const handler = vi.fn();
    dm.on(EVENTS.DATA_CLEARED, handler);

    dm.destroy();

    expect(dm.getAllSources()).toHaveLength(0);
    // destroy() → clear() emits before removeAllListeners, then listeners drop.
    expect(handler).toHaveBeenCalledTimes(1);
    dm.registerSource(userSource());
    dm.clear();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
