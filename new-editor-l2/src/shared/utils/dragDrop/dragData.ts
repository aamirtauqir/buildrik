/**
 * Drag & Drop Data Helpers
 * DataTransfer parsing and setting utilities
 *
 * @module utils/dragDrop/dragData
 * @license BSD-3-Clause
 */

import { MIME_TYPES } from "../../constants";
import type { ElementType, ElementData, Point } from "../../types";
import { generateId } from "../helpers";
import type { DragData, DragDataElement, DragDataBlock, DragDataMulti } from "./types";

// =============================================================================
// CONSTANTS
// =============================================================================

/** Drag mime types - using centralized constants */
const MIME_ELEMENT = MIME_TYPES.ELEMENT;
const MIME_BLOCK = MIME_TYPES.BLOCK;
const MIME_MULTI = MIME_TYPES.MULTI;

// =============================================================================
// SESSION ID GENERATION
// =============================================================================

/**
 * Generate unique drag session ID
 */
export function generateDragSessionId(): string {
  return generateId("drag");
}

// =============================================================================
// PARSE DRAG DATA
// =============================================================================

/**
 * Parse drag data from DataTransfer
 */
export function parseDragData(dataTransfer: DataTransfer | null): DragData {
  if (!dataTransfer) {
    return { type: "unknown" };
  }

  // Check for multi-element drag
  const multiData = dataTransfer.getData(MIME_MULTI);
  if (multiData) {
    try {
      return JSON.parse(multiData) as DragDataMulti;
    } catch {
      // Invalid JSON
    }
  }

  // Check for existing element being moved
  const elementData = dataTransfer.getData(MIME_ELEMENT) || dataTransfer.getData("element");
  if (elementData) {
    try {
      const parsed = JSON.parse(elementData);
      if (parsed.elementId) {
        return {
          type: "element",
          sessionId: parsed.sessionId || generateDragSessionId(),
          startTime: parsed.startTime || Date.now(),
          startPosition: parsed.startPosition || { x: 0, y: 0 },
          elementId: parsed.elementId,
          elementType: parsed.elementType || "container",
          originalParentId: parsed.originalParentId,
          originalIndex: parsed.originalIndex,
        };
      }
    } catch {
      // Invalid JSON
    }
  }

  // Check for new block being added
  const blockData = dataTransfer.getData(MIME_BLOCK) || dataTransfer.getData("block");
  if (blockData) {
    try {
      const block = JSON.parse(blockData);
      return {
        type: "block",
        sessionId: block.sessionId || generateDragSessionId(),
        startTime: block.startTime || Date.now(),
        startPosition: block.startPosition || { x: 0, y: 0 },
        block: block.block || block,
      };
    } catch {
      // Invalid JSON
    }
  }

  // Check for external content (files, text, etc.)
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return {
      type: "external",
      sessionId: generateDragSessionId(),
      startTime: Date.now(),
      startPosition: { x: 0, y: 0 },
      files: Array.from(dataTransfer.files),
    };
  }

  const text = dataTransfer.getData("text/plain");
  const html = dataTransfer.getData("text/html");
  const url = dataTransfer.getData("text/uri-list");

  if (text || html || url) {
    return {
      type: "external",
      sessionId: generateDragSessionId(),
      startTime: Date.now(),
      startPosition: { x: 0, y: 0 },
      text: text || undefined,
      html: html || undefined,
      url: url || undefined,
    };
  }

  return { type: "unknown" };
}

// =============================================================================
// SET DRAG DATA
// =============================================================================

/**
 * Set drag data for an element being moved
 */
export function setElementDragData(
  dataTransfer: DataTransfer,
  elementId: string,
  elementType: ElementType,
  options: {
    originalParentId?: string;
    originalIndex?: number;
    startPosition?: Point;
  } = {}
): string {
  const sessionId = generateDragSessionId();
  const data: DragDataElement = {
    type: "element",
    sessionId,
    startTime: Date.now(),
    startPosition: options.startPosition || { x: 0, y: 0 },
    elementId,
    elementType,
    originalParentId: options.originalParentId,
    originalIndex: options.originalIndex,
  };

  dataTransfer.setData(MIME_ELEMENT, JSON.stringify(data));
  dataTransfer.setData("element", JSON.stringify(data)); // Legacy support
  dataTransfer.effectAllowed = "move";

  return sessionId;
}

/**
 * Set drag data for a new block being added
 */
export function setBlockDragData(
  dataTransfer: DataTransfer,
  block: Partial<ElementData>,
  startPosition?: Point
): string {
  const sessionId = generateDragSessionId();
  const data: DragDataBlock = {
    type: "block",
    sessionId,
    startTime: Date.now(),
    startPosition: startPosition || { x: 0, y: 0 },
    block,
  };

  dataTransfer.setData(MIME_BLOCK, JSON.stringify(data));
  dataTransfer.setData("block", JSON.stringify(data)); // Legacy support
  dataTransfer.effectAllowed = "copy";

  return sessionId;
}

/**
 * Set drag data for multiple elements
 */
export function setMultiDragData(
  dataTransfer: DataTransfer,
  elements: Array<{
    elementId: string;
    elementType: ElementType;
    originalParentId?: string;
    originalIndex?: number;
  }>,
  startPosition?: Point
): string {
  const sessionId = generateDragSessionId();
  const data: DragDataMulti = {
    type: "multi",
    sessionId,
    startTime: Date.now(),
    startPosition: startPosition || { x: 0, y: 0 },
    elements,
  };

  dataTransfer.setData(MIME_MULTI, JSON.stringify(data));
  dataTransfer.effectAllowed = "move";

  return sessionId;
}

// =============================================================================
// DRAG DATA CHECKS
// =============================================================================

/**
 * Check if drag data contains a specific type
 */
export function hasDragDataType(
  dataTransfer: DataTransfer | null,
  type: "element" | "block" | "multi" | "external"
): boolean {
  if (!dataTransfer) return false;

  switch (type) {
    case "element":
      return dataTransfer.types.includes(MIME_ELEMENT) || dataTransfer.types.includes("element");
    case "block":
      return dataTransfer.types.includes(MIME_BLOCK) || dataTransfer.types.includes("block");
    case "multi":
      return dataTransfer.types.includes(MIME_MULTI);
    case "external":
      return (
        (dataTransfer.files && dataTransfer.files.length > 0) ||
        dataTransfer.types.includes("text/plain") ||
        dataTransfer.types.includes("text/html") ||
        dataTransfer.types.includes("text/uri-list")
      );
    default:
      return false;
  }
}

/**
 * Get drag effect based on data type
 */
export function getDragEffect(data: DragData): DataTransfer["effectAllowed"] {
  switch (data.type) {
    case "element":
    case "multi":
      return "move";
    case "block":
      return "copy";
    case "external":
      return "copy";
    default:
      return "none";
  }
}
