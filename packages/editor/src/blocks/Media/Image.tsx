/**
 * Image Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";

export interface ImageBlockConfig extends BlockData {
  elementType: ElementType;
}

export const imageBlockConfig: ImageBlockConfig = {
  id: "image",
  label: "Image",
  category: "Media",
  elementType: "image",
  icon: "/src/assets/icons/blocks/media/image.svg",
  // Intentionally NO src — a default (e.g. via.placeholder.com) shipped to
  // production. The inserted Image is selected and the Inspector's
  // "Choose image" picks its asset (L1-017).
  content: '<img alt="Image"/>',
};
