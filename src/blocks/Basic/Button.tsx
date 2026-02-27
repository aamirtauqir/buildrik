/**
 * Button Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface ButtonBlockConfig extends BlockData {
  elementType: ElementType;
}

export const buttonBlockConfig: ButtonBlockConfig = {
  id: "button",
  label: "Button",
  category: "Basic",
  elementType: "button",
  icon: "/src/assets/icons/blocks/basic/button.svg",
  content: '<button class="btn">Click Me</button>',
};
