/**
 * Icon Block - Lucide Icons Support
 * Renders vector icons from Lucide library with customization
 *
 * @module components/Blocks/Media/Icon
 * @license BSD-3-Clause
 */

import type { Composer } from "../../engine";
import type { ElementType } from "../../shared/types";
import type { BlockBuildConfig } from "../types";

export interface IconBlockConfig extends BlockBuildConfig {
  elementType: ElementType;
}

/**
 * Default star icon SVG (Lucide star icon path)
 */
const DEFAULT_ICON_SVG = `<svg
  xmlns="http://www.w3.org/2000/svg"
  width="32"
  height="32"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  data-icon="star"
  data-library="lucide"
  style="color: #ffffff;"
>
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
</svg>`;

/**
 * Build function for icon block
 * Creates an icon element with default star icon
 */
function buildIconBlock(
  composer: Composer,
  parentId: string,
  dropIndex?: number
): string | undefined {
  // Create a container span for the icon
  const element = composer.elements.createElement("icon", {
    content: DEFAULT_ICON_SVG,
  });

  // Set initial styles
  element.setStyles({
    display: "inline-flex",
    "align-items": "center",
    "justify-content": "center",
    width: "32px",
    height: "32px",
    color: "#ffffff",
  });

  // Add data attributes for icon config
  element.setAttribute("data-icon-name", "star");
  element.setAttribute("data-icon-library", "lucide");
  element.setAttribute("data-icon-size", "32");
  element.setAttribute("data-icon-color", "#ffffff");
  element.setAttribute("data-icon-stroke", "2");

  composer.elements.addElement(element, parentId, dropIndex);
  return element.getId();
}

export const iconBlockConfig: IconBlockConfig = {
  id: "icon",
  label: "Icon",
  category: "Media",
  elementType: "icon",
  icon: "/src/assets/icons/blocks/media/icons.svg",
  content: DEFAULT_ICON_SVG,
  build: buildIconBlock,
};
