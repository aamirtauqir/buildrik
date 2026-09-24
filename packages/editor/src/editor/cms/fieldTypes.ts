/**
 * The field types a person can add, in the Add field dialog's order
 * (4418:164208: Text · Number · Rich text · Image · Boolean · Reference ·
 * Slug, then the two the model also carries), and their prose names — the
 * slug is an identifier, a field list is read.
 *
 * @license BSD-3-Clause
 */
export const FIELD_TYPES = ["text", "number", "richtext", "image", "boolean", "reference", "slug", "textarea", "date"] as const;

export const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Text",
  textarea: "Long text",
  richtext: "Rich text",
  number: "Number",
  boolean: "Boolean",
  image: "Image",
  date: "Date",
  slug: "Slug",
  reference: "Reference",
};
