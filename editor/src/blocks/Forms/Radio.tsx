/**
 * Radio Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface RadioBlockConfig extends BlockData {
  elementType: ElementType;
}

export const radioBlockConfig: RadioBlockConfig = {
  id: "radio",
  label: "Radio",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<label style="display:flex;align-items:center;gap:8px"><input type="radio" name="radio-group"/> Radio option</label>',
};
