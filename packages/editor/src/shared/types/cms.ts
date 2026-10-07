/**
 * CMS Types - Collection schema and content management
 * @license BSD-3-Clause
 */

import { cmsValueError, type CmsFieldType } from "@buildrik/shared/schemas/cms";

/** Field types supported in CMS collections — the shared schema's list (DM-13). */
export type CMSFieldType = CmsFieldType;

/** Validation rules for CMS fields */
export interface CMSFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;
}

/** CMS field definition */
export interface CMSField {
  id: string;
  name: string;
  slug: string;
  type: CMSFieldType;
  description?: string;
  defaultValue?: unknown;
  validation?: CMSFieldValidation;
  options?: string[]; // For select/multiselect
  referenceCollection?: string; // For reference type
  placeholder?: string;
  helpText?: string;
  order: number;
}

/** CMS collection schema */
export interface CMSCollection {
  id: string;

  /**
   * Which site owns this collection. Absent on rows written before CMS was
   * scoped — those stay visible everywhere rather than vanishing, so reads test
   * `siteId === current || siteId == null`.
   *
   * Without it the store is browser-global, exactly as the media library was:
   * open a second site in the same browser and its Content panel lists the
   * first site's collections. (2026-08-24.)
   */
  siteId?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  fields: CMSField[];
  displayField?: string; // Field to use as display name
  // Dynamic-page binding (redesign E7). Set pageSlugPattern to generate one
  // published page per entry; {fieldSlug} placeholders resolve against the entry.
  pageSlugPattern?: string;
  pageSeoTitle?: string;
  pageSeoDescription?: string;
  pageTemplatePath?: string;
  createdAt: string;
  updatedAt: string;
}

/** CMS content item */
export interface CMSContentItem {
  id: string;
  collectionId: string;
  data: Record<string, unknown>;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/** CMS query options for filtering content */
export interface CMSQueryOptions {
  collectionId: string;
  filter?: Record<string, unknown>;
  sort?: { field: string; direction: "asc" | "desc" };
  limit?: number;
  offset?: number;
  status?: CMSContentItem["status"];
}

/** CMS query result */
export interface CMSQueryResult {
  items: CMSContentItem[];
  total: number;
  hasMore: boolean;
}

/** Event types for CMS operations */
export type CMSEventType =
  | "collection:created"
  | "collection:updated"
  | "collection:deleted"
  | "content:created"
  | "content:updated"
  | "content:deleted"
  | "content:published"
  | "content:unpublished";

/** CMS event payload */
export interface CMSEvent {
  type: CMSEventType;
  collectionId: string;
  itemId?: string;
  timestamp: string;
}

/** CMS binding for connecting elements to content */
export interface CMSBinding {
  collectionId: string;
  itemId?: string; // Specific item or dynamic
  fieldPath: string; // Path to field (supports nested)
  transform?: "uppercase" | "lowercase" | "capitalize" | "date" | "number";
  fallback?: string;
}

/** Helper to create a new collection */
export function createCollection(
  name: string,
  slug?: string
): Omit<CMSCollection, "id" | "createdAt" | "updatedAt"> {
  return {
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
    fields: [],
  };
}

/** Helper to create a new field */
export function createField(name: string, type: CMSFieldType, order: number): Omit<CMSField, "id"> {
  return {
    name,
    slug: name.toLowerCase().replace(/\s+/g, "_"),
    type,
    order,
  };
}

/** Helper to create a new content item */
export function createContentItem(
  collectionId: string,
  data: Record<string, unknown> = {}
): Omit<CMSContentItem, "id" | "createdAt" | "updatedAt"> {
  return {
    collectionId,
    data,
    status: "draft",
  };
}

/** Validate field value against its type — the shared rule set (DM-13),
 *  the same one the server runs on a PUBLISHED upsert. */
export function validateFieldValue(field: CMSField, value: unknown): { valid: boolean; error?: string } {
  const error = cmsValueError(field, value);
  return error ? { valid: false, error } : { valid: true };
}
