/**
 * Product Collection Service
 * Auto-creates and manages the Products CMS collection for e-commerce blocks
 * @license BSD-3-Clause
 */

import type { CMSCollection, CMSField } from "../../shared/types/cms";
import { PRODUCT_COLLECTION_SCHEMA, SAMPLE_PRODUCTS } from "../../shared/types/ecommerce";
import type { CollectionManager } from "./CollectionManager";

/**
 * Service for managing the Products CMS collection
 * Handles auto-creation with optional sample data
 */
export class ProductCollectionService {
  constructor(private collectionManager: CollectionManager) {}

  /**
   * Check if a Products collection already exists
   */
  async hasProductsCollection(): Promise<boolean> {
    const collections = await this.collectionManager.getAllCollections();
    return collections.some((c) => c.slug === "products");
  }

  /**
   * Get the Products collection ID if it exists
   */
  async getProductsCollectionId(): Promise<string | null> {
    const collections = await this.collectionManager.getAllCollections();
    const products = collections.find((c) => c.slug === "products");
    return products?.id ?? null;
  }

  /**
   * Get the Products collection if it exists
   */
  async getProductsCollection(): Promise<CMSCollection | null> {
    const collections = await this.collectionManager.getAllCollections();
    return collections.find((c) => c.slug === "products") ?? null;
  }

  /**
   * Create the Products collection with schema and optional sample data
   * @param includeSampleData - Whether to add sample products
   * @returns The created collection
   */
  async createProductsCollection(includeSampleData: boolean): Promise<CMSCollection> {
    // Create collection from schema
    const collection = await this.collectionManager.createCollection(
      PRODUCT_COLLECTION_SCHEMA.name,
      PRODUCT_COLLECTION_SCHEMA.slug,
      PRODUCT_COLLECTION_SCHEMA.description
    );

    // Add fields from schema
    for (const field of PRODUCT_COLLECTION_SCHEMA.fields) {
      const fieldDef: CMSField = {
        id: field.id,
        name: field.name,
        slug: field.slug,
        type: field.type,
        order: field.order,
        validation: field.validation,
        defaultValue: field.defaultValue,
        placeholder: field.placeholder,
        helpText: field.helpText,
      };
      await this.collectionManager.addField(collection.id, fieldDef);
    }

    // Update collection with display field and icon
    await this.collectionManager.updateCollection(collection.id, {
      displayField: PRODUCT_COLLECTION_SCHEMA.displayField,
      icon: PRODUCT_COLLECTION_SCHEMA.icon,
    });

    // Add sample data if requested
    if (includeSampleData) {
      for (const product of SAMPLE_PRODUCTS) {
        await this.collectionManager.createContentItem(
          collection.id,
          product as unknown as Record<string, unknown>
        );
      }
    }

    // Refetch to get updated collection with fields
    const updated = await this.getProductsCollection();
    return updated ?? collection;
  }

  /**
   * Ensure Products collection exists, prompting for creation if needed
   * @param onPrompt - Callback to prompt user for collection creation
   * @returns Collection ID if created/exists, null if user skipped
   */
  async ensureProductsCollection(
    onPrompt: (createCallback: (includeSampleData: boolean) => Promise<void>) => void
  ): Promise<string | null> {
    const existingId = await this.getProductsCollectionId();
    if (existingId) {
      return existingId;
    }

    // Collection doesn't exist, trigger prompt
    return new Promise((resolve) => {
      onPrompt(async (includeSampleData: boolean) => {
        const collection = await this.createProductsCollection(includeSampleData);
        resolve(collection.id);
      });
    });
  }
}
