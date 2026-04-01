/**
 * Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface InputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const inputBlockConfig: InputBlockConfig = {
  id: "input",
  label: "Input",
  category: "Forms",
  elementType: "input",
  content: '<input type="text" placeholder="Enter text..."/>',
};
