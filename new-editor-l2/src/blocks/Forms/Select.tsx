/**
 * Select Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface SelectBlockConfig extends BlockData {
  elementType: ElementType;
}

export const selectBlockConfig: SelectBlockConfig = {
  id: "select",
  label: "Select",
  category: "Forms",
  elementType: "select",
  content: "<select><option>Option 1</option><option>Option 2</option></select>",
};
