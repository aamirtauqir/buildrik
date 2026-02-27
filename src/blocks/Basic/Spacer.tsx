/**
 * Spacer Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface SpacerBlockConfig extends BlockData {
  elementType: ElementType;
}

export const spacerBlockConfig: SpacerBlockConfig = {
  id: "spacer",
  label: "Spacer",
  category: "Basic",
  elementType: "spacer",
  icon: "/src/assets/icons/blocks/basic/spacer.svg",
  content: '<div style="height:40px"></div>',
};
