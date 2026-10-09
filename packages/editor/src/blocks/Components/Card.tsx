/**
 * Card Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";
import { placeholderImageSrc } from "@/shared/constants/media";

export interface CardBlockConfig extends BlockData {
  elementType: ElementType;
}

export const cardBlockConfig: CardBlockConfig = {
  id: "card",
  label: "Card",
  category: "Components",
  elementType: "card",
  content:
    `<div data-buildrick-type="card" style="background:var(--buildrick-design-color-surface-raised);border-radius:var(--buildrick-design-radius-lg);box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;max-width:320px"><img src="${placeholderImageSrc(320, 180)}" alt="Card image" style="width:100%"/><div style="padding:var(--buildrick-design-space-5)"><h3 style="margin:0 0 var(--buildrick-design-space-2)">Card Title</h3><p style="color:#666;margin:0">Card description goes here.</p></div></div>`,
};
