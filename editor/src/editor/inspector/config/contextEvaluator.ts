/**
 * Context Evaluator for showIf Conditions
 * Evaluates showIf expressions from groups.json against current inspector context.
 *
 * Supported expressions:
 * - "always" - Always show
 * - "ctx.display == 'flex'" - Check display property
 * - "ctx.isTextLike == true" - Check boolean trait
 * - "ctx.elementType == 'modal'" - Check element type
 * - "ctx.devMode == true" - Check dev mode state
 *
 * @license BSD-3-Clause
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Full inspector context for evaluating showIf conditions
 */
export interface InspectorContext {
  /** Current element type (text, button, container, etc.) */
  elementType: string;
  /** True for text, heading, paragraph, link, button (elements with text content) */
  isTextLike: boolean;
  /** True for image, video */
  isMedia: boolean;
  /** True for link, button, a elements */
  isLinkLike: boolean;
  /** True for elements that have editable content */
  hasContent: boolean;
  /** Current display value (flex, grid, block, etc.) */
  display: string;
  /** Whether Dev mode is enabled */
  devMode: boolean;
}

// ============================================================================
// TEXT-LIKE ELEMENTS
// ============================================================================

const TEXT_LIKE_ELEMENTS = new Set([
  "text",
  "heading",
  "paragraph",
  "link",
  "button",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "label",
  "input",
  "textarea",
]);

const MEDIA_ELEMENTS = new Set(["image", "video", "img", "iframe"]);

const LINK_LIKE_ELEMENTS = new Set(["link", "button", "a", "nav-link"]);

const CONTENT_ELEMENTS = new Set([
  "text",
  "heading",
  "paragraph",
  "button",
  "link",
  "input",
  "textarea",
  "label",
]);

// ============================================================================
// CONTEXT BUILDER
// ============================================================================

export interface ContextBuilderInput {
  elementType: string;
  display?: string;
  devMode?: boolean;
}

/**
 * Build a full inspector context from minimal input
 */
export function buildInspectorContext(input: ContextBuilderInput): InspectorContext {
  const elementType = input.elementType.toLowerCase();

  return {
    elementType,
    isTextLike: TEXT_LIKE_ELEMENTS.has(elementType),
    isMedia: MEDIA_ELEMENTS.has(elementType),
    isLinkLike: LINK_LIKE_ELEMENTS.has(elementType),
    hasContent: CONTENT_ELEMENTS.has(elementType),
    display: input.display ?? "",
    devMode: input.devMode ?? false,
  };
}

// ============================================================================
// CONDITION EVALUATOR
// ============================================================================

/**
 * Evaluate a showIf condition string against the current context.
 *
 * @param condition - The showIf expression (e.g., "ctx.display == 'flex'")
 * @param ctx - The current inspector context
 * @returns Whether the condition is satisfied
 */
export function evaluateShowIf(condition: string, ctx: InspectorContext): boolean {
  // Handle special "always" case
  if (condition === "always" || !condition) {
    return true;
  }

  // Parse simple equality expressions: "ctx.field == 'value'" or "ctx.field == value"
  const equalityMatch = condition.match(/^ctx\.(\w+)\s*==\s*['"]?([^'"]+)['"]?$/);
  if (equalityMatch) {
    const [, field, expectedValue] = equalityMatch;
    const actualValue = ctx[field as keyof InspectorContext];

    // Handle boolean comparisons
    if (expectedValue === "true") {
      return actualValue === true;
    }
    if (expectedValue === "false") {
      return actualValue === false;
    }

    // Handle string comparisons
    return String(actualValue) === expectedValue;
  }

  // Parse inequality expressions: "ctx.field != 'value'"
  const inequalityMatch = condition.match(/^ctx\.(\w+)\s*!=\s*['"]?([^'"]+)['"]?$/);
  if (inequalityMatch) {
    const [, field, unexpectedValue] = inequalityMatch;
    const actualValue = ctx[field as keyof InspectorContext];

    if (unexpectedValue === "true") {
      return actualValue !== true;
    }
    if (unexpectedValue === "false") {
      return actualValue !== false;
    }

    return String(actualValue) !== unexpectedValue;
  }

  // Unknown condition format - default to showing
  return true;
}

/**
 * Check if a group should be visible based on its showIf condition
 */
export function shouldShowGroup(showIf: string, ctx: InspectorContext): boolean {
  return evaluateShowIf(showIf, ctx);
}

// ============================================================================
// BATCH EVALUATION
// ============================================================================

/**
 * Evaluate multiple showIf conditions at once
 * Returns a map of groupId -> isVisible
 */
export function evaluateGroupVisibility(
  groups: Array<{ id: string; showIf: string }>,
  ctx: InspectorContext
): Map<string, boolean> {
  const result = new Map<string, boolean>();

  for (const group of groups) {
    result.set(group.id, evaluateShowIf(group.showIf, ctx));
  }

  return result;
}
