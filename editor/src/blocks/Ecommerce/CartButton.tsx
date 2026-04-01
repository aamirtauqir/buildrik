/**
 * Cart Button Block
 * Shows cart count and triggers checkout
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig } from "../types";

/**
 * CartButton block configuration
 * Displays a checkout button with cart count
 */
export const cartButtonBlockConfig: BlockBuildConfig = {
  id: "cart-button",
  label: "Cart Button",
  category: "Ecommerce",
  elementType: "button",
  content: `
<button data-checkout style="display:inline-flex;align-items:center;gap:8px;padding:12px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;transition:background 0.2s">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
  Cart (<span data-cart-count>0</span>) - Checkout
</button>
  `.trim(),
};
