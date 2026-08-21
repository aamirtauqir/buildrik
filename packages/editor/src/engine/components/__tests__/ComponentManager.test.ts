/**
 * ComponentManager — registry CRUD, rehydration, autosync, export/import.
 *
 * Storage is mocked at the module boundary (same pattern as
 * variant-authoring.test.ts) so the manager's registry logic is exercised
 * without IndexedDB; ComponentStorage itself is covered by
 * ComponentStorage.test.ts against the fake-IndexedDB env.
 *
 * Instance flows run against the REAL ElementManager on a fake Composer
 * (elements/__tests__/harness.ts) — the updateComponentMaster autosync test
 * proves edits propagate to placed instances with overrides intact.
 *
 * @license BSD-3-Clause
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EVENTS } from "../../../shared/constants/events";
import type { ComponentDefinition } from "../../../shared/types/components";
import type { ElementData } from "../../../shared/types";
import { makeEngine, emitsOf, type FakeComposer } from "../../elements/__tests__/harness";
import type { Composer } from "../../Composer";

const saveComponent = vi.fn().mockResolvedValue(undefined);
const loadComponents = vi.fn().mockResolvedValue([]);
const deleteComponent = vi.fn().mockResolvedValue(undefined);
const exportComponents = vi.fn();
const importComponents = vi.fn();
const downloadComponentsFile = vi.fn();

vi.mock("../ComponentStorage", () => ({
  saveComponent: (...a: unknown[]) => saveComponent(...a),
  loadComponents: (...a: unknown[]) => loadComponents(...a),
  deleteComponent: (...a: unknown[]) => deleteComponent(...a),
  exportComponents: (...a: unknown[]) => exportComponents(...a),
  importComponents: (...a: unknown[]) => importComponents(...a),
  downloadComponentsFile: (...a: unknown[]) => downloadComponentsFile(...a),
  isStorageAvailable: () => false, // constructor skips auto-init
}));

import { ComponentManager } from "../ComponentManager";

function makeStack() {
  const { composer, manager } = makeEngine();
  const mgr = new ComponentManager(composer as unknown as Composer);
  composer.components = mgr as unknown as FakeComposer["components"];
  const page = manager.createPage("Home");
  return { composer, manager, mgr, page };
}

function sourceElement(manager: ReturnType<typeof makeStack>["manager"], rootId: string) {
  const card = manager.createElement("container", { classes: ["card"] });
  const title = manager.createElement("heading", { content: "Title" });
  manager.addElement(card, rootId);
  manager.addElement(title, card.getId());
  return card;
}

beforeEach(() => {
  saveComponent.mockClear();
  loadComponents.mockClear();
  deleteComponent.mockClear();
  exportComponents.mockReset();
  importComponents.mockReset();
  downloadComponentsFile.mockClear();
});

describe("ComponentManager.createComponent", () => {
  it("returns null when the source element does not exist", async () => {
    const { mgr } = makeStack();
    expect(await mgr.createComponent("Card", "ghost")).toBeNull();
  });

  it("snapshots the element tree as a deep-cloned master and persists it", async () => {
    const { composer, manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    composer.emit.mockClear();

    const comp = (await mgr.createComponent("Card", card.getId(), {
      description: "d",
      category: "ui",
      tags: ["t"],
      prefillFromDs: true,
    }))!;

    expect(comp.id).toMatch(/^comp-/);
    expect(comp.version).toBe(1);
    expect(comp.masterTree.children).toHaveLength(1);
    expect(comp.prefillFromDs).toBe(true);
    expect(mgr.getComponent(comp.id)).toBe(comp);
    expect(saveComponent).toHaveBeenCalledWith(comp, "default");

    // Deep clone: later element edits do NOT bleed into the stored master.
    card.getChildren()[0].setContent("edited");
    expect(comp.masterTree.children![0].content).toBe("Title");

    const created = emitsOf(composer, EVENTS.COMPONENT_CREATED);
    expect(created).toHaveLength(1);
    expect(created[0][1]).toMatchObject({ sourceElementId: card.getId() });
    expect(emitsOf(composer, EVENTS.COMPONENT_LIST_UPDATED)).toHaveLength(1);
  });
});

describe("ComponentManager registry reads", () => {
  function seedTwo(mgr: ComponentManager) {
    const older: ComponentDefinition = {
      id: "c-old",
      name: "Old",
      category: "ui",
      masterTree: { id: "r1", type: "container" } as ElementData,
      createdAt: 1,
      updatedAt: 100,
      version: 1,
    };
    const newer: ComponentDefinition = {
      id: "c-new",
      name: "New",
      category: "marketing",
      masterTree: { id: "r2", type: "container" } as ElementData,
      createdAt: 2,
      updatedAt: 200,
      version: 1,
    };
    const registry = (mgr as unknown as { components: Map<string, ComponentDefinition> })
      .components;
    registry.set(older.id, older);
    registry.set(newer.id, newer);
    return { older, newer };
  }

  it("getAllComponents sorts by updatedAt descending", () => {
    const { mgr } = makeStack();
    seedTwo(mgr);
    expect(mgr.getAllComponents().map((c) => c.id)).toEqual(["c-new", "c-old"]);
  });

  it("getComponentsByCategory filters", () => {
    const { mgr } = makeStack();
    seedTwo(mgr);
    expect(mgr.getComponentsByCategory("ui").map((c) => c.id)).toEqual(["c-old"]);
    expect(mgr.getComponentsByCategory("ghost")).toEqual([]);
  });

  it("getComponent misses return undefined", () => {
    const { mgr } = makeStack();
    expect(mgr.getComponent("ghost")).toBeUndefined();
  });
});

describe("ComponentManager.updateComponentMetadata / updateComponent alias", () => {
  it("returns false for a missing component (no persist)", async () => {
    const { mgr } = makeStack();
    expect(await mgr.updateComponentMetadata("ghost", { name: "X" })).toBe(false);
    expect(saveComponent).not.toHaveBeenCalled();
  });

  it("patches fields, bumps updatedAt, persists, and emits with changedFields", async () => {
    const { composer, manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;
    const before = comp.updatedAt;
    await new Promise((r) => setTimeout(r, 2));
    composer.emit.mockClear();
    saveComponent.mockClear();

    expect(await mgr.updateComponent(comp.id, { name: "Card v2", category: "ui" })).toBe(true);

    expect(comp.name).toBe("Card v2");
    expect(comp.updatedAt).toBeGreaterThan(before);
    expect(saveComponent).toHaveBeenCalledTimes(1);
    const updated = emitsOf(composer, EVENTS.COMPONENT_UPDATED);
    expect(updated[0][1]).toMatchObject({ changedFields: ["name", "category"] });
  });
});

describe("ComponentManager.updateComponentMaster — version bump + autosync", () => {
  it("returns false for a missing component or element", async () => {
    const { manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;
    expect((await mgr.updateComponentMaster("ghost", card.getId())).updated).toBe(false);
    expect((await mgr.updateComponentMaster(comp.id, "ghost")).updated).toBe(false);
    expect(comp.version).toBe(1);
  });

  it("bumps the version and auto-syncs placed instances, preserving overrides", async () => {
    const { composer, manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;

    const instanceId = (await mgr.instantiateComponent(comp.id, page.root.id))!;
    expect(mgr.isInstance(instanceId)).toBe(true);

    // Manual override on the instance's heading (via the live element API).
    const instanceEl = manager.getElement(instanceId)!;
    instanceEl.getChildren()[0].setStyle("color", "hotpink");
    expect(mgr.getInstance(instanceId)!.overrides).toHaveLength(1);

    // Master edit: source card gains a class; push to master.
    card.addClass("v2");
    composer.emit.mockClear();
    expect((await mgr.updateComponentMaster(comp.id, card.getId())).updated).toBe(true);

    expect(comp.version).toBe(2);
    expect(comp.masterTree.classes).toContain("v2");

    // Autosync re-instantiated the instance at version 2 with the override intact.
    const synced = emitsOf(composer, EVENTS.INSTANCE_SYNCED);
    expect(synced).toHaveLength(1);
    const payload = synced[0][1] as {
      instanceId: string;
      newVersion: number;
      overridesPreserved: number;
    };
    expect(payload.newVersion).toBe(2);
    expect(payload.overridesPreserved).toBe(1);
    const freshEl = manager.getElement(payload.instanceId)!;
    expect(freshEl.hasClass("v2")).toBe(true);
    expect(freshEl.getChildren()[0].getStyle("color")).toBe("hotpink");
    expect(mgr.getInstance(payload.instanceId)!.syncedVersion).toBe(2);
  });

  it("reports how many instances it synced and how many overrides it could not keep", async () => {
    const { manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;

    const a = (await mgr.instantiateComponent(comp.id, page.root.id))!;
    const b = (await mgr.instantiateComponent(comp.id, page.root.id))!;
    // Each instance overrides the heading the master is about to lose.
    manager.getElement(a)!.getChildren()[0].setStyle("color", "hotpink");
    manager.getElement(b)!.getChildren()[0].setStyle("color", "teal");
    expect(mgr.getInstance(a)!.overrides).toHaveLength(1);
    expect(mgr.getInstance(b)!.overrides).toHaveLength(1);

    // The new master drops the heading, so neither override has a target left.
    manager.removeElement(card.getChildren()[0].getId());

    const outcome = await mgr.updateComponentMaster(comp.id, card.getId());

    expect(outcome).toEqual({
      updated: true,
      instancesSynced: 2,
      overridesDropped: 2,
    });

    // The lost overrides are gone from the instances too. Left in place they
    // would be re-counted on every later update — the same warning, forever,
    // about an edit the user can no longer see.
    const again = await mgr.updateComponentMaster(comp.id, card.getId());
    expect(again.overridesDropped).toBe(0);
  });
});

describe("ComponentManager.duplicateComponent", () => {
  it("returns null for a missing source", async () => {
    const { mgr } = makeStack();
    expect(await mgr.duplicateComponent("ghost")).toBeNull();
  });

  it("clones with a fresh id, ' Copy' name, version reset to 1", async () => {
    const { manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;
    await mgr.updateComponentMaster(comp.id, card.getId()); // version 2

    const dup = (await mgr.duplicateComponent(comp.id))!;

    expect(dup.id).not.toBe(comp.id);
    expect(dup.name).toBe("Card Copy");
    expect(dup.version).toBe(1);
    expect(dup.masterTree).not.toBe(comp.masterTree); // deep-cloned
    expect(mgr.getComponent(dup.id)).toBe(dup);
  });
});

describe("ComponentManager.deleteComponent", () => {
  it("returns false for a missing component", async () => {
    const { mgr } = makeStack();
    expect(await mgr.deleteComponent("ghost")).toBe(false);
  });

  it("detaches all instances, removes from storage + registry, reports instanceCount", async () => {
    const { composer, manager, mgr, page } = makeStack();
    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;
    const i1 = (await mgr.instantiateComponent(comp.id, page.root.id))!;
    const i2 = (await mgr.instantiateComponent(comp.id, page.root.id))!;
    composer.emit.mockClear();

    expect(await mgr.deleteComponent(comp.id)).toBe(true);

    expect(mgr.getComponent(comp.id)).toBeUndefined();
    expect(deleteComponent).toHaveBeenCalledWith(comp.id);
    expect(mgr.isInstance(i1)).toBe(false);
    expect(mgr.isInstance(i2)).toBe(false);

    const deleted = emitsOf(composer, EVENTS.COMPONENT_DELETED);
    expect(deleted[0][1]).toEqual({
      componentId: comp.id,
      componentName: "Card",
      instanceCount: 2,
    });
  });
});

describe("ComponentManager.rehydrateInstances", () => {
  it("rebuilds the instance map from element data-bags, skipping detached records", async () => {
    const { manager, mgr, page } = makeStack();
    const live = manager.createElement("container");
    const detached = manager.createElement("container");
    manager.addElement(live, page.root.id);
    manager.addElement(detached, page.root.id);
    live.setData("componentInstance", {
      elementId: live.getId(),
      componentId: "comp-x",
      overrides: [],
      syncedVersion: 3,
      isDetached: false,
    });
    detached.setData("componentInstance", {
      elementId: detached.getId(),
      componentId: "comp-x",
      overrides: [],
      syncedVersion: 3,
      isDetached: true,
    });

    mgr.rehydrateInstances();

    expect(mgr.isInstance(live.getId())).toBe(true);
    expect(mgr.getInstanceByElementId(live.getId())?.syncedVersion).toBe(3);
    expect(mgr.isInstance(detached.getId())).toBe(false);
  });

  it("runs on PROJECT_LOADED for real project payloads only", async () => {
    const { composer, manager, mgr, page } = makeStack();
    const el = manager.createElement("container");
    manager.addElement(el, page.root.id);
    el.setData("componentInstance", {
      elementId: el.getId(),
      componentId: "comp-x",
      overrides: [],
      syncedVersion: 1,
      isDetached: false,
    });

    const loadedHandler = composer.on.mock.calls.find(
      (c) => c[0] === EVENTS.PROJECT_LOADED
    )![1] as (data: unknown) => void;

    loadedHandler({ importing: true }); // progress ping — ignored
    expect(mgr.isInstance(el.getId())).toBe(false);

    loadedHandler({ pages: [] }); // real project payload
    expect(mgr.isInstance(el.getId())).toBe(true);
  });
});

describe("ComponentManager export / import / config", () => {
  it("exportComponents(false) returns storage data without downloading", async () => {
    const { mgr } = makeStack();
    const data = { version: "1.0.0", projectId: "default", exportedAt: "x", components: [] };
    exportComponents.mockResolvedValue(data);

    expect(await mgr.exportComponents(false)).toBe(data);
    expect(downloadComponentsFile).not.toHaveBeenCalled();
  });

  it("exportComponents() downloads by default", async () => {
    const { mgr } = makeStack();
    const data = { version: "1.0.0", projectId: "default", exportedAt: "x", components: [] };
    exportComponents.mockResolvedValue(data);

    await mgr.exportComponents();
    expect(downloadComponentsFile).toHaveBeenCalledWith(data);
  });

  it("importComponents parses the file, stores, and reloads the registry", async () => {
    const { mgr } = makeStack();
    const payload = { version: "1.0.0", projectId: "p", exportedAt: "x", components: [] };
    const file = { text: async () => JSON.stringify(payload) } as unknown as File;
    importComponents.mockResolvedValue(7);
    loadComponents.mockClear();

    expect(await mgr.importComponents(file, true)).toBe(7);
    expect(importComponents).toHaveBeenCalledWith(payload, true);
    expect(loadComponents).toHaveBeenCalledTimes(1);
  });

  it("setProjectId reloads and scopes future persists to the new project", async () => {
    const { manager, mgr, page } = makeStack();
    await mgr.setProjectId("proj-2");
    expect(loadComponents).toHaveBeenCalledWith("proj-2");

    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;
    expect(saveComponent).toHaveBeenCalledWith(comp, "proj-2");
  });

  it("isAvailable is false when storage is unavailable; destroy clears registries", async () => {
    const { manager, mgr, page } = makeStack();
    expect(mgr.isAvailable()).toBe(false);

    const card = sourceElement(manager, page.root.id);
    const comp = (await mgr.createComponent("Card", card.getId()))!;
    const iid = (await mgr.instantiateComponent(comp.id, page.root.id))!;

    mgr.destroy();
    expect(mgr.getAllComponents()).toEqual([]);
    expect(mgr.isInstance(iid)).toBe(false);
  });
});
