/**
 * Email Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface EmailInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const emailInputBlockConfig: EmailInputBlockConfig = {
  id: "email",
  label: "Email",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<input type="email" placeholder="email@example.com" style="padding:8px;border:1px solid #ccc;border-radius:4px;width:100%"/>',
};
