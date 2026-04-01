/**
 * SVG Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface SVGBlockConfig extends BlockData {
  elementType: ElementType;
}

export const svgBlockConfig: SVGBlockConfig = {
  id: "svg",
  label: "SVG",
  category: "Media",
  elementType: "svg",
  icon: "/src/assets/icons/blocks/media/svg.svg",
  content:
    '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="#667eea" stroke-width="4" fill="none"/></svg>',
};
