/**
 * Color Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface ColorInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const colorInputBlockConfig: ColorInputBlockConfig = {
  id: "color",
  label: "Color Picker",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<input type="color" value="#667eea" style="width:50px;height:40px;border:none;cursor:pointer"/>',
};
