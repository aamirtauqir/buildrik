/**
 * Block Builder Utilities
 * Shared functions for creating block elements to eliminate code duplication
 * @license BSD-3-Clause
 */

import type { Composer, ElementType } from "./types";

/**
 * Options for creating an element
 */
export interface ElementOptions {
  classes?: string[];
  content?: string;
  styles?: Record<string, string>;
}

/**
 * Configuration for a child element in a layout
 */
export interface ChildConfig {
  type: ElementType;
  options: ElementOptions;
}

/**
 * Creates a simple element and adds it to the parent.
 * Used by Container, Column, Row blocks that just need basic element creation.
 *
 * @param composer - The composer instance
 * @param parentId - Parent element ID to add to
 * @param elementType - Type of element to create
 * @param options - Element options (classes, content, styles)
 * @param dropIndex - Optional index for insertion position
 * @returns The created element's ID for auto-selection
 */
export function buildSimpleElement(
  composer: Composer,
  parentId: string,
  elementType: ElementType,
  options: ElementOptions = {},
  dropIndex?: number
): string {
  const element = composer.elements.createElement(elementType, options);
  composer.elements.addElement(element, parentId, dropIndex);
  return element.getId();
}

/**
 * Creates a layout element with nested children.
 * Used by Flex, Grid blocks that have default child items.
 *
 * @param composer - The composer instance
 * @param parentId - Parent element ID to add to
 * @param containerType - Type of container element (flex, grid, etc.)
 * @param containerOptions - Options for the container element
 * @param children - Array of child configurations to add
 * @param dropIndex - Optional index for insertion position
 * @returns The container element's ID for auto-selection
 */
export function buildLayoutWithChildren(
  composer: Composer,
  parentId: string,
  containerType: ElementType,
  containerOptions: ElementOptions,
  children: ChildConfig[],
  dropIndex?: number
): string {
  const container = composer.elements.createElement(containerType, containerOptions);

  for (const child of children) {
    const childElement = composer.elements.createElement(child.type, child.options);
    container.addChild(childElement);
  }

  composer.elements.addElement(container, parentId, dropIndex);
  return container.getId();
}

/**
 * Creates a section with an inner container.
 * Used by Section block that wraps content in a container.
 *
 * @param composer - The composer instance
 * @param parentId - Parent element ID to add to
 * @param sectionOptions - Options for the section element
 * @param innerOptions - Options for the inner container
 * @param dropIndex - Optional index for insertion position
 * @returns The section element's ID for auto-selection
 */
export function buildSectionWithContainer(
  composer: Composer,
  parentId: string,
  sectionOptions: ElementOptions = {},
  innerOptions: ElementOptions = {},
  dropIndex?: number
): string {
  const section = composer.elements.createElement("section", sectionOptions);
  const inner = composer.elements.createElement("container", innerOptions);
  section.addChild(inner);
  composer.elements.addElement(section, parentId, dropIndex);
  return section.getId();
}

/**
 * Creates a columns layout with N equal columns.
 * Used by 2-Column, 3-Column blocks.
 *
 * @param composer - The composer instance
 * @param parentId - Parent element ID to add to
 * @param columnCount - Number of columns to create
 * @param columnLabelPrefix - Prefix for column content labels
 * @param dropIndex - Optional index for insertion position
 * @returns The row element's ID for auto-selection
 */
export function buildColumns(
  composer: Composer,
  parentId: string,
  columnCount: number,
  columnLabelPrefix: string = "Column",
  dropIndex?: number
): string {
  const row = composer.elements.createElement("columns", {
    classes: ["row"],
  });

  for (let i = 0; i < columnCount; i++) {
    const col = composer.elements.createElement("container", {
      classes: ["col"],
      content: `${columnLabelPrefix} ${i + 1}`,
    });
    row.addChild(col);
  }

  composer.elements.addElement(row, parentId, dropIndex);
  return row.getId();
}

/**
 * Default styles for flex item placeholders
 */
export const FLEX_ITEM_STYLES: Record<string, string> = {
  background: "#e0e0e0",
  padding: "20px",
  "border-radius": "8px",
};

/**
 * Default styles for grid item placeholders
 */
export const GRID_ITEM_STYLES: Record<string, string> = {
  background: "#f0f0f0",
  padding: "20px",
  "border-radius": "8px",
};
