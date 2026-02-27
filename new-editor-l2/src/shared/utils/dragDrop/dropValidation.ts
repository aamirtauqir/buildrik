/**
 * Drop Validation Utilities
 * Validates drop targets and provides human-readable feedback
 *
 * @module utils/dragDrop/dropValidation
 * @license BSD-3-Clause
 */

import type { Element } from "../../../engine/elements/Element";
import { THRESHOLDS } from "../../constants";
import type { ElementType } from "../../types";
import { canNestElement, canHaveChildren, isVoidType, isInteractiveType } from "../nesting";

/** Reasons why a drop might be invalid */
export type InvalidDropReason =
  | "VOID_ELEMENT"
  | "TEXT_ELEMENT"
  | "SELF_DROP"
  | "ANCESTOR_DROP"
  | "MAX_DEPTH"
  | "SAME_POSITION"
  | "NESTING_FORBIDDEN"
  | "INTERACTIVE_NESTING"
  | "CANNOT_NEST_IN_TARGET" // GAP-FIX: Block element can't be placed inside target
  | null;

/** Result of drop validation */
export interface DropValidationResult {
  /** Whether the drop is valid */
  isValid: boolean;
  /** Reason for invalidity (null if valid) */
  reason: InvalidDropReason;
  /** Human-readable message */
  message: string | null;
}

/** Text element types that cannot contain children */
const TEXT_ELEMENT_TYPES = new Set<string>(["text", "span", "paragraph", "heading", "label"]);

/**
 * Validate whether a drop operation is allowed
 */
export function validateDrop(
  sourceType: ElementType,
  sourceId: string,
  targetType: ElementType,
  targetId: string,
  dropPosition: "before" | "after" | "inside" | null,
  options: {
    descendantIds?: Set<string>;
    currentParentId?: string;
    currentIndex?: number;
    targetIndex?: number;
    depth?: number;
    ancestorTypes?: ElementType[];
  } = {}
): DropValidationResult {
  const {
    descendantIds = new Set(),
    currentParentId,
    currentIndex,
    targetIndex,
    depth = 0,
    ancestorTypes = [],
  } = options;

  // Check: Self-drop (dropping on itself)
  if (sourceId === targetId) {
    return {
      isValid: false,
      reason: "SELF_DROP",
      message: "Cannot drop element inside itself",
    };
  }

  // Check: Ancestor drop (dropping into own descendant)
  if (descendantIds.has(targetId)) {
    return {
      isValid: false,
      reason: "ANCESTOR_DROP",
      message: "Cannot drop element inside its own child",
    };
  }

  // Determine effective parent type based on drop position
  // For "inside" drops, target is the parent
  // For "before/after" drops, we need to check against target's parent
  const effectiveParentType = dropPosition === "inside" ? targetType : null;

  // Check: Maximum nesting depth
  if (depth >= THRESHOLDS.MAX_NESTING_DEPTH) {
    return {
      isValid: false,
      reason: "MAX_DEPTH",
      message: "Maximum nesting depth reached",
    };
  }

  // For "inside" drops, validate nesting rules
  if (dropPosition === "inside" && effectiveParentType) {
    // Check: Void elements cannot have children
    if (isVoidType(effectiveParentType)) {
      return {
        isValid: false,
        reason: "VOID_ELEMENT",
        message: "This element cannot have children (img, input, br, etc.)",
      };
    }

    // Check: Text elements generally cannot have children
    if (TEXT_ELEMENT_TYPES.has(effectiveParentType) && !canHaveChildren(effectiveParentType)) {
      return {
        isValid: false,
        reason: "TEXT_ELEMENT",
        message: "Text elements cannot contain other elements",
      };
    }

    // Check: Interactive elements cannot nest
    if (isInteractiveType(sourceType) && isInteractiveType(effectiveParentType)) {
      return {
        isValid: false,
        reason: "INTERACTIVE_NESTING",
        message: "Interactive elements cannot be nested inside each other",
      };
    }

    // Check: General nesting rules
    if (!canNestElement(sourceType, effectiveParentType)) {
      return {
        isValid: false,
        reason: "NESTING_FORBIDDEN",
        message: `${sourceType} cannot be placed inside ${effectiveParentType}`,
      };
    }
  }

  // Check: Interactive ancestry (for ALL drop positions including before/after)
  // Prevents dropping button "before" a div that's inside a link
  if (isInteractiveType(sourceType) && ancestorTypes.length > 0) {
    const hasInteractiveAncestor = ancestorTypes.some((type) => isInteractiveType(type));
    if (hasInteractiveAncestor) {
      return {
        isValid: false,
        reason: "INTERACTIVE_NESTING",
        message: "Interactive elements cannot be nested inside interactive elements",
      };
    }
  }

  // Check: Same position (no-op move)
  if (
    currentParentId === targetId &&
    dropPosition === "inside" &&
    currentIndex !== undefined &&
    targetIndex !== undefined &&
    currentIndex === targetIndex
  ) {
    return {
      isValid: false,
      reason: "SAME_POSITION",
      message: "Element is already in this position",
    };
  }

  // All checks passed
  return {
    isValid: true,
    reason: null,
    message: null,
  };
}

/**
 * Validate drop for an Element instance
 */
export function validateElementDrop(
  sourceElement: Element,
  targetElement: Element,
  dropPosition: "before" | "after" | "inside" | null,
  parentElement?: Element | null
): DropValidationResult {
  const sourceType = sourceElement.getType() as ElementType;
  const sourceId = sourceElement.getId();
  const targetType = targetElement.getType() as ElementType;
  const targetId = targetElement.getId();

  // Get descendants for circular check
  const descendants = sourceElement.getDescendants?.() || [];
  const descendantIds = new Set(descendants.map((d: Element) => d.getId()));

  // Get current position info
  const currentParent = sourceElement.getParent?.();
  const currentParentId = currentParent?.getId();
  const siblings = currentParent?.getChildren?.() || [];
  const currentIndex = siblings.findIndex((s: Element) => s.getId() === sourceId);

  // Calculate depth and collect ancestor types for interactive nesting check
  let depth = 0;
  const ancestorTypes: ElementType[] = [];
  let cursor: Element | null = targetElement;

  // For before/after, start from target's parent (since we're not going inside target)
  if (dropPosition !== "inside") {
    cursor = parentElement || null;
  }

  while (cursor) {
    depth++;
    ancestorTypes.push(cursor.getType() as ElementType);
    cursor = cursor.getParent?.() || null;
  }

  // For before/after, we need to validate against the parent
  let effectiveTargetType = targetType;
  if (dropPosition !== "inside" && parentElement) {
    effectiveTargetType = parentElement.getType() as ElementType;
  }

  return validateDrop(sourceType, sourceId, effectiveTargetType, targetId, dropPosition, {
    descendantIds,
    currentParentId,
    currentIndex: currentIndex >= 0 ? currentIndex : undefined,
    depth,
    ancestorTypes,
  });
}

/**
 * Get human-readable message for invalid drop reason
 */
export function getDropReasonMessage(reason: InvalidDropReason): string | null {
  if (!reason) return null;

  const messages: Record<NonNullable<InvalidDropReason>, string> = {
    VOID_ELEMENT: "This element cannot have children (img, input, br, etc.)",
    TEXT_ELEMENT: "Text elements cannot contain other elements",
    SELF_DROP: "Cannot drop element inside itself",
    ANCESTOR_DROP: "Cannot drop element inside its own child",
    MAX_DEPTH: "Maximum nesting depth reached",
    SAME_POSITION: "Element is already in this position",
    NESTING_FORBIDDEN: "This element type is not allowed here",
    INTERACTIVE_NESTING: "Interactive elements cannot be nested inside each other",
    CANNOT_NEST_IN_TARGET: "This element cannot be placed inside the target",
  };

  return messages[reason];
}
