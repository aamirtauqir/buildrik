/**
 * Time Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface TimeInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const timeInputBlockConfig: TimeInputBlockConfig = {
  id: "time",
  label: "Time",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content: '<input type="time" style="padding:8px;border:1px solid #ccc;border-radius:4px"/>',
};
