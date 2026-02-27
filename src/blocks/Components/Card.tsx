/**
 * Card Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface CardBlockConfig extends BlockData {
  elementType: ElementType;
}

export const cardBlockConfig: CardBlockConfig = {
  id: "card",
  label: "Card",
  category: "Components",
  elementType: "card",
  content:
    '<div style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);overflow:hidden;max-width:320px"><img src="https://via.placeholder.com/320x180" style="width:100%"/><div style="padding:20px"><h3 style="margin:0 0 8px">Card Title</h3><p style="color:#666;margin:0">Card description goes here.</p></div></div>',
};
