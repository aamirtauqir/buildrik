/**
 * Aquibra Image Gallery Block
 * @license BSD-3-Clause
 */

import { placeholderImageSrc } from "../../shared/constants/media";

export const galleryBlockConfig = {
  id: "gallery",
  label: "Image Gallery",
  category: "Media",
  elementType: "gallery" as const,
  icon: "/src/assets/icons/blocks/media/carausal.svg",
  content:
    '<div class="buildrick-image-gallery" data-buildrick-type="gallery">' +
    '<div class="buildrick-gallery-grid">' +
    `<img src="${placeholderImageSrc(400, 260)}" alt="Gallery item 1"/>` +
    `<img src="${placeholderImageSrc(400, 260)}" alt="Gallery item 2"/>` +
    `<img src="${placeholderImageSrc(400, 260)}" alt="Gallery item 3"/>` +
    "</div>" +
    "</div>",
};

