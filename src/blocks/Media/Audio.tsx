/**
 * Audio Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface AudioBlockConfig extends BlockData {
  elementType: ElementType;
}

export const audioBlockConfig: AudioBlockConfig = {
  id: "audio",
  label: "Audio",
  category: "Media",
  elementType: "audio",
  icon: "/src/assets/icons/blocks/media/audio.svg",
  content:
    '<audio controls><source src="" type="audio/mpeg">Your browser does not support the audio element.</audio>',
};
