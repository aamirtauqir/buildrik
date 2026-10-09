/**
 * Component Instance Management
 * Handles instantiation, override recording, detaching, syncing, and variant updates.
 *
 * @module engine/components/ComponentInstances
 * @license BSD-3-Clause
 */

import { EVENTS } from "@/shared/constants";
import type { ElementData, ElementType } from "@/shared/types";
import type {
  ComponentDefinition,
  ComponentInstance,
  OverrideType,
} from "@/shared/types/components";
import { devError } from "@/shared/utils/devLogger";
import { deepClone } from "@/shared/utils/helpers";
import { canNestElement } from "@/shared/utils/nesting";
import type { Composer } from "../Composer";
import type { Element } from "../elements/Element";
import { applyOverridesToTree, ComponentInstanceUtils, resolveNodeByElementPath } from "./ComponentInstance";
import {
  findInstanceContainingElement,
  getElementPathWithinInstance,
  markInstanceElementsDirty,
} from "./ComponentVariantResolver";

/**
 * Shared instance maps passed in from the facade.
 */
export interface InstanceMaps {
  components: Map<string, ComponentDefinition>;
  instances: Map<string, ComponentInstance>;
}

// ============================================
// Private Helpers
// ============================================

/**
 * Clone element data with freshly generated IDs.
 */
function cloneWithNewIds(data: ElementData): ElementData {
  const generateId = () => `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const clone = (node: ElementData): ElementData => {
    const cloned: ElementData = {
      ...node,
      id: generateId(),
      children: node.children?.map((child) => clone(child)),
    };
    return cloned;
  };

  return clone(deepClone(data));
}

// ============================================
// Instance CRUD
// ============================================

/**
 * Instantiate a component on the canvas.
 */
export async function instantiateComponent(
  composer: Composer,
  maps: InstanceMaps,
  componentId: string,
  parentId: string,
  _index?: number
): Promise<string | null> {
  const component = maps.components.get(componentId);
  if (!component) return null;

  let requested = composer.elements.getElement(parentId);
  if (!requested) return null;

  /* L2-006: an instance's children are its master's, so a target that is an
     instance (or inside one) never takes the new instance as a child — that
     nested a card in the selected card. It goes right after the outermost
     instance root instead. */
  let afterInstance: Element | null = null;
  let host = findInstanceContainingElement(composer, maps.instances, requested.getId());
  while (host) {
    const el = composer.elements.getElement(host.elementId);
    if (!el) break;
    afterInstance = el;
    const up = el.getParent();
    host = up ? findInstanceContainingElement(composer, maps.instances, up.getId()) : null;
  }
  const hostParent = afterInstance?.getParent();
  if (afterInstance && hostParent) {
    requested = hostParent;
    _index = hostParent.getChildIndex(afterInstance) + 1;
  }

  /* Put the instance where it can legally live. Callers pass whatever is
     SELECTED — the components panel does, twice — so inserting a card with a
     heading selected nested it inside that heading, which `rules.ts` forbids
     outright. `pasteElement` performs no nesting check (the paste COMMAND does
     its own walk-up, which is why ⌘V behaves and this did not). Walk up from
     the requested parent, then fall back to the page root. */
  const childType = component.masterTree.type as ElementType;
  let parent: Element | null = requested;
  while (parent && !canNestElement(childType, parent.getType() as ElementType)) {
    parent = parent.getParent() ?? null;
  }
  if (!parent) {
    const page = composer.elements.getActivePage();
    const root = page?.root?.id ? composer.elements.getElement(page.root.id) : null;
    parent = root && canNestElement(childType, root.getType() as ElementType) ? root : null;
  }
  if (!parent) return null;

  const clonedData = cloneWithNewIds(component.masterTree);

  // The index only means something inside the parent the caller asked for.
  const index = parent === requested ? _index : undefined;
  const element = composer.elements.pasteElement(clonedData, parent, index, false);
  if (!element) return null;

  const instance: ComponentInstance = {
    elementId: element.getId(),
    componentId,
    overrides: [],
    syncedVersion: component.version,
    isDetached: false,
  };

  maps.instances.set(element.getId(), instance);
  element.setData("componentInstance", instance);

  composer.emit(EVENTS.COMPONENT_INSTANTIATED, {
    instance,
    component,
    parentId: parent.getId(),
  });
  composer.markDirty();

  return element.getId();
}

/**
 * Record a manual override on a component instance element.
 */
export function recordInstanceOverride(
  composer: Composer,
  maps: InstanceMaps,
  instanceUtils: ComponentInstanceUtils,
  elementId: string,
  type: OverrideType,
  property: string,
  value: unknown
): void {
  const instance = findInstanceContainingElement(composer, maps.instances, elementId);
  if (!instance || instance.isDetached) return;

  const elementPath = getElementPathWithinInstance(composer, elementId, instance);
  const path = `#/${elementPath}${elementPath ? "/" : ""}${type}/${property}`;

  const updatedInstance = instanceUtils.applyOverride(instance, path, type, value);

  maps.instances.set(instance.elementId, updatedInstance);

  const rootElement = composer.elements.getElement(instance.elementId);
  if (rootElement) {
    rootElement.setData("componentInstance", updatedInstance);
  }

  composer.emit(EVENTS.INSTANCE_OVERRIDE, {
    instanceId: instance.elementId,
    elementId,
    type,
    property,
    value,
  });
}

/**
 * Drop ONE recorded override and put the master's value back on that element
 * (board 26: the override dot's "Reset to master"). The instance's other edits
 * stay — `resetInstance` is the whole-instance reset.
 *
 * The master's value is written first (a style write re-records an override,
 * with the master's value) and the op is dropped after, so what is left is the
 * instance's remaining edits only. A property the master never set is removed.
 * Returns false when the element is not in a live instance or the property
 * carries no override of that type. Callers own the lock gate + transaction.
 */
export function resetInstanceOverride(
  composer: Composer,
  maps: InstanceMaps,
  elementId: string,
  type: OverrideType,
  property: string
): boolean {
  const instance = findInstanceContainingElement(composer, maps.instances, elementId);
  if (!instance || instance.isDetached) return false;
  const element = composer.elements.getElement(elementId);
  if (!element) return false;

  const elementPath = getElementPathWithinInstance(composer, elementId, instance);
  const path = `#/${elementPath}${elementPath ? "/" : ""}${type}/${property}`;
  if (!instance.overrides.some((op) => op.path === path)) return false;

  const component = maps.components.get(instance.componentId);
  const master = component ? resolveNodeByElementPath(component.masterTree, elementPath) : null;
  if (type === "style") {
    const value = master?.styles?.[property];
    if (value === undefined) element.removeStyle(property);
    else element.setStyle(property, value);
  } else if (type === "attribute") {
    const value = master?.attributes?.[property];
    if (value === undefined) element.removeAttribute(property);
    else element.setAttribute(property, value);
  } else if (type === "content") {
    element.setContent(master?.content ?? "");
  } else {
    return false;
  }

  /* Re-read: the style / attribute write above re-recorded the path. */
  const current = maps.instances.get(instance.elementId) ?? instance;
  const updated: ComponentInstance = { ...current, overrides: current.overrides.filter((op) => op.path !== path) };
  maps.instances.set(instance.elementId, updated);
  composer.elements.getElement(instance.elementId)?.setData("componentInstance", updated);
  composer.emit(EVENTS.INSTANCE_OVERRIDE, { instanceId: instance.elementId, elementId, type, property, reset: true });
  composer.emit(EVENTS.ELEMENT_UPDATED, element);
  return true;
}

/**
 * Get all non-detached instances of a component.
 */
export function getInstancesOfComponent(
  maps: InstanceMaps,
  componentId: string
): ComponentInstance[] {
  return Array.from(maps.instances.values()).filter(
    (inst) => inst.componentId === componentId && !inst.isDetached
  );
}

/**
 * Detach an instance (convert to regular elements).
 */
export async function detachInstance(
  composer: Composer,
  maps: InstanceMaps,
  elementId: string
): Promise<boolean> {
  const instance = maps.instances.get(elementId);
  if (!instance || instance.isDetached) return false;

  const component = maps.components.get(instance.componentId);

  instance.isDetached = true;

  const element = composer.elements.getElement(elementId);
  if (element) {
    element.setData("componentInstance", undefined);
  }

  maps.instances.delete(elementId);

  composer.emit(EVENTS.INSTANCE_DETACHED, {
    instanceId: elementId,
    componentId: instance.componentId,
    componentName: component?.name ?? "Unknown",
  });
  composer.markDirty();

  return true;
}

/**
 * Detach all instances of a component. Returns the count detached.
 */
export async function detachAllInstances(
  composer: Composer,
  maps: InstanceMaps,
  componentId: string
): Promise<number> {
  const instances = getInstancesOfComponent(maps, componentId);
  for (const instance of instances) {
    await detachInstance(composer, maps, instance.elementId);
  }
  return instances.length;
}

// ============================================
// Sync
// ============================================

/**
 * What a sync did, not just whether it happened.
 *
 * `overridesDropped` counts this instance's own edits that pointed at a master
 * element the new master no longer has. They cannot be re-applied, so they are
 * lost — and the only place that ever said so was `devError`, which is a no-op
 * in production. A user who customised an instance had it silently reverted.
 */
export interface SyncOutcome {
  synced: boolean;
  overridesDropped: number;
}

const NOT_SYNCED: SyncOutcome = { synced: false, overridesDropped: 0 };

/**
 * Sync an instance to the latest master version.
 */
export async function syncInstance(
  composer: Composer,
  maps: InstanceMaps,
  elementId: string
): Promise<SyncOutcome> {
  const instance = maps.instances.get(elementId);
  if (!instance || instance.isDetached) return NOT_SYNCED;

  const component = maps.components.get(instance.componentId);
  if (!component) return NOT_SYNCED;

  if (instance.syncedVersion >= component.version) {
    return { synced: true, overridesDropped: 0 };
  }

  const previousVersion = instance.syncedVersion;

  const element = composer.elements.getElement(elementId);
  if (!element) return NOT_SYNCED;

  const parent = element.getParent();
  if (!parent) return NOT_SYNCED;

  let overridesDropped = 0;
  composer.beginTransaction?.("instance-sync");
  try {
    const index = parent.getChildIndex(element);

    // Build and mount the NEW tree before the old one goes: anything below can
    // throw on a malformed master, and the catch below does not roll back — a
    // failure used to leave the instance deleted from the canvas.
    const clonedData = cloneWithNewIds(component.masterTree);

    // F1a core fix: re-apply the instance's stored overrides onto the freshly
    // cloned master tree BEFORE it mounts. Without this, syncInstance carried
    // `instance.overrides` via spread but never applied them, so every manual
    // customization reverted to master on each propagate. Overrides are keyed by
    // position path, so they re-target correctly as long as the master structure
    // is unchanged. Orphaned overrides (master element removed) are dropped and
    // reported, never silently lost.
    const { applied, dropped, kept } = applyOverridesToTree(clonedData, instance.overrides);
    overridesDropped = dropped;

    // Inserted at the old instance's index, so it lands just before it.
    const newElement = composer.elements.pasteElement(clonedData, parent, index, false);
    if (!newElement) throw new Error("Failed to re-instantiate during sync");

    // Fully delete the OLD instance subtree from the ElementManager registry —
    // not just detach it from the tree. removeChild alone leaves every old
    // clone Element registered, so each sync leaks the previous subtree
    // (getAllElements / findByMediaSrc keep seeing stale nodes). removeElement
    // both unlinks from the parent and deregisters the whole subtree.
    composer.elements.removeElement(elementId);

    const newInstance: ComponentInstance = {
      ...instance,
      elementId: newElement.getId(),
      syncedVersion: component.version,
      // Only the overrides that still have a target survive — see `kept`.
      overrides: kept,
    };

    maps.instances.delete(elementId);
    maps.instances.set(newElement.getId(), newInstance);

    newElement.setData("componentInstance", newInstance);

    markInstanceElementsDirty(composer, newInstance);

    composer.emit(EVENTS.INSTANCE_SYNCED, {
      instanceId: newElement.getId(),
      oldInstanceId: elementId,
      componentId: instance.componentId,
      previousVersion,
      newVersion: component.version,
      overridesPreserved: applied,
      overridesDropped: dropped,
    });

    composer.markDirty();
  } catch (err) {
    devError("ComponentManager", "Sync failed", err);
    return NOT_SYNCED;
  } finally {
    composer.endTransaction?.();
  }

  return { synced: true, overridesDropped };
}

/**
 * Reset an instance to its master — board 160:2's "Reset to master".
 *
 * Drops what was changed on THIS instance and rebuilds it from the component,
 * which is the opposite of sync: sync keeps the instance's own edits and takes
 * the master's structure, this takes both from the master.
 *
 * `syncedVersion` is forced back so the rebuild runs even when the instance is
 * already on the master's current version — the common case, since resetting
 * is about local edits, not about being out of date.
 */
export async function resetInstance(
  composer: Composer,
  maps: InstanceMaps,
  elementId: string
): Promise<SyncOutcome> {
  const instance = maps.instances.get(elementId);
  if (!instance || instance.isDetached) return NOT_SYNCED;

  maps.instances.set(elementId, { ...instance, overrides: [], syncedVersion: -1 });
  return syncInstance(composer, maps, elementId);
}

/** What one master update cost, summed over the instances it touched. */
export interface SyncAllOutcome {
  instancesSynced: number;
  overridesDropped: number;
}

/**
 * Sync all instances of a component.
 *
 * The instance list is read up front: syncInstance re-keys the map (the synced
 * instance gets a new element id), so iterating the live map would skip.
 */
export async function syncAllInstances(
  composer: Composer,
  maps: InstanceMaps,
  componentId: string
): Promise<SyncAllOutcome> {
  const instances = getInstancesOfComponent(maps, componentId);
  let instancesSynced = 0;
  let overridesDropped = 0;
  for (const instance of instances) {
    const outcome = await syncInstance(composer, maps, instance.elementId);
    if (outcome.synced) instancesSynced++;
    overridesDropped += outcome.overridesDropped;
  }
  return { instancesSynced, overridesDropped };
}

// ============================================
// Variant Update
// ============================================

/**
 * Update instance variant selection.
 */
export async function updateInstanceVariant(
  composer: Composer,
  maps: InstanceMaps,
  elementId: string,
  variantId: string
): Promise<boolean> {
  const instance = maps.instances.get(elementId);
  if (!instance || instance.isDetached) return false;

  const component = maps.components.get(instance.componentId);
  if (!component) return false;

  const variant = component.variants?.find((v) => v.id === variantId);
  if (!variant) return false;

  composer.beginTransaction?.("variant-change");
  try {
    instance.variantSelection = {
      variantId,
    };

    const element = composer.elements.getElement(elementId);
    if (element) {
      element.setData("componentInstance", instance);
    }

    markInstanceElementsDirty(composer, instance);

    composer.emit(EVENTS.INSTANCE_VARIANT_CHANGED, {
      instanceId: elementId,
      componentId: instance.componentId,
      variantId,
      variantName: variant.name,
    });
    composer.markDirty();
  } finally {
    composer.endTransaction?.();
  }

  return true;
}
