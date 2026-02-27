/**
 * Footer Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface FooterBlockConfig extends BlockData {
  elementType: ElementType;
}

export const footerBlockConfig: FooterBlockConfig = {
  id: "footer",
  label: "Footer",
  category: "Sections",
  elementType: "footer",
  content:
    '<footer style="padding:40px 20px;background:#1a1a2e;color:#fff;text-align:center"><p>&copy; 2024 Aquibra. All rights reserved.</p></footer>',
};
