/**
 * Attribute writer — the type block's and Attributes' one write path for an
 * element's HTML attributes (moved from elementProperties/handlers.ts).
 *
 * `writeAttribute` writes one attribute on every id it is given, through the
 * lock gate (`writableElements`) and inside ONE transaction, so a
 * multi-selection is written, and undone, as one step (DD-12).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import type { IconConfig } from "@/shared/types/media";
import { writableElements } from "@/engine/commands/commandOperations";

// ============================================================================
// TYPES
// ============================================================================

import type { SelectedElementInfo as SelectedElement } from "@/shared/types";
export type { SelectedElement };


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
// THE WRITE
// ============================================================================

/**
 * Set (or, for an empty value, remove) `name` on every writable element of
 * `ids`, in one transaction. Returns the elements written — none when every
 * target is locked (the lock gate has already said so).
 */
export function writeAttribute(
  composer: Composer,
  ids: readonly string[],
  name: string,
  value: string,
): Element[] {
  const targets = writableElements(
    composer,
    ids.map((id) => composer.elements.getElement(id)),
  );
  if (targets.length === 0) return targets;
  runTxn(composer, "element-prop-change", () => {
    for (const el of targets) handleGenericAttributeChange(el, name, value);
  });
  return targets;
}

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
