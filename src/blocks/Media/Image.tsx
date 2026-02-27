/**
 * Image Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface ImageBlockConfig extends BlockData {
  elementType: ElementType;
}

export const imageBlockConfig: ImageBlockConfig = {
  id: "image",
  label: "Image",
  category: "Media",
  elementType: "image",
  icon: "/src/assets/icons/blocks/media/image.svg",
  content: '<img src="https://via.placeholder.com/350x200" alt="Image"/>',
};
