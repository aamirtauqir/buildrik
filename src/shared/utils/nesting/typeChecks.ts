/**
 * Type Checking Functions
 * Functions to check element type categories
 *
 * @module utils/nesting/typeChecks
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import {
  ELEMENT_CATEGORIES,
  ELEMENT_TYPES,
  CAN_HAVE_CHILDREN_SET,
  LANDMARK_ELEMENTS,
  INTERACTIVE_ELEMENTS,
} from "./derived";
import { ELEMENT_RULES } from "./rules";
import { ElementCategory, LandmarkRole } from "./types";

/**
 * Check if element type is interactive (button, link)
 */
export function isInteractiveType(type: ElementType): boolean {
  return INTERACTIVE_ELEMENTS.has(type);
}

/**
 * Check if element type is a void/self-closing element
 */
export function isVoidType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.VOID) ?? false;
}

/**
 * Check if element type is a container type
 */
export function isContainerType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.CONTAINER) ?? false;
}

/**
 * Check if element type is a block-level element
 */
export function isBlockType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.BLOCK) ?? false;
}

/**
 * Check if element type is an inline element
 */
export function isInlineType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.INLINE) ?? false;
}

/**
 * Check if element type is a landmark
 */
export function isLandmarkType(type: ElementType): boolean {
  return LANDMARK_ELEMENTS.has(type);
}

/**
 * Check if element type is a heading
 */
export function isHeadingType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.HEADING) ?? false;
}

/**
 * Check if element type is a section
 */
export function isSectionType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.SECTION) ?? false;
}

/**
 * Check if element type is a form element
 */
export function isFormType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.FORM) ?? false;
}

/**
 * Check if element type is a media element
 */
export function isMediaType(type: ElementType): boolean {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.includes(ElementCategory.MEDIA) ?? false;
}

/**
 * Get element's primary category (first in list)
 */
export function getPrimaryCategory(type: ElementType): ElementCategory | null {
  const categories = ELEMENT_CATEGORIES[type];
  return categories?.[0] ?? null;
}

/**
 * Get all element types in a specific category
 */
export function getElementsByCategory(category: ElementCategory): ElementType[] {
  return ELEMENT_TYPES.filter((type) => ELEMENT_CATEGORIES[type]?.includes(category));
}

/**
 * Get element's implicit ARIA role
 */
export function getImplicitRole(type: ElementType): string | undefined {
  return ELEMENT_RULES[type]?.implicitRole;
}

/**
 * Get element's landmark role
 */
export function getLandmarkRole(type: ElementType): LandmarkRole | undefined {
  return ELEMENT_RULES[type]?.landmarkRole;
}

/**
 * Get heading level from element
 */
export function getHeadingLevel(element: { type: ElementType; level?: number }): number {
  if (element.type === "heading") {
    return element.level || 2;
  }
  return 0;
}

/**
 * Check if element can have any children
 * O(1) lookup using Set
 */
export function canHaveChildren(elementType: ElementType): boolean {
  return CAN_HAVE_CHILDREN_SET.has(elementType);
}
