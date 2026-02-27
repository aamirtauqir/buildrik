/**
 * Video Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface VideoBlockConfig extends BlockData {
  elementType: ElementType;
}

export const videoBlockConfig: VideoBlockConfig = {
  id: "video",
  label: "Video",
  category: "Media",
  elementType: "video",
  icon: "/src/assets/icons/blocks/media/video.svg",
  content: '<video controls><source src="" type="video/mp4"></video>',
};
