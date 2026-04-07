/**
 * List Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface ListBlockConfig extends BlockData {
  elementType: ElementType;
}

export const listBlockConfig: ListBlockConfig = {
  id: "list",
  label: "List",
  category: "Basic",
  elementType: "list",
  icon: "/src/assets/icons/blocks/basic/list.svg",
  content: "<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>",
};
