/**
 * Navbar Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "@/shared/types";

export interface NavbarBlockConfig extends BlockData {
  elementType: ElementType;
}

export const navbarBlockConfig: NavbarBlockConfig = {
  id: "navbar",
  label: "Navbar",
  description: "Top navigation: your site name on the left, page links on the right.",
  category: "Sections",
  elementType: "navbar",
  content:
    '<nav data-buildrick-type="navbar" style="display:flex;justify-content:space-between;align-items:center;padding:var(--buildrick-design-space-4) var(--buildrick-design-space-6);background:var(--buildrick-design-color-surface-raised);box-shadow:0 2px 4px rgba(0,0,0,0.1)"><div style="font-weight:bold;font-size:var(--buildrick-design-font-size-xl)">Logo</div><div style="display:flex;gap:var(--buildrick-design-space-6)"><a href="#" style="text-decoration:none;color:#333">Home</a><a href="#" style="text-decoration:none;color:#333">About</a><a href="#" style="text-decoration:none;color:#333">Services</a><a href="#" style="text-decoration:none;color:#333">Contact</a></div></nav>',
};
