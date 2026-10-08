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
  elementType: "radio",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<label data-buildrick-type="radio" style="display:flex;align-items:center;gap:var(--buildrick-design-space-2)"><input type="radio" name="radio-group"/> Radio option</label>',
};
