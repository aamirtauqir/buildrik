/**
 * ProductCard Block
 * Displays a single product with image, name, price, and add to cart button
 * Supports CMS data binding via data-bind attributes
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig } from "../types";

/**
 * ProductCard block configuration
 * Displays a single product with image, name, price, and add to cart button
 * Supports CMS data binding via data-bind attributes
 */
export const productCardBlockConfig: BlockBuildConfig = {
  id: "product-card",
  label: "Product Card",
  category: "Ecommerce",
  elementType: "product-card",
  content: `
<div data-product-card data-buildrick-type="product-card" style="background:var(--buildrick-design-color-surface-raised);border-radius:var(--buildrick-design-radius-lg);box-shadow:0 2px 8px rgba(0,0,0,0.08);overflow:hidden;max-width:320px;transition:box-shadow 0.2s">
  <div style="position:relative;overflow:hidden">
    <img data-bind="image" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400" alt="Product" style="width:100%;height:220px;object-fit:cover;transition:transform 0.3s"/>
    <span style="position:absolute;top:12px;right:12px;background:#10b981;color:white;padding:var(--buildrick-design-space-1) var(--buildrick-design-space-2);border-radius:var(--buildrick-design-radius-sm);font-size:var(--buildrick-design-font-size-xs);font-weight:500">In Stock</span>
  </div>
  <div style="padding:var(--buildrick-design-space-5)">
    <p style="margin:0 0 var(--buildrick-design-space-1);font-size:var(--buildrick-design-font-size-xs);color:var(--buildrick-design-color-text-subtle);text-transform:uppercase;letter-spacing:0.5px" data-bind="category">Category</p>
    <h3 data-bind="name" style="margin:0 0 var(--buildrick-design-space-2);font-size:var(--buildrick-design-font-size-lg);font-weight:600;color:var(--buildrick-design-color-text-strong);line-height:1.3">Product Name</h3>
    <p style="margin:0 0 var(--buildrick-design-space-4);color:var(--buildrick-design-color-text-subtle);font-size:var(--buildrick-design-font-size-sm);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" data-bind="description">Product description goes here with details about the item.</p>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span data-bind="price" style="font-weight:700;font-size:var(--buildrick-design-font-size-2xl);color:var(--buildrick-design-color-text-strong)">$0.00</span>
      <button data-add-to-cart style="padding:10px var(--buildrick-design-space-5);background:#2563eb;color:white;border:none;border-radius:var(--buildrick-design-radius-md);font-weight:500;cursor:pointer;transition:background 0.2s">Add to Cart</button>
    </div>
  </div>
</div>
  `.trim(),
};
