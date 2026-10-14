/**
 * Email Input Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";

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
    '<input type="email" name="email" placeholder="email@example.com" style="padding:var(--buildrick-design-space-2);border:1px solid #ccc;border-radius:var(--buildrick-design-radius-sm);width:100%"/>',
};
