/**
 * Navbar Block
 * @license BSD-3-Clause
 */

import type { BlockData, ElementType } from "../../shared/types";

export interface NavbarBlockConfig extends BlockData {
  elementType: ElementType;
}

export const navbarBlockConfig: NavbarBlockConfig = {
  id: "navbar",
  label: "Navbar",
  category: "Sections",
  elementType: "navbar",
  content:
    '<nav style="display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:#fff;box-shadow:0 2px 4px rgba(0,0,0,0.1)"><div style="font-weight:bold;font-size:20px">Logo</div><div style="display:flex;gap:24px"><a href="#" style="text-decoration:none;color:#333">Home</a><a href="#" style="text-decoration:none;color:#333">About</a><a href="#" style="text-decoration:none;color:#333">Services</a><a href="#" style="text-decoration:none;color:#333">Contact</a></div></nav>',
};
