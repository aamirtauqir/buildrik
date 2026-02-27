/**
 * Password Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface PasswordInputBlockConfig extends BlockData {
  elementType: ElementType;
}

export const passwordInputBlockConfig: PasswordInputBlockConfig = {
  id: "password",
  label: "Password",
  category: "Forms",
  elementType: "input",
  icon: "/src/assets/icons/blocks/input.svg",
  content:
    '<input type="password" placeholder="Password" style="padding:8px;border:1px solid #ccc;border-radius:4px;width:100%"/>',
};
