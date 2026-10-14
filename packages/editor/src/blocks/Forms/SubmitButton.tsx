/**
 * Submit Button Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";

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
    '<button type="submit" style="padding:10px var(--buildrick-design-space-5);background:var(--buildrick-design-color-primary);color:var(--buildrick-design-color-on-primary);border:none;border-radius:var(--buildrick-design-radius-sm);cursor:pointer">Submit</button>',
};
