/**
 * Range Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface RangeInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const rangeInputBlockConfig: RangeInputBlockConfig = {
  id: "range",
  label: "Range Slider",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content: '<input type="range" min="0" max="100" value="50" style="width:100%"/>',
};
