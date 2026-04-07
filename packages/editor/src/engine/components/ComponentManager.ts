/**
 * Component Manager
 * Thin facade over ComponentInstances and ComponentVariantResolver.
 * Handles component registry, storage, and CRUD; delegates all instance
 * and variant logic to dedicated specialist modules.
 *
 * Instance management logic → ComponentInstances.ts
 * Variant/override resolution → ComponentVariantResolver.ts
 *
 * @module engine/components/ComponentManager
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type {
  ComponentDefinition,
  ComponentInstance,
  ComponentManagerConfig,
  VariantProperty,
  OverrideType,
} from "../../shared/types/components";
import { deepClone } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import { ComponentInstanceUtils } from "./ComponentInstance";
import {
  type InstanceMaps,
  instantiateComponent,
  recordInstanceOverride,
  getInstancesOfComponent,
  detachInstance,
  detachAllInstances,
  syncInstance,
  syncAllInstances,
  updateInstanceVariant,
} from "./ComponentInstances";
import {
  saveComponent,
  loadComponents,
  deleteComponent as deleteFromStorage,
  isStorageAvailable,
  exportComponents as exportFromStorage,
  importComponents as importToStorage,
  downloadComponentsFile,
  type ComponentExport,
} from "./ComponentStorage";
import {
  findInstanceContainingElement,
  getVariantStylesForElement,
  getOverridesForElement,
} from "./ComponentVariantResolver";

// ─── Helper ──────────────────────────────────────────────────────────────────

function generateComponentId(): string {
  return `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Component Manager ───────────────────────────────────────────────────────

/**
 * Manages the component registry and delegates instance/variant operations.
 */
export class ComponentManager {
  private composer: Composer;
  private config: ComponentManagerConfig;
  private components: Map<string, ComponentDefinition> = new Map();
  private instances: Map<string, ComponentInstance> = new Map();
  private projectId: string = "default";
  private instanceUtils: ComponentInstanceUtils;

  constructor(composer: Composer, config?: Partial<ComponentManagerConfig>) {
    this.composer = composer;
    this.instanceUtils = new ComponentInstanceUtils(composer);
    this.config = {
      maxComponents: config?.maxComponents ?? 100,
      autoSyncInstances: config?.autoSyncInstances ?? true,
      enabled: config?.enabled ?? true,
    };

    if (isStorageAvailable() && this.config.enabled) {
      this.initialize();
    }
  }

  /** Shared InstanceMaps reference for specialist modules. */
  private get maps(): InstanceMaps {
    return { components: this.components, instances: this.instances };
  }

  // ─── Initialization ─────────────────────────────────────────────────────────

  private async initialize(): Promise<void> {
    await this.loadComponentsFromStorage();
  }

  private async loadComponentsFromStorage(): Promise<void> {
    const componentList = await loadComponents(this.projectId);

    this.components.clear();
    componentList.forEach((comp) => {
      this.components.set(comp.id, comp);
    });

    this.composer.emit(EVENTS.COMPONENT_LIST_UPDATED, {
      components: this.getAllComponents(),
    });
  }

  // ─── Component CRUD ──────────────────────────────────────────────────────────

  async createComponent(
    name: string,
    elementId: string,
    options?: {
      description?: string;
      category?: string;
      tags?: string[];
      variantProperties?: VariantProperty[];
    }
  ): Promise<ComponentDefinition | null> {
    const element = this.composer.elements.getElement(elementId);
    if (!element) return null;

    const masterTree = element.toJSON();
    if (!masterTree) return null;

    const now = Date.now();
    const component: ComponentDefinition = {
      id: generateComponentId(),
      name,
      description: options?.description,
      category: options?.category,
      tags: options?.tags,
      masterTree: deepClone(masterTree),
      createdAt: now,
      updatedAt: now,
      version: 1,
      variantProperties: options?.variantProperties,
    };

    await saveComponent(component, this.projectId);
    this.components.set(component.id, component);

    this.composer.emit(EVENTS.COMPONENT_CREATED, { component, sourceElementId: elementId });
    this.composer.emit(EVENTS.COMPONENT_LIST_UPDATED, { components: this.getAllComponents() });

    return component;
  }

  getComponent(id: string): ComponentDefinition | undefined {
    return this.components.get(id);
  }

  getAllComponents(): ComponentDefinition[] {
    return Array.from(this.components.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  getComponentsByCategory(category: string): ComponentDefinition[] {
    return this.getAllComponents().filter((c) => c.category === category);
  }

  async updateComponentMetadata(
    id: string,
    updates: Partial<Pick<ComponentDefinition, "name" | "description" | "category" | "tags">>
  ): Promise<boolean> {
    const component = this.components.get(id);
    if (!component) return false;

    Object.assign(component, updates);
    component.updatedAt = Date.now();

    await saveComponent(component, this.projectId);

    this.composer.emit(EVENTS.COMPONENT_UPDATED, {
      component,
      changedFields: Object.keys(updates),
    });
    this.composer.emit(EVENTS.COMPONENT_LIST_UPDATED, { components: this.getAllComponents() });

    return true;
  }

  /** Alias for updateComponentMetadata for simpler API. */
  async updateComponent(
    id: string,
    updates: Partial<Pick<ComponentDefinition, "name" | "description" | "category" | "tags">>
  ): Promise<boolean> {
    return this.updateComponentMetadata(id, updates);
  }

  async updateComponentMaster(id: string, elementId: string): Promise<boolean> {
    const component = this.components.get(id);
    if (!component) return false;

    const element = this.composer.elements.getElement(elementId);
    if (!element) return false;

    const newMasterTree = element.toJSON();
    if (!newMasterTree) return false;

    component.masterTree = deepClone(newMasterTree);
    component.version++;
    component.updatedAt = Date.now();

    await saveComponent(component, this.projectId);

    this.composer.emit(EVENTS.COMPONENT_UPDATED, {
      component,
      changedFields: ["masterTree", "version"],
    });

    if (this.config.autoSyncInstances) {
      await syncAllInstances(this.composer, this.maps, id);
    }

    return true;
  }

  async duplicateComponent(id: string): Promise<ComponentDefinition | null> {
    const original = this.components.get(id);
    if (!original) return null;

    const now = Date.now();
    const duplicate: ComponentDefinition = {
      id: generateComponentId(),
      name: `${original.name} Copy`,
      description: original.description,
      category: original.category,
      tags: original.tags ? [...original.tags] : undefined,
      masterTree: deepClone(original.masterTree),
      thumbnail: original.thumbnail,
      createdAt: now,
      updatedAt: now,
      version: 1,
      variantProperties: original.variantProperties
        ? deepClone(original.variantProperties)
        : undefined,
    };

    await saveComponent(duplicate, this.projectId);
    this.components.set(duplicate.id, duplicate);

    this.composer.emit(EVENTS.COMPONENT_CREATED, {
      component: duplicate,
      sourceComponentId: id,
    });
    this.composer.emit(EVENTS.COMPONENT_LIST_UPDATED, { components: this.getAllComponents() });

    return duplicate;
  }

  async deleteComponent(id: string): Promise<boolean> {
    const component = this.components.get(id);
    if (!component) return false;

    const instanceCount = await detachAllInstances(this.composer, this.maps, id);

    await deleteFromStorage(id);
    this.components.delete(id);

    this.composer.emit(EVENTS.COMPONENT_DELETED, {
      componentId: id,
      componentName: component.name,
      instanceCount,
    });
    this.composer.emit(EVENTS.COMPONENT_LIST_UPDATED, { components: this.getAllComponents() });

    return true;
  }

  // ─── Instance Management (delegated to ComponentInstances.ts) ────────────────

  async instantiateComponent(
    componentId: string,
    parentId: string,
    _index?: number
  ): Promise<string | null> {
    return instantiateComponent(this.composer, this.maps, componentId, parentId, _index);
  }

  recordInstanceOverride(
    elementId: string,
    type: OverrideType,
    property: string,
    value: unknown
  ): void {
    recordInstanceOverride(
      this.composer,
      this.maps,
      this.instanceUtils,
      elementId,
      type,
      property,
      value
    );
  }

  getInstance(elementId: string): ComponentInstance | undefined {
    return this.instances.get(elementId);
  }

  /** Alias for getInstance for clearer API. */
  getInstanceByElementId(elementId: string): ComponentInstance | undefined {
    return this.instances.get(elementId);
  }

  isInstance(elementId: string): boolean {
    return this.instances.has(elementId);
  }

  getInstancesOfComponent(componentId: string): ComponentInstance[] {
    return getInstancesOfComponent(this.maps, componentId);
  }

  async detachInstance(elementId: string): Promise<boolean> {
    return detachInstance(this.composer, this.maps, elementId);
  }

  async syncInstance(elementId: string): Promise<boolean> {
    return syncInstance(this.composer, this.maps, elementId);
  }

  async updateInstanceVariant(elementId: string, variantId: string): Promise<boolean> {
    return updateInstanceVariant(this.composer, this.maps, elementId, variantId);
  }

  findInstanceContainingElement(elementId: string): ComponentInstance | null {
    return findInstanceContainingElement(this.composer, this.maps.instances, elementId);
  }

  // ─── Variant Style Resolution (delegated to ComponentVariantResolver.ts) ────

  getVariantStylesForElement(elementId: string): Record<string, string> | null {
    return getVariantStylesForElement(
      this.composer,
      this.maps.components,
      this.maps.instances,
      elementId
    );
  }

  getOverridesForElement(elementId: string): Record<string, string> {
    return getOverridesForElement(
      this.composer,
      this.maps.components,
      this.maps.instances,
      elementId
    );
  }

  // ─── Export / Import ─────────────────────────────────────────────────────────

  async exportComponents(download: boolean = true): Promise<ComponentExport> {
    const data = await exportFromStorage(this.projectId);
    if (download) {
      downloadComponentsFile(data);
    }
    return data;
  }

  async importComponents(file: File, clearExisting: boolean = false): Promise<number> {
    const text = await file.text();
    const data = JSON.parse(text) as ComponentExport;
    const count = await importToStorage(data, clearExisting);
    await this.loadComponentsFromStorage();
    return count;
  }

  // ─── Configuration ───────────────────────────────────────────────────────────

  async setProjectId(projectId: string): Promise<void> {
    this.projectId = projectId;
    await this.loadComponentsFromStorage();
  }

  isAvailable(): boolean {
    return isStorageAvailable() && this.config.enabled;
  }

  // ─── Lifecycle ───────────────────────────────────────────────────────────────

  destroy(): void {
    this.components.clear();
    this.instances.clear();
  }
}
