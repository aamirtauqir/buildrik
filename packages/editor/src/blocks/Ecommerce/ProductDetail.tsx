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
<article data-product-detail style="display:grid;grid-template-columns:1fr 1fr;gap:40px;max-width:1200px;margin:0 auto;padding:40px">
  <div style="aspect-ratio:1;overflow:hidden;border-radius:16px;background:#f3f4f6">
    <img data-bind="image" src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600" alt="Product" style="width:100%;height:100%;object-fit:cover"/>
  </div>
  <div style="display:flex;flex-direction:column;gap:16px;padding:20px 0">
    <span data-bind="category" style="color:#6b7280;text-transform:uppercase;font-size:14px;letter-spacing:1px">Category</span>
    <h1 data-bind="name" style="font-size:36px;font-weight:700;margin:0;color:#111827;line-height:1.2">Product Name</h1>
    <p data-bind="description" style="color:#4b5563;font-size:16px;line-height:1.7;margin:0">Full product description with all the details about features, materials, specifications, and usage instructions. This is where you would include comprehensive information about the product.</p>
    <div style="font-size:32px;font-weight:700;color:#111827;margin:16px 0">
      <span data-bind="price">$0.00</span>
    </div>
    <div style="display:flex;gap:24px;font-size:14px;color:#6b7280;padding:16px 0;border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb">
      <span>SKU: <span data-bind="sku" style="color:#111827;font-weight:500">SKU-000</span></span>
      <span>Stock: <span data-bind="inventory" style="color:#111827;font-weight:500">0</span> units</span>
    </div>
    <button style="margin-top:16px;padding:16px 32px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:background 0.2s">Add to Cart</button>
  </div>
</article>
  `.trim(),
};
