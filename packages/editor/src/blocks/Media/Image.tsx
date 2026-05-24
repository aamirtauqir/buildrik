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
  // Intentionally NO src — empty src triggers the element:needs-asset
  // event at useBlockInsertion.ts:122, which the Media tab listens to
  // (useMediaState.ts:132) and uses to auto-open the asset picker.
  // Default src (e.g. via.placeholder.com) suppresses that event and
  // leaves users with a placeholder URL that ships to production.
  content: '<img alt="Image"/>',
};
