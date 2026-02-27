/**
 * Paragraph Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface ParagraphBlockConfig extends BlockData {
  elementType: ElementType;
}

export const paragraphBlockConfig: ParagraphBlockConfig = {
  id: "paragraph",
  label: "Paragraph",
  category: "Basic",
  elementType: "paragraph",
  icon: "/src/assets/icons/blocks/basic/paragraph.svg",
  content: "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>",
};
