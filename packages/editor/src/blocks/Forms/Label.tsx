/**
 * Label Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface LabelBlockConfig extends BlockData {
  elementType: ElementType;
}

export const labelBlockConfig: LabelBlockConfig = {
  id: "label",
  label: "Label",
  category: "Forms",
  elementType: "text",
  icon: "/src/assets/icons/blocks/text.svg",
  content: '<label style="font-weight:500">Label text</label>',
};
