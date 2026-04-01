/**
 * Component Instance Manager
 * Manages override tracking and syncing for component instances
 *
 * @module engine/components/ComponentInstance
 * @license BSD-3-Clause
 */

import { EVENTS } from "../../shared/constants";
import type { ElementData } from "../../shared/types";
import type {
  ComponentInstance,
  Override,
  OverrideType,
  SyncResult,
} from "../../shared/types/components";
import { deepClone } from "../../shared/utils/helpers";
import type { Composer } from "../Composer";
import { createPatch, applyPatch, type Patch } from "../utils/JsonPatch";

// ============================================
// Override Path Helpers
// ============================================

/**
 * Parse a path to extract element ID and property info
 */
function parsePath(path: string): {
  elementId: string;
  type: OverrideType;
  property: string;
} | null {
  const match = path.match(/^\/elements\/([^/]+)\/(content|styles|attributes|traits)(?:\/(.+))?$/);
  if (!match) return null;

  const [, elementId, category, property] = match;
  const typeMap: Record<string, OverrideType> = {
    content: "content",
    styles: "style",
    attributes: "attribute",
    traits: "trait",
  };

  return {
    elementId,
    type: typeMap[category] ?? "style",
    property: property ?? "",
  };
}

// ============================================
// Component Instance Utilities
// ============================================

/**
 * Utility class for managing component instance overrides
 */
export class ComponentInstanceUtils {
  private composer: Composer;

  constructor(composer: Composer) {
    this.composer = composer;
  }

  /**
   * Create a JSON pointer path for an element property
   */
  getPropertyPath(elementId: string, type: OverrideType, property: string): string {
    switch (type) {
      case "content":
        return `/elements/${elementId}/content`;
      case "style":
        return `/elements/${elementId}/styles/${property}`;
      case "attribute":
        return `/elements/${elementId}/attributes/${property}`;
      case "trait":
        return `/elements/${elementId}/traits/${property}`;
      default:
        return `/elements/${elementId}/${property}`;
    }
  }

  // ============================================
  // Override Operations
  // ============================================

  /**
   * Apply an override to an instance
   */
  applyOverride(
    instance: ComponentInstance,
    path: string,
    type: OverrideType,
    value: unknown
  ): ComponentInstance {
    // Add or update the override in the patch
    const newOverrides = this.updateOverrideInPatch(instance.overrides, path, value);

    const updatedInstance: ComponentInstance = {
      ...instance,
      overrides: newOverrides,
    };

    this.composer.emit(EVENTS.INSTANCE_OVERRIDE, {
      instanceId: instance.elementId,
      path,
      type,
      value,
    });

    return updatedInstance;
  }

  /**
   * Remove an override from an instance
   */
  removeOverride(instance: ComponentInstance, path: string): ComponentInstance {
    // Filter out operations for this path
    const newOverrides = instance.overrides.filter((op) => op.path !== path);

    return {
      ...instance,
      overrides: newOverrides,
    };
  }

  /**
   * Get all overrides for an instance
   */
  getOverrides(instance: ComponentInstance): Override[] {
    return instance.overrides.map((op) => {
      const parsed = parsePath(op.path);
      return {
        path: op.path,
        type: parsed?.type ?? "style",
        value: op.value,
        createdAt: Date.now(),
      };
    });
  }

  /**
   * Check if a property is overridden
   */
  isPropertyOverridden(
    instance: ComponentInstance,
    elementId: string,
    type: OverrideType,
    property: string
  ): boolean {
    const path = this.getPropertyPath(elementId, type, property);
    return instance.overrides.some((op) => op.path === path);
  }

  /**
   * Reset a specific override (restore to master value)
   */
  resetOverride(
    instance: ComponentInstance,
    elementId: string,
    type: OverrideType,
    property: string
  ): ComponentInstance {
    const path = this.getPropertyPath(elementId, type, property);
    return this.removeOverride(instance, path);
  }

  /**
   * Reset all overrides for an element
   */
  resetElementOverrides(instance: ComponentInstance, elementId: string): ComponentInstance {
    const prefix = `/elements/${elementId}/`;
    const newOverrides = instance.overrides.filter((op) => !op.path.startsWith(prefix));

    return {
      ...instance,
      overrides: newOverrides,
    };
  }

  // ============================================
  // Sync Operations
  // ============================================

  /**
   * Sync an instance to a new master version
   * Attempts to preserve overrides
   */
  syncToMaster(
    instance: ComponentInstance,
    oldMaster: ElementData,
    newMaster: ElementData
  ): SyncResult {
    const errors: string[] = [];
    let overridesPreserved = 0;
    let overridesConflicted = 0;

    // Create patch from old master to new master
    const masterPatch = createPatch(oldMaster, newMaster);

    // Check for conflicts with existing overrides
    const conflictingPaths = new Set<string>();

    for (const masterOp of masterPatch) {
      for (const instanceOp of instance.overrides) {
        if (this.pathsOverlap(masterOp.path, instanceOp.path)) {
          conflictingPaths.add(instanceOp.path);
        }
      }
    }

    // Count preserved vs conflicted
    for (const op of instance.overrides) {
      if (conflictingPaths.has(op.path)) {
        overridesConflicted++;
        errors.push(`Conflict at ${op.path}`);
      } else {
        overridesPreserved++;
      }
    }

    // Note: In a full implementation, we would filter out conflicting overrides
    // and apply preservedOverrides to the updated instance

    return {
      success: overridesConflicted === 0,
      instanceId: instance.elementId,
      overridesPreserved,
      overridesConflicted,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Build the final element tree by applying overrides to master
   */
  buildInstanceTree(masterTree: ElementData, instance: ComponentInstance): ElementData {
    if (instance.overrides.length === 0) {
      return deepClone(masterTree);
    }

    // Apply the overrides patch to the master tree
    return applyPatch(masterTree, instance.overrides);
  }

  // ============================================
  // Detach Operations
  // ============================================

  /**
   * Convert an instance to a regular element tree
   * Returns the element data with all overrides applied
   */
  detachToElements(masterTree: ElementData, instance: ComponentInstance): ElementData {
    // Apply all overrides to get final tree
    const detachedTree = this.buildInstanceTree(masterTree, instance);

    // Clear component instance markers recursively
    this.clearInstanceMarkers(detachedTree);

    return detachedTree;
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Update or add an override in the patch
   */
  private updateOverrideInPatch(patch: Patch, path: string, value: unknown): Patch {
    const newPatch = patch.filter((op) => op.path !== path);
    newPatch.push({
      op: "replace",
      path,
      value,
    });
    return newPatch;
  }

  /**
   * Check if two paths overlap (one is parent of the other)
   */
  private pathsOverlap(path1: string, path2: string): boolean {
    return path1.startsWith(path2) || path2.startsWith(path1);
  }

  /**
   * Clear component instance markers from element data
   */
  private clearInstanceMarkers(data: ElementData): void {
    if (data.data) {
      delete (data.data as Record<string, unknown>).componentInstance;
    }
    data.children?.forEach((child) => this.clearInstanceMarkers(child));
  }
}

// ============================================
// Factory Function
// ============================================

/**
 * Create a new component instance record
 */
export function createComponentInstance(
  elementId: string,
  componentId: string,
  version: number
): ComponentInstance {
  return {
    elementId,
    componentId,
    overrides: [],
    syncedVersion: version,
    isDetached: false,
  };
}

/**
 * Create an override operation
 */
export function createOverride(
  elementId: string,
  type: OverrideType,
  property: string,
  value: unknown
): Override {
  // Use a temporary instance of utils or just replicate logic for the factory
  // Replicating logic is safer for a standalone factory
  let path = `/elements/${elementId}/${property}`;
  switch (type) {
    case "content":
      path = `/elements/${elementId}/content`;
      break;
    case "style":
      path = `/elements/${elementId}/styles/${property}`;
      break;
    case "attribute":
      path = `/elements/${elementId}/attributes/${property}`;
      break;
    case "trait":
      path = `/elements/${elementId}/traits/${property}`;
      break;
  }

  return {
    path,
    type,
    value,
    createdAt: Date.now(),
  };
}
