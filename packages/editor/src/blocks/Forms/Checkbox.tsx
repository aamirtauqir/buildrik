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
  elementType: "checkbox",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<label data-buildrick-type="checkbox" style="display:flex;align-items:center;gap:var(--buildrick-design-space-2)"><input type="checkbox" name="checkbox"/> Checkbox option</label>',
};
