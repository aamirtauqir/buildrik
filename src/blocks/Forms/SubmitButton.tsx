/**
 * Submit Button Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface SubmitButtonBlockConfig extends BlockData {
  elementType: ElementType;
}

export const submitButtonBlockConfig: SubmitButtonBlockConfig = {
  id: "submit",
  label: "Submit Button",
  category: "Forms",
  elementType: "button",
  icon: "/src/assets/icons/blocks/button.svg",
  content:
    '<button type="submit" style="padding:10px 20px;background:#667eea;color:white;border:none;border-radius:4px;cursor:pointer">Submit</button>',
};
