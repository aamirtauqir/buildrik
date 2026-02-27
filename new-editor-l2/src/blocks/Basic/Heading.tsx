/**
 * Heading Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface HeadingBlockConfig extends BlockData {
  elementType: ElementType;
}

export const headingBlockConfig: HeadingBlockConfig = {
  id: "heading",
  label: "Heading",
  category: "Basic",
  elementType: "heading",
  icon: "/src/assets/icons/blocks/basic/heading.svg",
  content: "<h2>Heading</h2>",
};
