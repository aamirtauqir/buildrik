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
} from "../../shared/types/components";
import type { Composer } from "../Composer";
import type { Patch } from "../utils/JsonPatch";

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

  // ============================================
  // Sync Operations
  // ============================================

  // ============================================
  // Detach Operations
  // ============================================

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
