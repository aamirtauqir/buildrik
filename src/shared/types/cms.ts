/**
 * CMS Types - Collection schema and content management
 * @license BSD-3-Clause
 */

/** Field types supported in CMS collections */
export type CMSFieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "date"
  | "datetime"
  | "boolean"
  | "select"
  | "multiselect"
  | "image"
  | "file"
  | "reference"
  | "color"
  | "url"
  | "email";

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
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  fields: CMSField[];
  displayField?: string; // Field to use as display name
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

/** Validate field value against its type */
export function validateFieldValue(
  field: CMSField,
  value: unknown
): { valid: boolean; error?: string } {
  const { type, validation } = field;

  // Check required
  if (validation?.required && (value === undefined || value === null || value === "")) {
    return { valid: false, error: `${field.name} is required` };
  }

  // Skip further validation if empty and not required
  if (value === undefined || value === null || value === "") {
    return { valid: true };
  }

  // Type-specific validation
  switch (type) {
    case "number": {
      const num = Number(value);
      if (isNaN(num)) return { valid: false, error: `${field.name} must be a number` };
      if (validation?.min !== undefined && num < validation.min) {
        return { valid: false, error: `${field.name} must be at least ${validation.min}` };
      }
      if (validation?.max !== undefined && num > validation.max) {
        return { valid: false, error: `${field.name} must be at most ${validation.max}` };
      }
      break;
    }
    case "text":
    case "textarea":
    case "richtext": {
      const str = String(value);
      if (validation?.minLength !== undefined && str.length < validation.minLength) {
        return {
          valid: false,
          error: `${field.name} must be at least ${validation.minLength} characters`,
        };
      }
      if (validation?.maxLength !== undefined && str.length > validation.maxLength) {
        return {
          valid: false,
          error: `${field.name} must be at most ${validation.maxLength} characters`,
        };
      }
      if (validation?.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(str)) {
          return {
            valid: false,
            error: validation.patternMessage || `${field.name} format is invalid`,
          };
        }
      }
      break;
    }
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        return { valid: false, error: `${field.name} must be a valid email` };
      }
      break;
    }
    case "url": {
      try {
        new URL(String(value));
      } catch {
        return { valid: false, error: `${field.name} must be a valid URL` };
      }
      break;
    }
    case "select": {
      if (field.options && !field.options.includes(String(value))) {
        return { valid: false, error: `${field.name} must be one of: ${field.options.join(", ")}` };
      }
      break;
    }
  }

  return { valid: true };
}
