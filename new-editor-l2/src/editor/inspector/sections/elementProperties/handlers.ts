/**
 * Element Properties Handlers
 * Transaction-based attribute change handlers
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import type { Element } from "../../../../engine/elements/Element";
import type { IconConfig } from "../../../../shared/types/media";

// ============================================================================
// TYPES
// ============================================================================

export interface SelectedElement {
  id: string;
  type: string;
}

export interface HandleChangeParams {
  id: string;
  value: string;
  composer: Composer | null | undefined;
  selectedElement: SelectedElement | null | undefined;
  setAttrs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// ============================================================================
// TRANSACTION HELPER
// ============================================================================

export const runTxn = (
  composer: Composer | null | undefined,
  name: string,
  fn: () => void
): void => {
  composer?.beginTransaction(name);
  try {
    fn();
  } finally {
    composer?.endTransaction();
  }
};

// ============================================================================
// HANDLER: COLUMNS COUNT
// ============================================================================

export const handleColumnsCountChange = (el: Element, composer: Composer, value: string): void => {
  const targetCount = parseInt(value, 10);
  if (isNaN(targetCount) || targetCount < 1 || targetCount > 6) return;

  const children = el.getChildren?.() || [];
  const currentCount = children.length;

  if (targetCount > currentCount) {
    // Add more columns
    for (let i = currentCount; i < targetCount; i++) {
      const newCol = composer.elements.createElement("container", {
        classes: ["col"],
        content: `Col ${i + 1}`,
      });
      el.addChild?.(newCol);
    }
  } else if (targetCount < currentCount) {
    // Remove extra columns (from the end)
    for (let i = currentCount - 1; i >= targetCount; i--) {
      const childToRemove = children[i];
      if (childToRemove) {
        composer.elements.removeElement(childToRemove.getId());
      }
    }
  }
};

// ============================================================================
// HANDLER: COLUMNS GAP
// ============================================================================

export const handleColumnsGapChange = (el: Element, value: string): void => {
  el.setStyle?.("gap", value);
};

// ============================================================================
// HANDLER: CONTENT
// ============================================================================

export const handleContentChange = (el: Element, value: string): void => {
  el.setContent?.(value || "");
};

// ============================================================================
// HANDLER: TEXTAREA DEFAULT VALUE
// ============================================================================

export const handleTextareaDefaultChange = (el: Element, value: string): void => {
  el.setContent?.(value || "");
  if (value) {
    el.setAttribute?.("value", value);
  } else {
    el.removeAttribute?.("value");
  }
};

// ============================================================================
// HANDLER: VIDEO SRC
// ============================================================================

export const handleVideoSrcChange = (el: Element, value: string): void => {
  if (!value) {
    el.removeAttribute?.("src");
  } else {
    el.setAttribute?.("src", value);
  }

  // Keep <source> child in sync
  const sourceChild =
    el.getChildren?.().find((c: Element) => c.getTagName?.().toLowerCase() === "source") || null;

  if (sourceChild) {
    if (!value) {
      sourceChild.removeAttribute?.("src");
    } else {
      sourceChild.setAttribute?.("src", value);
    }
  }
};

// ============================================================================
// HANDLER: VIDEO POSTER
// ============================================================================

export const handleVideoPosterChange = (el: Element, value: string): void => {
  if (!value) {
    el.removeAttribute?.("poster");
  } else {
    el.setAttribute?.("poster", value);
  }
};

// ============================================================================
// HANDLER: GENERIC ATTRIBUTE
// ============================================================================

export const handleGenericAttributeChange = (el: Element, id: string, value: string): void => {
  if (!value) {
    el.removeAttribute?.(id);
  } else {
    el.setAttribute?.(id, value);
  }
};

// ============================================================================
// HANDLER: ICON SELECTION
// ============================================================================

export const handleIconSelectAction = (
  el: Element,
  icon: IconConfig,
  setAttrs: React.Dispatch<React.SetStateAction<Record<string, string>>>
): void => {
  // Update data attributes
  el.setAttribute?.("data-icon-name", icon.name);
  el.setAttribute?.("data-icon-library", icon.library);
  el.setAttribute?.("data-icon-size", String(icon.size));
  el.setAttribute?.("data-icon-color", icon.color);
  el.setAttribute?.("data-icon-stroke", String(icon.strokeWidth));

  // Update element styles
  el.setStyle?.("width", `${icon.size}px`);
  el.setStyle?.("height", `${icon.size}px`);
  el.setStyle?.("color", icon.color);

  // Update attrs state
  setAttrs((prev) => ({
    ...prev,
    "data-icon-name": icon.name,
    "data-icon-size": String(icon.size),
    "data-icon-color": icon.color,
    "data-icon-stroke": String(icon.strokeWidth),
  }));
};

// ============================================================================
// HELPER: GET CURRENT ICON CONFIG
// ============================================================================

export const getCurrentIconConfig = (
  selectedElement: SelectedElement,
  composer: Composer | null | undefined
): IconConfig | undefined => {
  if (selectedElement.type !== "icon" || !composer) return undefined;

  const el = composer.elements.getElement(selectedElement.id);
  if (!el) return undefined;

  const name = el.getAttribute?.("data-icon-name") || "star";
  const size = parseInt(el.getAttribute?.("data-icon-size") || "32", 10);
  const color = el.getAttribute?.("data-icon-color") || "#ffffff";
  const strokeWidth = parseFloat(el.getAttribute?.("data-icon-stroke") || "2");

  return { library: "lucide", name, size, color, strokeWidth };
};
