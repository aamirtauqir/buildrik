/**
 * Lottie Animation Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface LottieBlockConfig extends BlockData {
  elementType: ElementType;
}

export const lottieBlockConfig: LottieBlockConfig = {
  id: "lottie",
  label: "Lottie Animation",
  category: "Media",
  elementType: "lottie",
  icon: "/src/assets/icons/blocks/media/lotti.svg",
  content:
    '<div class="lottie-container" data-lottie-src="" style="width:200px;height:200px;background:#f5f5f5;border-radius:8px;display:flex;align-items:center;justify-content:center"><span style="color:#999">Lottie Animation</span></div>',
};
