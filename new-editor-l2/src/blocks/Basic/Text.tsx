/**
 * Text Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface TextBlockConfig extends BlockData {
  elementType: ElementType;
}

export const textBlockConfig: TextBlockConfig = {
  id: "text",
  label: "Text",
  category: "Basic",
  elementType: "text",
  icon: "/src/assets/icons/blocks/basic/text.svg",
  content: "<span>Enter text here</span>",
};
