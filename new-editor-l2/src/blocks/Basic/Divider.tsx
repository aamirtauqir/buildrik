/**
 * Divider Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface DividerBlockConfig extends BlockData {
  elementType: ElementType;
}

export const dividerBlockConfig: DividerBlockConfig = {
  id: "divider",
  label: "Divider",
  category: "Basic",
  elementType: "divider",
  icon: "/src/assets/icons/blocks/basic/divider.svg",
  content: "<hr/>",
};
