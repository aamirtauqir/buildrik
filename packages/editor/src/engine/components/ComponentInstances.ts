/**
 * Component Instance Management
 * Handles instantiation, override recording, detaching, syncing, and variant updates.
 *
 * @module engine/components/ComponentInstances
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { ElementData } from "../../shared/types";
import type {
  ComponentDefinition,
  ComponentInstance,
  OverrideType,
} from "../../shared/types/components";
import { devError } from "../../shared/utils/devLogger";
import { deepClone } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import { ComponentInstanceUtils } from "./ComponentInstance";
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

  const parent = composer.elements.getElement(parentId);
  if (!parent) return null;

  const clonedData = cloneWithNewIds(component.masterTree);

  const element = composer.elements.pasteElement(clonedData, parent, _index);
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
    parentId,
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
 * Sync an instance to the latest master version.
 */
export async function syncInstance(
  composer: Composer,
  maps: InstanceMaps,
  elementId: string
): Promise<boolean> {
  const instance = maps.instances.get(elementId);
  if (!instance || instance.isDetached) return false;

  const component = maps.components.get(instance.componentId);
  if (!component) return false;

  if (instance.syncedVersion >= component.version) {
    return true;
  }

  const previousVersion = instance.syncedVersion;

  const element = composer.elements.getElement(elementId);
  if (!element) return false;

  const parent = element.getParent();
  if (!parent) return false;

  composer.beginTransaction?.("instance-sync");
  try {
    const index = parent.getChildIndex(element);

    parent.removeChild(element);

    const clonedData = cloneWithNewIds(component.masterTree);
    const newElement = composer.elements.pasteElement(clonedData, parent, index);
    if (!newElement) throw new Error("Failed to re-instantiate during sync");

    const newInstance: ComponentInstance = {
      ...instance,
      elementId: newElement.getId(),
      syncedVersion: component.version,
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
    });

    composer.markDirty();
  } catch (err) {
    devError("ComponentManager", "Sync failed", err);
    return false;
  } finally {
    composer.endTransaction?.();
  }

  return true;
}

/**
 * Sync all instances of a component.
 */
export async function syncAllInstances(
  composer: Composer,
  maps: InstanceMaps,
  componentId: string
): Promise<void> {
  const instances = getInstancesOfComponent(maps, componentId);
  for (const instance of instances) {
    await syncInstance(composer, maps, instance.elementId);
  }
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
