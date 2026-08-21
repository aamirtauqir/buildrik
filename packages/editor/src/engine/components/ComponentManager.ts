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
  ComponentVariant,
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
  resetInstance,
  detachAllInstances,
  syncInstance,
  syncAllInstances,
  updateInstanceVariant,
} from "./ComponentInstances";

/** What `updateComponentMaster` did — see the method for why it is not a boolean. */
export interface UpdateMasterOutcome {
  updated: boolean;
  instancesSynced: number;
  overridesDropped: number;
}

const FAILED_UPDATE: UpdateMasterOutcome = {
  updated: false,
  instancesSynced: 0,
  overridesDropped: 0,
};
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

    // Repopulate the instance map whenever a project finishes loading — the
    // instance data lives on the elements but the Map is rebuilt empty.
    this.composer.on(EVENTS.PROJECT_LOADED, (data: unknown) => {
      const isProjectData =
        data != null &&
        typeof data === "object" &&
        "pages" in (data as Record<string, unknown>) &&
        !("importing" in (data as Record<string, unknown>)) &&
        !("loading" in (data as Record<string, unknown>));
      if (isProjectData) this.rehydrateInstances();
    });
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

  /**
   * Rebuild the in-memory instance map from element data after a project loads.
   * Instances are persisted on `element.data.data.componentInstance` (round-trips
   * through export/import), but the Map is reconstructed empty — without this,
   * instance counts, detach, sync, variant resolution, and override application
   * all silently stop working after a reload.
   */
  rehydrateInstances(): void {
    this.instances.clear();
    for (const el of this.composer.elements.getAllElements()) {
      const instance = el.getData().data?.componentInstance as
        | ComponentInstance
        | undefined;
      if (instance && instance.componentId && !instance.isDetached) {
        // Re-key on the live element id (ids are stable across import, but be
        // defensive) and keep the persisted overrides/variant selection.
        this.instances.set(el.getId(), { ...instance, elementId: el.getId() });
      }
    }
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
      /** Spec §6.3 / D7: persist user's "Pre-fill from DS styles" choice. */
      prefillFromDs?: boolean;
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
      prefillFromDs: options?.prefillFromDs,
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

  /**
   * Promote an element's tree to be the component's master, then fan it out.
   *
   * Returns what it cost, not just whether it ran: an instance override whose
   * target element no longer exists in the new master cannot be re-applied and
   * is lost. That number used to reach only `devError` — a no-op in production
   * — so a user watched their instance customisation vanish with no word from
   * the app. The caller is expected to say so.
   */
  async updateComponentMaster(
    id: string,
    elementId: string,
  ): Promise<UpdateMasterOutcome> {
    const component = this.components.get(id);
    if (!component) return FAILED_UPDATE;

    const element = this.composer.elements.getElement(elementId);
    if (!element) return FAILED_UPDATE;

    const newMasterTree = element.toJSON();
    if (!newMasterTree) return FAILED_UPDATE;

    const promoted = deepClone(newMasterTree);
    // The element being promoted may itself be an instance — pushing an
    // instance's edits up is a legitimate way to reach here — and its subtree
    // still carries instance bookkeeping that toJSON copies verbatim.
    this.instanceUtils.clearInstanceMarkers(promoted);
    component.masterTree = promoted;
    component.version++;
    component.updatedAt = Date.now();

    await saveComponent(component, this.projectId);

    this.composer.emit(EVENTS.COMPONENT_UPDATED, {
      component,
      changedFields: ["masterTree", "version"],
    });

    if (!this.config.autoSyncInstances) {
      return { updated: true, instancesSynced: 0, overridesDropped: 0 };
    }

    const { instancesSynced, overridesDropped } = await syncAllInstances(
      this.composer,
      this.maps,
      id,
    );
    return { updated: true, instancesSynced, overridesDropped };
  }

  // ============================================
  // C2: Variant authoring (master-level CRUD)
  // ============================================
  // The engine already resolves variant styles at render (ComponentVariantResolver)
  // and lets an instance SELECT a variant (updateInstanceVariant). C2 adds the
  // missing half: authoring the variants + variant-properties ON the master.
  // All persist via saveComponent and emit COMPONENT_UPDATED so open UIs refresh.

  private async persistComponentEdit(
    component: ComponentDefinition,
    changedFields: string[],
  ): Promise<void> {
    component.updatedAt = Date.now();
    await saveComponent(component, this.projectId);
    this.composer.emit(EVENTS.COMPONENT_UPDATED, { component, changedFields });
    this.composer.emit(EVENTS.COMPONENT_LIST_UPDATED, { components: this.getAllComponents() });
  }

  /** Define the variant axes (e.g. Size: [S,M,L], State: [Default,Hover]). */
  async setVariantProperties(componentId: string, properties: VariantProperty[]): Promise<boolean> {
    const component = this.components.get(componentId);
    if (!component) return false;
    component.variantProperties = properties;
    await this.persistComponentEdit(component, ["variantProperties"]);
    return true;
  }

  /** Add a variant (a property-value combination + its overrides) to a master. */
  async addVariant(componentId: string, variant: ComponentVariant): Promise<boolean> {
    const component = this.components.get(componentId);
    if (!component) return false;
    const variants = component.variants ?? [];
    if (variants.some((v) => v.id === variant.id)) return false; // dup id
    component.variants = [...variants, variant];
    await this.persistComponentEdit(component, ["variants"]);
    return true;
  }

  /** Patch an existing variant in place (name, propertyValues, overrides, ...). */
  async updateVariant(
    componentId: string,
    variantId: string,
    patch: Partial<Omit<ComponentVariant, "id">>,
  ): Promise<boolean> {
    const component = this.components.get(componentId);
    if (!component?.variants) return false;
    const idx = component.variants.findIndex((v) => v.id === variantId);
    if (idx === -1) return false;
    component.variants[idx] = { ...component.variants[idx], ...patch, id: variantId };
    await this.persistComponentEdit(component, ["variants"]);
    return true;
  }

  /** Remove a variant. Returns false if the master or variant is absent. */
  async removeVariant(componentId: string, variantId: string): Promise<boolean> {
    const component = this.components.get(componentId);
    if (!component?.variants) return false;
    const next = component.variants.filter((v) => v.id !== variantId);
    if (next.length === component.variants.length) return false; // nothing removed
    component.variants = next;
    await this.persistComponentEdit(component, ["variants"]);
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

  /** Board 160:2 — throw away this instance's own edits and take the master. */
  async resetInstance(elementId: string): Promise<boolean> {
    return (await resetInstance(this.composer, this.maps, elementId)).synced;
  }

  /** Dropped overrides are a whole-component concern — see updateComponentMaster. */
  async syncInstance(elementId: string): Promise<boolean> {
    return (await syncInstance(this.composer, this.maps, elementId)).synced;
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
