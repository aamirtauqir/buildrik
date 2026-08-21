/**
 * ComponentInstances + ComponentVariantResolver — instance lifecycle contracts.
 *
 * Covers: instantiateComponent (fresh IDs, instance record, data-bag),
 * recordInstanceOverride canonical `#/` position paths (root + nested,
 * ancestor walk from child elements), syncInstance (early-exit, re-clone with
 * override survival, overridesPreserved/Dropped event payload), variant swap,
 * detachInstance, and the resolver reads (getOverridesForElement /
 * getVariantStylesForElement) including the live Element.getStyles() merge.
 *
 * Uses the real ElementManager on a fake Composer (see elements/__tests__/
 * harness.ts) so paste/re-clone run against the real element tree.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import type { ElementData } from "../../../shared/types";
import type {
  ComponentDefinition,
  ComponentInstance,
  OverrideType,
} from "../../../shared/types/components";
import { makeEngine, emitsOf } from "../../elements/__tests__/harness";
import type { Composer } from "../../Composer";
import { ComponentInstanceUtils } from "../ComponentInstance";
import {
  type InstanceMaps,
  instantiateComponent,
  recordInstanceOverride,
  getInstancesOfComponent,
  detachInstance,
  detachAllInstances,
  syncInstance,
  resetInstance,
  syncAllInstances,
  updateInstanceVariant,
} from "../ComponentInstances";
import {
  findInstanceContainingElement,
  getElementPathWithinInstance,
  getVariantStylesForElement,
  getOverridesForElement,
} from "../ComponentVariantResolver";

function masterTree(): ElementData {
  return {
    id: "master-root",
    type: "container",
    tagName: "div",
    styles: { color: "#000" },
    children: [
      { id: "master-title", type: "heading", tagName: "h2", content: "Title", children: [] },
      {
        id: "master-box",
        type: "container",
        tagName: "div",
        children: [
          {
            id: "master-link",
            type: "link",
            tagName: "a",
            attributes: { href: "/master" },
            children: [],
          },
        ],
      },
    ],
  };
}

function makeComponent(overrides?: Partial<ComponentDefinition>): ComponentDefinition {
  return {
    id: "comp-1",
    name: "Card",
    masterTree: masterTree(),
    createdAt: 1,
    updatedAt: 1,
    version: 1,
    ...overrides,
  };
}

async function seed(component: ComponentDefinition = makeComponent()) {
  const { composer, manager } = makeEngine();
  const maps: InstanceMaps = { components: new Map(), instances: new Map() };
  const utils = new ComponentInstanceUtils(composer as unknown as Composer);
  maps.components.set(component.id, component);

  // Wire the composer.components facade the way ComponentManager does, so
  // Element.setStyle → recordInstanceOverride → getStyles() merge round-trips.
  composer.components = {
    recordInstanceOverride: (...args: unknown[]) =>
      recordInstanceOverride(
        composer as unknown as Composer,
        maps,
        utils,
        args[0] as string,
        args[1] as OverrideType,
        args[2] as string,
        args[3]
      ),
    getOverridesForElement: (elementId: string) =>
      getOverridesForElement(
        composer as unknown as Composer,
        maps.components,
        maps.instances,
        elementId
      ),
    findInstanceContainingElement: (elementId: string) =>
      findInstanceContainingElement(composer as unknown as Composer, maps.instances, elementId),
  };

  const page = manager.createPage("Home");
  const instanceId = (await instantiateComponent(
    composer as unknown as Composer,
    maps,
    component.id,
    page.root.id
  ))!;

  const c = composer as unknown as Composer;
  return { composer, manager, maps, utils, page, component, instanceId, c };
}

describe("instantiateComponent", () => {
  it("returns null for a missing component or parent", async () => {
    const { maps, manager, c } = await seed();
    const page = manager.getActivePage()!;
    expect(await instantiateComponent(c, maps, "ghost", page.root.id)).toBeNull();
    expect(await instantiateComponent(c, maps, "comp-1", "ghost-parent")).toBeNull();
  });

  it("clones the master with fresh IDs and mounts it under the parent", async () => {
    const { manager, instanceId, page } = await seed();
    const el = manager.getElement(instanceId)!;

    expect(instanceId).not.toBe("master-root");
    expect(el.getParent()?.getId()).toBe(page.root.id);
    expect(el.getChildren().map((e) => e.getType())).toEqual(["heading", "container"]);
    expect(el.getChildren().map((e) => e.getId())).not.toContain("master-title");
    // Deep structure survives, deeply registered.
    const link = el.getChildren()[1].getChildren()[0];
    expect(link.getAttribute("href")).toBe("/master");
    expect(manager.getElement(link.getId())).toBe(link);
  });

  /* Callers pass whatever is SELECTED — the components panel does, from two
     screens — and `pasteElement` performs no nesting check, so inserting a
     BUTTON-rooted component with a heading selected nested it INSIDE the
     heading, which rules.ts forbids ("button" is not allowed in a heading).
     The paste COMMAND does its own walk-up, which is why ⌘V behaved and this
     did not. Walked live: with a heading selected, a button component lands in
     the heading's container and the heading keeps zero children.

     (A CONTAINER in a heading is allowed by the matrix, so the same insert with
     the card component is legal and stays where it was put — that is the case
     the first assertion pins.) */
  it("leaves a legal target alone", async () => {
    const { manager, maps, c, instanceId } = await seed();
    const heading = manager.getElement(instanceId)!.getChildren()[0];
    expect(heading.getType()).toBe("heading");

    const id = (await instantiateComponent(c, maps, "comp-1", heading.getId()))!;

    expect(manager.getElement(id)!.getParent()?.getId()).toBe(heading.getId());
  });

  it("walks up to a parent that can hold it, rather than nesting illegally", async () => {
    const { manager, maps, c, instanceId } = await seed();
    const heading = manager.getElement(instanceId)!.getChildren()[0];
    maps.components.set("comp-btn", {
      ...makeComponent(),
      id: "comp-btn",
      masterTree: { id: "m-btn", type: "button", tagName: "button", content: "Go", children: [] },
    });

    const id = (await instantiateComponent(c, maps, "comp-btn", heading.getId()))!;

    expect(id).toBeTruthy();
    expect(heading.getChildCount()).toBe(0);
    // the heading's own parent is the instance root (a container) — that holds it
    expect(manager.getElement(id)!.getParent()?.getId()).toBe(instanceId);
  });

  it("registers the instance record and persists it on the element data-bag", async () => {
    const { composer, manager, maps, instanceId, component } = await seed();
    const instance = maps.instances.get(instanceId)!;
    expect(instance).toMatchObject({
      elementId: instanceId,
      componentId: component.id,
      overrides: [],
      syncedVersion: 1,
      isDetached: false,
    });
    expect(manager.getElement(instanceId)!.getCustomData("componentInstance")).toBe(instance);
    expect(emitsOf(composer, EVENTS.COMPONENT_INSTANTIATED)).toHaveLength(1);
  });
});

describe("recordInstanceOverride — canonical #/ position paths", () => {
  it("root element override → #/style/<prop>", async () => {
    const { maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);

    recordInstanceOverride(c, maps, utils, instanceId, "style", "color", "#2D6DFF");

    const instance = maps.instances.get(instanceId)!;
    expect(instance.overrides).toEqual([
      { op: "replace", path: "#/style/color", value: "#2D6DFF" },
    ]);
  });

  it("nested child override → #/children[i]/<type>/<prop>, recorded on the instance ROOT", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    const title = manager.getElement(instanceId)!.getChildren()[0];
    const link = manager.getElement(instanceId)!.getChildren()[1].getChildren()[0];

    recordInstanceOverride(c, maps, utils, title.getId(), "style", "color", "red");
    recordInstanceOverride(c, maps, utils, link.getId(), "attribute", "href", "/custom");

    const instance = maps.instances.get(instanceId)!;
    expect(instance.overrides).toEqual([
      { op: "replace", path: "#/children[0]/style/color", value: "red" },
      { op: "replace", path: "#/children[1].children[0]/attribute/href", value: "/custom" },
    ]);
    // The element data-bag carries the updated record for persistence.
    const bag = manager.getElement(instanceId)!.getCustomData("componentInstance");
    expect((bag as ComponentInstance).overrides).toHaveLength(2);
  });

  it("re-overriding the same path replaces instead of appending", async () => {
    const { maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    recordInstanceOverride(c, maps, utils, instanceId, "style", "color", "red");
    recordInstanceOverride(c, maps, utils, instanceId, "style", "color", "blue");

    const instance = maps.instances.get(instanceId)!;
    expect(instance.overrides).toHaveLength(1);
    expect(instance.overrides[0].value).toBe("blue");
  });

  it("is a no-op for elements outside any instance and for detached instances", async () => {
    const { manager, maps, instanceId, page, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    const outsider = manager.createElement("text");
    manager.addElement(outsider, page.root.id);

    recordInstanceOverride(c, maps, utils, outsider.getId(), "style", "color", "red");
    expect(maps.instances.get(instanceId)!.overrides).toEqual([]);

    maps.instances.get(instanceId)!.isDetached = true;
    recordInstanceOverride(c, maps, utils, instanceId, "style", "color", "red");
    expect(maps.instances.get(instanceId)!.overrides).toEqual([]);
  });

  // Pinned current behavior: INSTANCE_OVERRIDE fires TWICE per override — once
  // from ComponentInstanceUtils.applyOverride ({path,...}) and once from
  // recordInstanceOverride ({property,...}). UI listeners see double events.
  it("pins: one override emits INSTANCE_OVERRIDE twice (duplicate event)", async () => {
    const { composer, maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    composer.emit.mockClear();

    recordInstanceOverride(c, maps, utils, instanceId, "style", "color", "red");

    expect(emitsOf(composer, EVENTS.INSTANCE_OVERRIDE)).toHaveLength(2);
  });

  it.todo(
    "BUG: recordInstanceOverride double-emits INSTANCE_OVERRIDE (once in ComponentInstanceUtils.applyOverride, once in ComponentInstances.recordInstanceOverride) — should emit exactly once"
  );
});

describe("resolver — getOverridesForElement / Element.getStyles merge", () => {
  it("returns style overrides for the instance root and nested children by path", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    const title = manager.getElement(instanceId)!.getChildren()[0];
    recordInstanceOverride(c, maps, utils, instanceId, "style", "color", "#2D6DFF");
    recordInstanceOverride(c, maps, utils, title.getId(), "style", "font-size", "24px");

    expect(getOverridesForElement(c, maps.components, maps.instances, instanceId)).toEqual({
      color: "#2D6DFF",
    });
    expect(getOverridesForElement(c, maps.components, maps.instances, title.getId())).toEqual({
      "font-size": "24px",
    });
  });

  it("non-style overrides do not leak into the style override map", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    const link = manager.getElement(instanceId)!.getChildren()[1].getChildren()[0];
    recordInstanceOverride(c, maps, utils, link.getId(), "attribute", "href", "/x");

    expect(getOverridesForElement(c, maps.components, maps.instances, link.getId())).toEqual({});
  });

  it("live Element.setStyle on an instance element records AND resolves through getStyles()", async () => {
    const { manager, instanceId, maps } = await seed();
    const title = manager.getElement(instanceId)!.getChildren()[0];

    title.setStyle("color", "hotpink"); // → composer.components.recordInstanceOverride

    expect(maps.instances.get(instanceId)!.overrides).toEqual([
      { op: "replace", path: "#/children[0]/style/color", value: "hotpink" },
    ]);
    expect(title.getStyles().color).toBe("hotpink");
  });
});

describe("variant swap — updateInstanceVariant + getVariantStylesForElement", () => {
  const variants = [
    {
      id: "v-dark",
      name: "Dark",
      propertyValues: { Theme: "Dark" },
      styleOverrides: [
        { elementPath: "", property: "background", value: "#111" },
        { elementPath: "children[0]", property: "color", value: "#fff" },
      ],
    },
  ];

  it("returns false for missing instance, missing component, missing variant, or detached", async () => {
    const { maps, instanceId, c } = await seed(makeComponent({ variants }));
    expect(await updateInstanceVariant(c, maps, "ghost", "v-dark")).toBe(false);
    expect(await updateInstanceVariant(c, maps, instanceId, "v-ghost")).toBe(false);

    const noVariants = maps.instances.get(instanceId)!;
    noVariants.isDetached = true;
    expect(await updateInstanceVariant(c, maps, instanceId, "v-dark")).toBe(false);
  });

  it("selects the variant, persists it, and emits INSTANCE_VARIANT_CHANGED", async () => {
    const { composer, manager, maps, instanceId, c } = await seed(makeComponent({ variants }));
    composer.emit.mockClear();

    expect(await updateInstanceVariant(c, maps, instanceId, "v-dark")).toBe(true);

    expect(maps.instances.get(instanceId)!.variantSelection).toEqual({ variantId: "v-dark" });
    const bag = manager.getElement(instanceId)!.getCustomData("componentInstance");
    expect((bag as ComponentInstance).variantSelection?.variantId).toBe("v-dark");

    const events = emitsOf(composer, EVENTS.INSTANCE_VARIANT_CHANGED);
    expect(events).toHaveLength(1);
    expect(events[0][1]).toEqual({
      instanceId,
      componentId: "comp-1",
      variantId: "v-dark",
      variantName: "Dark",
    });
  });

  it("resolves variant styles by element path (root '' and children[0])", async () => {
    const { manager, maps, instanceId, c } = await seed(makeComponent({ variants }));
    await updateInstanceVariant(c, maps, instanceId, "v-dark");
    const title = manager.getElement(instanceId)!.getChildren()[0];

    expect(getVariantStylesForElement(c, maps.components, maps.instances, instanceId)).toEqual({
      background: "#111",
    });
    expect(getVariantStylesForElement(c, maps.components, maps.instances, title.getId())).toEqual({
      color: "#fff",
    });
    // Sibling subtree without variant overrides resolves to null.
    const box = manager.getElement(instanceId)!.getChildren()[1];
    expect(
      getVariantStylesForElement(c, maps.components, maps.instances, box.getId())
    ).toBeNull();
  });

  it("returns null when no variant is selected", async () => {
    const { maps, instanceId, c } = await seed(makeComponent({ variants }));
    expect(
      getVariantStylesForElement(c, maps.components, maps.instances, instanceId)
    ).toBeNull();
  });

  it("instance overrides WIN over variant styles in getOverridesForElement", async () => {
    const { maps, instanceId, c } = await seed(makeComponent({ variants }));
    const utils = new ComponentInstanceUtils(c);
    await updateInstanceVariant(c, maps, instanceId, "v-dark");
    recordInstanceOverride(c, maps, utils, instanceId, "style", "background", "tomato");

    expect(getOverridesForElement(c, maps.components, maps.instances, instanceId)).toEqual({
      background: "tomato",
    });
  });
});

describe("resetInstance — board 160:2's Reset to master", () => {
  it("drops the instance's own edits and rebuilds it from the master", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    const title = manager.getElement(instanceId)!.getChildren()[0];
    recordInstanceOverride(c, maps, utils, title.getId(), "style", "color", "hotpink");
    expect(maps.instances.get(instanceId)!.overrides.length).toBeGreaterThan(0);

    expect(await resetInstance(c, maps, instanceId)).toBe(true);

    // The element is re-cloned, so find the surviving instance by its record.
    const [, record] = [...maps.instances.entries()].find(
      ([, inst]) => inst.componentId === maps.components.keys().next().value
    )!;
    expect(record.overrides).toEqual([]);
  });

  it("runs even when the instance is already on the master's current version", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const before = manager.getElement(instanceId)!;
    expect(await resetInstance(c, maps, instanceId)).toBe(true);
    // sync alone would have early-returned with the same live object.
    expect(manager.getElement(instanceId)).not.toBe(before);
  });

  it("refuses a detached instance — it has no master to go back to", async () => {
    const { maps, instanceId, c } = await seed();
    maps.instances.get(instanceId)!.isDetached = true;
    expect(await resetInstance(c, maps, instanceId)).toBe(false);
  });
});

describe("syncInstance — override survival across master re-clone", () => {
  it("returns true WITHOUT re-cloning when already at the master version", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const before = manager.getElement(instanceId)!;
    expect(await syncInstance(c, maps, instanceId)).toBe(true);
    expect(manager.getElement(instanceId)).toBe(before); // same live object
  });

  it("returns false for detached instances, missing components, or unmounted elements", async () => {
    const { manager, maps, instanceId, component, c } = await seed();
    component.version = 2;

    // Missing component
    maps.components.delete(component.id);
    expect(await syncInstance(c, maps, instanceId)).toBe(false);
    maps.components.set(component.id, component);

    // Parent-less element
    const el = manager.getElement(instanceId)!;
    const parent = el.getParent()!;
    parent.removeChild(el);
    expect(await syncInstance(c, maps, instanceId)).toBe(false);
    parent.addChild(el);

    // Detached
    maps.instances.get(instanceId)!.isDetached = true;
    expect(await syncInstance(c, maps, instanceId)).toBe(false);
  });

  it("re-clones the new master, re-applies overrides, and reports preserved/dropped", async () => {
    const { composer, manager, maps, instanceId, component, page, c } = await seed();
    const utils = new ComponentInstanceUtils(c);
    const title = manager.getElement(instanceId)!.getChildren()[0];
    recordInstanceOverride(c, maps, utils, title.getId(), "style", "color", "hotpink");
    // Orphan override — targets a child position the master doesn't have.
    maps.instances.get(instanceId)!.overrides.push({
      op: "replace",
      path: "#/children[9]/style/color",
      value: "ghost",
    });

    // Master evolves: v2 changes the root color.
    component.masterTree.styles = { color: "#222" };
    component.version = 2;
    composer.emit.mockClear();

    expect(await syncInstance(c, maps, instanceId)).toBe(true);

    // Old instance element replaced in place under the page root — fully
    // deregistered from the ElementManager registry, not merely detached.
    expect(manager.getElement(instanceId)).toBeUndefined();
    expect(maps.instances.has(instanceId)).toBe(false);
    const root = manager.getElement(page.root.id)!;
    expect(root.getChildCount()).toBe(1);
    const fresh = root.getChildren()[0];
    const freshInstance = maps.instances.get(fresh.getId())!;
    expect(freshInstance.syncedVersion).toBe(2);
    expect(fresh.getCustomData("componentInstance")).toBe(freshInstance);

    // Master v2 change landed AND the manual override survived by position.
    expect(fresh.getStyle("color")).toBe("#222");
    expect(fresh.getChildren()[0].getStyle("color")).toBe("hotpink");

    const synced = emitsOf(composer, EVENTS.INSTANCE_SYNCED);
    expect(synced).toHaveLength(1);
    expect(synced[0][1]).toMatchObject({
      instanceId: fresh.getId(),
      oldInstanceId: instanceId,
      previousVersion: 1,
      newVersion: 2,
      overridesPreserved: 1,
      overridesDropped: 1,
    });
  });

  it("deregisters the OLD instance subtree on sync — no leaked elements", async () => {
    const { manager, maps, instanceId, component, c } = await seed();
    const oldEl = manager.getElement(instanceId)!;
    const oldIds = [oldEl.getId(), ...oldEl.getDescendants().map((e) => e.getId())];
    expect(oldIds.length).toBeGreaterThan(1);

    component.version = 2;
    expect(await syncInstance(c, maps, instanceId)).toBe(true);

    // None of the old clone's Element objects remain in the registry.
    const liveIds = new Set(manager.getAllElements().map((e) => e.getId()));
    for (const id of oldIds) {
      expect(liveIds.has(id)).toBe(false);
    }
  });

  it("syncAllInstances brings every stale instance of the component up to date", async () => {
    const { manager, maps, component, page, c } = await seed();
    // Second instance of the same component.
    await instantiateComponent(c, maps, component.id, page.root.id);
    component.version = 3;

    await syncAllInstances(c, maps, component.id);

    const versions = Array.from(maps.instances.values()).map((i) => i.syncedVersion);
    expect(versions).toEqual([3, 3]);
    expect(manager.getElement(page.root.id)!.getChildCount()).toBe(2);
  });
});

describe("detachInstance / detachAllInstances / getInstancesOfComponent", () => {
  it("returns false for unknown or already-detached instances", async () => {
    const { maps, instanceId, c } = await seed();
    expect(await detachInstance(c, maps, "ghost")).toBe(false);
    expect(await detachInstance(c, maps, instanceId)).toBe(true);
    expect(await detachInstance(c, maps, instanceId)).toBe(false); // gone from the map
  });

  it("clears the data-bag, removes the record, and emits INSTANCE_DETACHED", async () => {
    const { composer, manager, maps, instanceId, c } = await seed();
    composer.emit.mockClear();

    await detachInstance(c, maps, instanceId);

    expect(maps.instances.has(instanceId)).toBe(false);
    expect(manager.getElement(instanceId)!.getCustomData("componentInstance")).toBeUndefined();
    const events = emitsOf(composer, EVENTS.INSTANCE_DETACHED);
    expect(events).toHaveLength(1);
    expect(events[0][1]).toEqual({
      instanceId,
      componentId: "comp-1",
      componentName: "Card",
    });
  });

  it("reports componentName 'Unknown' when the master was already deleted", async () => {
    const { composer, maps, instanceId, c } = await seed();
    maps.components.clear();
    composer.emit.mockClear();

    await detachInstance(c, maps, instanceId);

    const events = emitsOf(composer, EVENTS.INSTANCE_DETACHED);
    expect((events[0][1] as { componentName: string }).componentName).toBe("Unknown");
  });

  it("getInstancesOfComponent filters detached + other components; detachAll returns the count", async () => {
    const { maps, component, page, instanceId, c } = await seed();
    const secondId = (await instantiateComponent(c, maps, component.id, page.root.id))!;
    const other = makeComponent({ id: "comp-2", name: "Other" });
    maps.components.set(other.id, other);
    const otherId = (await instantiateComponent(c, maps, other.id, page.root.id))!;

    expect(getInstancesOfComponent(maps, component.id).map((i) => i.elementId)).toEqual([
      instanceId,
      secondId,
    ]);

    expect(await detachAllInstances(c, maps, component.id)).toBe(2);
    expect(getInstancesOfComponent(maps, component.id)).toEqual([]);
    expect(maps.instances.has(otherId)).toBe(true); // untouched

    expect(await detachAllInstances(c, maps, component.id)).toBe(0);
  });
});

describe("resolver — findInstanceContainingElement / getElementPathWithinInstance", () => {
  it("resolves the instance from the root, any descendant, and returns null outside", async () => {
    const { manager, maps, instanceId, page, c } = await seed();
    const link = manager.getElement(instanceId)!.getChildren()[1].getChildren()[0];
    const outsider = manager.createElement("text");
    manager.addElement(outsider, page.root.id);

    expect(findInstanceContainingElement(c, maps.instances, instanceId)?.elementId).toBe(
      instanceId
    );
    expect(findInstanceContainingElement(c, maps.instances, link.getId())?.elementId).toBe(
      instanceId
    );
    expect(findInstanceContainingElement(c, maps.instances, outsider.getId())).toBeNull();
    expect(findInstanceContainingElement(c, maps.instances, "ghost")).toBeNull();
  });

  it("computes '' for the root and dotted children[...] paths for descendants", async () => {
    const { manager, maps, instanceId, c } = await seed();
    const instance = maps.instances.get(instanceId)!;
    const el = manager.getElement(instanceId)!;
    const title = el.getChildren()[0];
    const link = el.getChildren()[1].getChildren()[0];

    expect(getElementPathWithinInstance(c, instanceId, instance)).toBe("");
    expect(getElementPathWithinInstance(c, title.getId(), instance)).toBe("children[0]");
    expect(getElementPathWithinInstance(c, link.getId(), instance)).toBe(
      "children[1].children[0]"
    );
  });
});
