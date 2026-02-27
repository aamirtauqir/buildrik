/**
 * Number Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface NumberInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const numberInputBlockConfig: NumberInputBlockConfig = {
  id: "number",
  label: "Number",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<input type="number" placeholder="0" style="padding:8px;border:1px solid #ccc;border-radius:4px"/>',
};
