/**
 * E-commerce Types - Product catalog, collection schema, and cart
 * @license BSD-3-Clause
 */

import type { CMSCollection, CMSField } from "./cms";

// ============================================
// Cart Types (Stripe Checkout)
// ============================================

/**
 * Shopping cart item
 */
export interface CartItem {
  /** Unique product identifier */
  productId: string;
  /** Product name */
  name: string;
  /** Price in currency units (e.g., 19.99) */
  price: number;
  /** Quantity in cart */
  quantity: number;
  /** Product image URL */
  image?: string;
  /** Stock Keeping Unit */
  sku?: string;
  /** Stripe Payment Link URL for payment-links mode */
  paymentLink?: string;
}

/**
 * Shopping cart state stored in localStorage
 */
export interface CartState {
  /** Cart items */
  items: CartItem[];
  /** Currency code */
  currency: string;
  /** Last updated timestamp (ISO string) */
  updatedAt: string;
}

/**
 * Product data shape for type-safe access
 */
export interface ProductData {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sku: string;
  inventory: number;
  featured: boolean;
}

/**
 * Product field definition with e-commerce specific metadata
 */
export interface ProductField extends CMSField {
  priceFormat?: "USD" | "EUR" | "GBP";
  inventoryTracking?: boolean;
}

/**
 * Pre-defined product collection schema
 */
export const PRODUCT_COLLECTION_SCHEMA: Omit<CMSCollection, "id" | "createdAt" | "updatedAt"> = {
  name: "Products",
  slug: "products",
  description: "E-commerce product catalog",
  icon: "shopping-bag",
  displayField: "name",
  fields: [
    {
      id: "field-name",
      name: "Name",
      slug: "name",
      type: "text",
      order: 0,
      validation: { required: true, minLength: 3, maxLength: 200 },
      placeholder: "Product name",
    },
    {
      id: "field-description",
      name: "Description",
      slug: "description",
      type: "richtext",
      order: 1,
      placeholder: "Product description",
    },
    {
      id: "field-price",
      name: "Price",
      slug: "price",
      type: "number",
      order: 2,
      validation: { required: true, min: 0 },
      placeholder: "0.00",
      helpText: "Price in USD",
    },
    {
      id: "field-image",
      name: "Image",
      slug: "image",
      type: "image",
      order: 3,
      validation: { required: true },
      helpText: "Main product image",
    },
    {
      id: "field-category",
      name: "Category",
      slug: "category",
      type: "text",
      order: 4,
      placeholder: "Category name",
    },
    {
      id: "field-sku",
      name: "SKU",
      slug: "sku",
      type: "text",
      order: 5,
      validation: { pattern: "^[A-Z0-9-]+$" },
      placeholder: "SKU-001",
      helpText: "Stock Keeping Unit",
    },
    {
      id: "field-inventory",
      name: "Inventory",
      slug: "inventory",
      type: "number",
      order: 6,
      defaultValue: 0,
      validation: { min: 0 },
    },
    {
      id: "field-featured",
      name: "Featured",
      slug: "featured",
      type: "boolean",
      order: 7,
      defaultValue: false,
      helpText: "Show on homepage",
    },
  ],
};

/**
 * Sample product data for testing/demos
 */
export const SAMPLE_PRODUCTS: ProductData[] = [
  {
    name: "Premium Wireless Headphones",
    description: "High-quality wireless headphones with noise cancellation",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
    category: "Electronics",
    sku: "ELEC-001",
    inventory: 50,
    featured: true,
  },
  {
    name: "Organic Cotton T-Shirt",
    description: "Comfortable, eco-friendly cotton t-shirt",
    price: 34.99,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
    category: "Apparel",
    sku: "APP-001",
    inventory: 200,
    featured: true,
  },
  {
    name: "Minimalist Watch",
    description: "Elegant minimalist watch with leather strap",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",
    category: "Accessories",
    sku: "ACC-001",
    inventory: 30,
    featured: false,
  },
];
