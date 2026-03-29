/**
 * Link Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface LinkBlockConfig extends BlockData {
  elementType: ElementType;
}

export const linkBlockConfig: LinkBlockConfig = {
  id: "link",
  label: "Link",
  category: "Basic",
  elementType: "link",
  icon: "/src/assets/icons/blocks/link.svg",
  content: '<a href="#">Link</a>',
};
