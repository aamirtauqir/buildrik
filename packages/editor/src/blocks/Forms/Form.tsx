/**
 * Form Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface FormBlockConfig extends BlockData {
  elementType: ElementType;
}

export const formBlockConfig: FormBlockConfig = {
  id: "form",
  label: "Form",
  category: "Forms",
  elementType: "form",
  content:
    '<form><input type="text" placeholder="Name"/><input type="email" placeholder="Email"/><button type="submit">Submit</button></form>',
};
