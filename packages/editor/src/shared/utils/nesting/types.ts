/**
 * Nesting Types and Enums
 * Type definitions for nesting validation
 *
 * @module utils/nesting/types
 * @license BSD-3-Clause
 */

import type { ElementType } from "../../types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Maximum allowed nesting depth */
export const MAX_NESTING_DEPTH = 30;

/** Recommended maximum nesting depth */
export const RECOMMENDED_MAX_DEPTH = 15;

/** Maximum children per element (performance safeguard) */
export const MAX_CHILDREN_COUNT = 500;

// =============================================================================
// ELEMENT CATEGORIES (Aquibra + HTML5 Content Model)
// =============================================================================

/**
 * Element categories combining Aquibra types with HTML5 content model
 */
export enum ElementCategory {
  // Aquibra categories
  CONTAINER = "container",
  BLOCK = "block",
  INLINE = "inline",
  INTERACTIVE = "interactive",
  FORM = "form",
  MEDIA = "media",
  SECTION = "section",
  TEXT = "text",
  VOID = "void",

  // HTML5 Content Model categories
  FLOW = "flow",
  PHRASING = "phrasing",
  EMBEDDED = "embedded",
  HEADING = "heading",
  SECTIONING = "sectioning",
  METADATA = "metadata",
  TRANSPARENT = "transparent",

  // Semantic categories
  LANDMARK = "landmark",
  NAVIGATION = "navigation",
  STRUCTURAL = "structural",
}

/**
 * ARIA landmark roles
 */
export enum LandmarkRole {
  BANNER = "banner",
  COMPLEMENTARY = "complementary",
  CONTENTINFO = "contentinfo",
  FORM = "form",
  MAIN = "main",
  NAVIGATION = "navigation",
  REGION = "region",
  SEARCH = "search",
}

/**
 * Heading levels
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// =============================================================================
// ELEMENT RULES DEFINITION
// =============================================================================

/**
 * Comprehensive element rule definition
 */
export interface ElementRule {
  /** Element categories this type belongs to */
  categories: ElementCategory[];
  /** Explicitly forbidden child element types */
  forbiddenChildren?: ElementType[];
  /** Only these children are allowed (if specified) */
  allowedChildren?: ElementType[];
  /** Whether element can have children */
  allowChildren?: boolean;
  /** Implicit ARIA role */
  implicitRole?: string;
  /** Allowed ARIA roles */
  allowedRoles?: string[];
  /** Whether this is a landmark element */
  isLandmark?: boolean;
  /** Landmark role (if applicable) */
  landmarkRole?: LandmarkRole;
  /** Heading level (if heading) */
  headingLevel?: HeadingLevel;
  /** Whether element should be unique per page */
  shouldBeUnique?: boolean;
  /** Required parent types */
  requiredParent?: ElementType[];
  /** Recommended parent types */
  recommendedParent?: ElementType[];
  /** Description for documentation */
  description?: string;
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

export interface ValidationIssue {
  type: "error" | "warning" | "info";
  code: string;
  message: string;
  path: string[];
  elementType: ElementType;
  parentType?: ElementType;
  suggestion?: string;
}

export interface TreeStatistics {
  totalElements: number;
  maxDepth: number;
  averageDepth: number;
  elementTypeCounts: Record<string, number>;
  landmarkCount: number;
  interactiveCount: number;
  headingLevels: number[];
  emptyContainers: number;
}

export interface TreeValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
  depth: number;
  elementCount: number;
  statistics: TreeStatistics;
}

export interface ValidationOptions {
  /** Use strict HTML5 compliance */
  strictMode?: boolean;
  /** Check accessibility rules */
  checkAccessibility?: boolean;
  /** Check performance concerns */
  checkPerformance?: boolean;
  /** Custom max depth */
  maxDepth?: number;
}

export interface MoveValidationResult {
  allowed: boolean;
  reason?: string;
  suggestions?: ElementType[];
  wouldFixIssues?: string[];
  wouldCauseIssues?: string[];
}

export interface AutoFixSuggestion {
  type: "wrap" | "move" | "remove" | "unwrap";
  elementId?: string;
  wrapperType?: ElementType;
  targetParentType?: ElementType;
  description: string;
}

export interface TreeAnalysis {
  totalElements: number;
  maxDepth: number;
  averageDepth: number;
  elementTypeCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  landmarkElements: ElementType[];
  headingElements: { type: ElementType }[];
  emptyContainers: number;
  deeplyNestedCount: number;
  recommendations: string[];
}
