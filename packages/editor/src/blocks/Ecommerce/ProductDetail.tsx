/**
 * ProductDetail Block
 * Full-page product view with large image, full description, and all product fields
 * Supports CMS data binding via data-bind attributes
 * @license BSD-3-Clause
 */

import type { BlockBuildConfig } from "../types";

/**
 * ProductDetail block configuration
 * Displays a full product page with image gallery, description, and metadata
 * Supports CMS data binding via data-bind attributes
 */
export const productDetailBlockConfig: BlockBuildConfig = {
  id: "product-detail",
  label: "Product Detail",
  category: "Ecommerce",
  elementType: "product-detail",
  content: `
<article data-product-detail data-buildrick-type="product-detail" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--buildrick-design-space-10);max-width:1200px;margin:0 auto;padding:var(--buildrick-design-space-10)">
  <div style="aspect-ratio:1;overflow:hidden;border-radius:var(--buildrick-design-radius-xl);background:var(--buildrick-design-color-surface-muted)">
    <img data-bind="image" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" alt="Product" style="width:100%;height:100%;object-fit:cover"/>
  </div>
  <div style="display:flex;flex-direction:column;gap:var(--buildrick-design-space-4);padding:var(--buildrick-design-space-5) 0">
    <span data-bind="category" style="color:var(--buildrick-design-color-text-subtle);text-transform:uppercase;font-size:var(--buildrick-design-font-size-sm);letter-spacing:1px">Category</span>
    <h1 data-bind="name" style="font-size:var(--buildrick-design-font-size-4xl);font-weight:700;margin:0;color:var(--buildrick-design-color-text-strong);line-height:1.2">Product Name</h1>
    <p data-bind="description" style="color:#4b5563;font-size:var(--buildrick-design-font-size-base);line-height:1.7;margin:0">Full product description with all the details about features, materials, specifications, and usage instructions. This is where you would include comprehensive information about the product.</p>
    <div style="font-size:32px;font-weight:700;color:var(--buildrick-design-color-text-strong);margin:var(--buildrick-design-space-4) 0">
      <span data-bind="price">$0.00</span>
    </div>
    <div style="display:flex;gap:var(--buildrick-design-space-6);font-size:var(--buildrick-design-font-size-sm);color:var(--buildrick-design-color-text-subtle);padding:var(--buildrick-design-space-4) 0;border-top:1px solid var(--buildrick-design-color-border-subtle);border-bottom:1px solid var(--buildrick-design-color-border-subtle)">
      <span>SKU: <span data-bind="sku" style="color:var(--buildrick-design-color-text-strong);font-weight:500">SKU-000</span></span>
      <span>Stock: <span data-bind="inventory" style="color:var(--buildrick-design-color-text-strong);font-weight:500">0</span> units</span>
    </div>
    <button style="margin-top:var(--buildrick-design-space-4);padding:var(--buildrick-design-space-4) var(--buildrick-design-space-8);background:#2563eb;color:white;border:none;border-radius:var(--buildrick-design-radius-md);font-size:var(--buildrick-design-font-size-base);font-weight:600;cursor:pointer;transition:background 0.2s">Add to Cart</button>
  </div>
</article>
  `.trim(),
};
