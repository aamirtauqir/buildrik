/**
 * Checkbox Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface CheckboxBlockConfig extends BlockData {
  elementType: ElementType;
}

export const checkboxBlockConfig: CheckboxBlockConfig = {
  id: "checkbox",
  label: "Checkbox",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<label style="display:flex;align-items:center;gap:8px"><input type="checkbox"/> Checkbox option</label>',
};
