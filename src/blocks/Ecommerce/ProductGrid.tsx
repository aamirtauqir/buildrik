/**
 * ProductGrid Block
 * Creates a responsive grid bound to the Products CMS collection
 * Uses programmatic element creation via build function
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine/Composer";
import type { BlockBuildConfig } from "../types";

/**
 * Build ProductGrid with programmatic element creation
 * Creates a responsive grid bound to the Products CMS collection
 *
 * @param composer - The composer instance
 * @param parentId - Parent element ID to add to
 * @param dropIndex - Optional index for insertion position
 * @returns The created grid element's ID for auto-selection
 */
export function buildProductGrid(
  composer: Composer,
  parentId: string,
  dropIndex?: number
): string | undefined {
  // Create grid container with CMS binding
  const grid = composer.elements.createElement("container", {
    tagName: "div",
    attributes: {
      class: "product-grid",
      "data-cms-collection": "products",
      "data-cms-template": "true",
    },
    styles: {
      display: "grid",
      "grid-template-columns": "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "24px",
      width: "100%",
      padding: "20px",
    },
  });

  composer.elements.addElement(grid, parentId, dropIndex);
  return grid.getId();
}

/**
 * ProductGrid block configuration
 * Creates a responsive grid that displays products from CMS
 */
export const productGridBlockConfig: BlockBuildConfig = {
  id: "product-grid",
  label: "Product Grid",
  category: "Ecommerce",
  elementType: "product-grid",
  build: buildProductGrid,
};
