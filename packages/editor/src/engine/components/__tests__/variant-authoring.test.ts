import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentDefinition, ComponentVariant } from "../../../shared/types/components";
import type { ElementData } from "../../../shared/types";

/**
 * C2 — master-level variant authoring. The engine already resolves variant styles
 * at render and lets an instance select a variant; these tests cover the missing
 * authoring half (setVariantProperties + add/update/remove variant on the master),
 * each persisting via saveComponent and refusing absent masters/variants.
 */

const saveComponent = vi.fn().mockResolvedValue(undefined);
vi.mock("../ComponentStorage", () => ({
  saveComponent: (...a: unknown[]) => saveComponent(...a),
  loadComponents: vi.fn().mockResolvedValue([]),
  isStorageAvailable: () => false, // skip constructor auto-init
}));

import { ComponentManager } from "../ComponentManager";

function makeComposer() {
  return { emit: vi.fn(), on: vi.fn() } as never;
}

function seed(mgr: ComponentManager, comp: ComponentDefinition) {
  (mgr as unknown as { components: Map<string, ComponentDefinition> }).components.set(comp.id, comp);
}

function baseComponent(): ComponentDefinition {
  return {
    id: "c1",
    name: "Button",
    category: "ui",
    masterTree: { id: "root", type: "container" } as ElementData,
    createdAt: 1,
    updatedAt: 1,
    version: 1,
  };
}

const variant: ComponentVariant = {
  id: "v-md-hover",
  name: "M / Hover",
  propertyValues: { Size: "M", State: "Hover" },
  styleOverrides: [{ elementPath: "", property: "background", value: "#2D6DFF" }],
};

let mgr: ComponentManager;
beforeEach(() => {
  saveComponent.mockClear();
  mgr = new ComponentManager(makeComposer());
});

describe("variant authoring (C2)", () => {
  it("setVariantProperties stores the axes and persists", async () => {
    seed(mgr, baseComponent());
    const ok = await mgr.setVariantProperties("c1", [{ name: "Size", values: ["S", "M", "L"], defaultValue: "M" }]);
    expect(ok).toBe(true);
    expect(mgr.getComponent("c1")?.variantProperties?.[0].values).toEqual(["S", "M", "L"]);
    expect(saveComponent).toHaveBeenCalledOnce();
  });

  it("addVariant appends a variant; persists", async () => {
    seed(mgr, baseComponent());
    expect(await mgr.addVariant("c1", variant)).toBe(true);
    expect(mgr.getComponent("c1")?.variants).toHaveLength(1);
    expect(mgr.getComponent("c1")?.variants?.[0].id).toBe("v-md-hover");
  });

  it("addVariant rejects a duplicate id", async () => {
    const c = baseComponent();
    c.variants = [variant];
    seed(mgr, c);
    expect(await mgr.addVariant("c1", variant)).toBe(false);
    expect(mgr.getComponent("c1")?.variants).toHaveLength(1);
  });

  it("updateVariant patches in place, keeping the id", async () => {
    const c = baseComponent();
    c.variants = [variant];
    seed(mgr, c);
    expect(await mgr.updateVariant("c1", "v-md-hover", { name: "Medium / Hover" })).toBe(true);
    const v = mgr.getComponent("c1")?.variants?.[0];
    expect(v?.name).toBe("Medium / Hover");
    expect(v?.id).toBe("v-md-hover"); // id immutable
  });

  it("removeVariant deletes by id", async () => {
    const c = baseComponent();
    c.variants = [variant];
    seed(mgr, c);
    expect(await mgr.removeVariant("c1", "v-md-hover")).toBe(true);
    expect(mgr.getComponent("c1")?.variants).toHaveLength(0);
  });

  it("returns false for a missing master or missing variant (no persist)", async () => {
    expect(await mgr.addVariant("nope", variant)).toBe(false);
    seed(mgr, baseComponent());
    expect(await mgr.updateVariant("c1", "ghost", { name: "x" })).toBe(false);
    expect(await mgr.removeVariant("c1", "ghost")).toBe(false);
    expect(saveComponent).not.toHaveBeenCalled();
  });
});
