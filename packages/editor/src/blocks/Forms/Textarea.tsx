/**
 * Textarea Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface TextareaBlockConfig extends BlockData {
  elementType: ElementType;
}

export const textareaBlockConfig: TextareaBlockConfig = {
  id: "textarea",
  label: "Textarea",
  category: "Forms",
  elementType: "textarea",
  content: '<textarea placeholder="Enter message..."></textarea>',
};
