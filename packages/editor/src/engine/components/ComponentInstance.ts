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
import { createPatch, type Patch } from "../utils/JsonPatch";

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
// Canonical Override Application (position-path scheme)
// ============================================
//
// Overrides are stored by the canonical POSITION-PATH scheme written by
// recordInstanceOverride (ComponentInstances.ts) and read by
// getOverridesForElement (ComponentVariantResolver.ts):
//
//   #/<elementPath>/<type>/<property>
//   elementPath = "" (root) | "children[0].children[1]" (dot-joined indices)
//   type        = style | content | attribute | trait
//
// Position-based addressing survives a master re-clone (new element IDs) as
// long as the master structure is unchanged — which is the F1a target case
// (master edited without reorder/insert). Reorder/insert survival is F1b
// (stable slotKey) and out of scope here.

/** Parse a canonical `#/<elementPath>/<type>/<property>` override path. */
function parseCanonicalOverridePath(
  path: string
): { elementPath: string; type: OverrideType; property: string } | null {
  if (!path.startsWith("#/")) return null;
  const parts = path.slice(2).split("/");
  if (parts.length < 2) return null;
  const property = parts.pop() as string;
  const typeToken = parts.pop() as string;
  if (
    typeToken !== "style" &&
    typeToken !== "content" &&
    typeToken !== "attribute" &&
    typeToken !== "trait"
  ) {
    return null;
  }
  return { elementPath: parts.join("/"), type: typeToken, property };
}

/** Walk a tree by an elementPath ("children[0].children[1]") to the target node. */
function resolveNodeByElementPath(tree: ElementData, elementPath: string): ElementData | null {
  if (!elementPath) return tree;
  let node: ElementData = tree;
  for (const seg of elementPath.split(".")) {
    const m = seg.match(/^children\[(\d+)\]$/);
    if (!m) return null;
    const child = node.children?.[Number(m[1])];
    if (!child) return null;
    node = child;
  }
  return node;
}

/** Write one override value into the correct bucket of an ElementData node. */
function applyOverrideToNode(
  node: ElementData,
  type: OverrideType,
  property: string,
  value: unknown
): void {
  switch (type) {
    case "style":
      node.styles = { ...(node.styles ?? {}), [property]: value as string };
      break;
    case "content":
      node.content = value as string;
      break;
    case "attribute":
      node.attributes = { ...(node.attributes ?? {}), [property]: value as string };
      break;
    case "trait": {
      const trait = node.traits?.find((t) => t.name === property);
      if (trait) trait.value = value as typeof trait.value;
      break;
    }
  }
}

/**
 * Re-apply an instance's stored overrides onto a (freshly cloned) element tree,
 * in place. Returns how many applied vs. dropped (orphaned — the master element
 * the override targeted no longer exists at that position). Dropping is surfaced,
 * never silent (F1a #2). This is the SSOT override-application path used by both
 * sync (re-clone) and detach.
 */
export function applyOverridesToTree(
  tree: ElementData,
  overrides: Patch
): { applied: number; dropped: number; kept: Patch } {
  let applied = 0;
  let dropped = 0;
  /* `kept` exists so a caller can STORE the survivors. An override whose target
     is gone can never apply again, and leaving it on the instance means every
     later master update re-reports the same lost edit — a warning that cries
     wolf is worse than the silence it replaced. */
  const kept: Patch = [];
  for (const op of overrides) {
    const parsed = parseCanonicalOverridePath(op.path);
    if (!parsed) {
      dropped++;
      continue;
    }
    const node = resolveNodeByElementPath(tree, parsed.elementPath);
    if (!node) {
      dropped++;
      continue;
    }
    applyOverrideToNode(node, parsed.type, parsed.property, (op as { value?: unknown }).value);
    applied++;
    kept.push(op);
  }
  return { applied, dropped, kept };
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
    const tree = deepClone(masterTree);
    if (instance.overrides.length === 0) {
      return tree;
    }
    // Apply overrides via the canonical position-path scheme the overrides are
    // actually stored in (`#/<elementPath>/<type>/<property>`). The previous
    // applyPatch() path treated them as JSON-Patch pointers (`/children/...`),
    // which never matched — detach silently dropped every override (F1a #1/C).
    applyOverridesToTree(tree, instance.overrides);
    return tree;
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
   * Clear component instance markers from element data.
   *
   * Public because promoting an element to master needs the same scrub: an
   * element that is itself an instance carries `data.data.componentInstance`,
   * and toJSON copies it, so without this every future clone of the master
   * would be born wearing another instance's bookkeeping.
   */
  clearInstanceMarkers(data: ElementData): void {
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
