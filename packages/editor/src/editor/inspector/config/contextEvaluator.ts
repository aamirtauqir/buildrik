/**
 * Inspector context builder
 * Derives the element-trait context (text-like, media, link-like, display)
 * that cssContext.ts reads. The groups.json showIf evaluator this file once
 * held is gone; section visibility lives in the inspector registry.
 *
 * @license BSD-3-Clause
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Element-trait context for the current selection
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
  };
}

