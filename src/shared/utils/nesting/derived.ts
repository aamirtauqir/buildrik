/**
 * Derived Constants
 * Pre-computed values for O(1) lookups
 *
 * @module utils/nesting/derived
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";
import { ELEMENT_RULES } from "./rules";
import { ElementCategory } from "./types";

// =============================================================================
// DERIVED CONSTANTS (Pre-computed for O(1) lookups)
// =============================================================================

export const ELEMENT_TYPES = Object.keys(ELEMENT_RULES) as ElementType[];

/** Map element types to their categories */
export const ELEMENT_CATEGORIES: Record<ElementType, ElementCategory[]> = Object.fromEntries(
  ELEMENT_TYPES.map((type) => [type, ELEMENT_RULES[type].categories])
) as Record<ElementType, ElementCategory[]>;

/** Set of elements that can have children (O(1) lookup) */
export const CAN_HAVE_CHILDREN_SET = new Set<ElementType>(
  ELEMENT_TYPES.filter((type) => {
    const rule = ELEMENT_RULES[type];
    if (rule.allowChildren !== undefined) return rule.allowChildren;
    return !rule.categories.includes(ElementCategory.VOID);
  })
);

/** Array of elements that can have children */
export const CAN_HAVE_CHILDREN = Array.from(CAN_HAVE_CHILDREN_SET);

/** Forbidden nesting pairs */
export const FORBIDDEN_NESTING: Record<ElementType, ElementType[]> = Object.fromEntries(
  ELEMENT_TYPES.map((type) => [type, ELEMENT_RULES[type].forbiddenChildren ?? []])
) as Record<ElementType, ElementType[]>;

/** Allowed children (if restricted) */
export const ALLOWED_CHILDREN: Record<ElementType, ElementType[] | undefined> = Object.fromEntries(
  ELEMENT_TYPES.map((type) => [type, ELEMENT_RULES[type].allowedChildren])
) as Record<ElementType, ElementType[] | undefined>;

/** Category nesting rules */
export const NESTING_RULES: Record<ElementCategory, ElementCategory[]> = {
  [ElementCategory.CONTAINER]: [
    ElementCategory.CONTAINER,
    ElementCategory.BLOCK,
    ElementCategory.INLINE,
    ElementCategory.INTERACTIVE,
    ElementCategory.FORM,
    ElementCategory.MEDIA,
    ElementCategory.SECTION,
    ElementCategory.TEXT,
    ElementCategory.VOID,
    ElementCategory.FLOW,
    ElementCategory.PHRASING,
    ElementCategory.EMBEDDED,
    ElementCategory.HEADING,
    ElementCategory.SECTIONING,
    ElementCategory.LANDMARK,
    ElementCategory.NAVIGATION,
    ElementCategory.STRUCTURAL,
  ],
  [ElementCategory.SECTION]: [
    ElementCategory.CONTAINER,
    ElementCategory.BLOCK,
    ElementCategory.INLINE,
    ElementCategory.INTERACTIVE,
    ElementCategory.FORM,
    ElementCategory.MEDIA,
    ElementCategory.TEXT,
    ElementCategory.VOID,
    ElementCategory.FLOW,
    ElementCategory.PHRASING,
    ElementCategory.HEADING,
  ],
  [ElementCategory.BLOCK]: [
    ElementCategory.INLINE,
    ElementCategory.TEXT,
    ElementCategory.INTERACTIVE,
    ElementCategory.MEDIA,
    ElementCategory.VOID,
    ElementCategory.PHRASING,
  ],
  [ElementCategory.INLINE]: [
    ElementCategory.INLINE,
    ElementCategory.TEXT,
    ElementCategory.VOID,
    ElementCategory.PHRASING,
  ],
  [ElementCategory.INTERACTIVE]: [
    ElementCategory.TEXT,
    ElementCategory.INLINE,
    ElementCategory.MEDIA,
    ElementCategory.VOID,
    ElementCategory.PHRASING,
  ],
  [ElementCategory.FORM]: [
    ElementCategory.INLINE,
    ElementCategory.TEXT,
    ElementCategory.INTERACTIVE,
    ElementCategory.VOID,
    ElementCategory.BLOCK,
    ElementCategory.FLOW,
    ElementCategory.PHRASING,
  ],
  [ElementCategory.MEDIA]: [],
  [ElementCategory.TEXT]: [
    ElementCategory.INLINE,
    ElementCategory.TEXT,
    ElementCategory.VOID,
    ElementCategory.PHRASING,
  ],
  [ElementCategory.VOID]: [],
  [ElementCategory.FLOW]: [
    ElementCategory.FLOW,
    ElementCategory.PHRASING,
    ElementCategory.EMBEDDED,
    ElementCategory.INTERACTIVE,
    ElementCategory.HEADING,
    ElementCategory.SECTIONING,
  ],
  [ElementCategory.PHRASING]: [ElementCategory.PHRASING, ElementCategory.EMBEDDED],
  [ElementCategory.EMBEDDED]: [],
  [ElementCategory.HEADING]: [ElementCategory.PHRASING, ElementCategory.TEXT],
  [ElementCategory.SECTIONING]: [
    ElementCategory.FLOW,
    ElementCategory.HEADING,
    ElementCategory.SECTIONING,
  ],
  [ElementCategory.METADATA]: [],
  [ElementCategory.TRANSPARENT]: [ElementCategory.FLOW, ElementCategory.PHRASING],
  [ElementCategory.LANDMARK]: [ElementCategory.FLOW, ElementCategory.BLOCK, ElementCategory.INLINE],
  [ElementCategory.NAVIGATION]: [
    ElementCategory.FLOW,
    ElementCategory.INTERACTIVE,
    ElementCategory.TEXT,
  ],
  [ElementCategory.STRUCTURAL]: [ElementCategory.FLOW, ElementCategory.BLOCK],
};

// Pre-computed Sets for O(1) lookup
export const FORBIDDEN_NESTING_SET: Record<ElementType, Set<ElementType>> = Object.fromEntries(
  ELEMENT_TYPES.map((type) => [type, new Set(FORBIDDEN_NESTING[type])])
) as Record<ElementType, Set<ElementType>>;

export const ALLOWED_CHILDREN_SET: Record<ElementType, Set<ElementType> | undefined> =
  Object.fromEntries(
    ELEMENT_TYPES.map((type) => {
      const allowed = ALLOWED_CHILDREN[type];
      return [type, allowed ? new Set(allowed) : undefined];
    })
  ) as Record<ElementType, Set<ElementType> | undefined>;

export const ALLOWED_CATEGORIES_BY_PARENT: Record<
  ElementType,
  Set<ElementCategory>
> = Object.fromEntries(
  ELEMENT_TYPES.map((parentType) => {
    const parentCategories = ELEMENT_CATEGORIES[parentType] || [];
    const allowed = new Set<ElementCategory>();
    parentCategories.forEach((parentCat) => {
      (NESTING_RULES[parentCat] || []).forEach((cat) => allowed.add(cat));
    });
    return [parentType, allowed];
  })
) as Record<ElementType, Set<ElementCategory>>;

// Pre-computed landmark elements
export const LANDMARK_ELEMENTS = new Set<ElementType>(
  ELEMENT_TYPES.filter((type) => ELEMENT_RULES[type].isLandmark)
);

// Pre-computed interactive elements
export const INTERACTIVE_ELEMENTS = new Set<ElementType>(
  ELEMENT_TYPES.filter((type) =>
    ELEMENT_RULES[type].categories.includes(ElementCategory.INTERACTIVE)
  )
);
