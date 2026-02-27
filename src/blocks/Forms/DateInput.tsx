/**
 * Date Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface DateInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const dateInputBlockConfig: DateInputBlockConfig = {
  id: "date",
  label: "Date",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content: '<input type="date" style="padding:8px;border:1px solid #ccc;border-radius:4px"/>',
};
