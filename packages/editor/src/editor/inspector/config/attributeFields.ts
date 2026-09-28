/**
 * Attributes section rows (Inspector v4 §17.H "MAKE ADVANCED"): the
 * developer attributes every element carries — ID, title, tab index — and the
 * per-type attributes the redesign moved out of the type block because they
 * are rarely changed (image decoding, video preload, input autocomplete /
 * read-only, textarea max length, form action / method / encoding).
 *
 * Not here, by decision: Link/Button "Open In" and "Rel" (the Link section
 * owns where a link goes, R-DD-9), a link's "Title" (R-DD-9), and any content
 * textarea (the text is edited on the canvas).
 *
 * @license BSD-3-Clause
 */

import type { PropertyConfig } from "../sections/typeBlock/PropertyField";

const COMMON_ATTRIBUTE_FIELDS: readonly PropertyConfig[] = [
  { id: "id", label: "ID", type: "text", placeholder: "element-id" },
  { id: "title", label: "Title", type: "text", placeholder: "Shown on hover" },
  { id: "tabindex", label: "Tab index", type: "text", placeholder: "0" },
];

const TYPE_ATTRIBUTE_FIELDS: Readonly<Record<string, readonly PropertyConfig[]>> = {
  image: [
    {
      id: "decoding",
      label: "Decoding",
      type: "select",
      options: [
        { value: "auto", label: "Auto" },
        { value: "sync", label: "Sync" },
        { value: "async", label: "Async" },
      ],
    },
  ],
  video: [
    {
      id: "preload",
      label: "Preload",
      type: "select",
      options: [
        { value: "auto", label: "Auto" },
        { value: "metadata", label: "Metadata" },
        { value: "none", label: "None" },
      ],
    },
  ],
  input: [
    { id: "readonly", label: "Read only", type: "checkbox" },
    {
      id: "autocomplete",
      label: "Autocomplete",
      type: "select",
      options: [
        { value: "on", label: "On" },
        { value: "off", label: "Off" },
        { value: "name", label: "Name" },
        { value: "email", label: "Email" },
        { value: "tel", label: "Phone" },
      ],
    },
  ],
  textarea: [
    { id: "readonly", label: "Read only", type: "checkbox" },
    { id: "maxlength", label: "Max length", type: "text" },
    { id: "cols", label: "Columns", type: "text", placeholder: "50" },
  ],
  form: [
    { id: "action", label: "Action URL", type: "text", placeholder: "/submit" },
    {
      id: "method",
      label: "Method",
      type: "select",
      options: [
        { value: "POST", label: "POST" },
        { value: "GET", label: "GET" },
      ],
    },
    {
      id: "enctype",
      label: "Encoding",
      type: "select",
      options: [
        { value: "application/x-www-form-urlencoded", label: "URL encoded" },
        { value: "multipart/form-data", label: "Multipart (file upload)" },
        { value: "text/plain", label: "Plain text" },
      ],
    },
    { id: "novalidate", label: "Disable validation", type: "checkbox" },
    {
      id: "autocomplete",
      label: "Autocomplete",
      type: "select",
      options: [
        { value: "on", label: "On" },
        { value: "off", label: "Off" },
      ],
    },
  ],
};

/** The Attributes rows for a type: its own §17.H rows, then the common ones
 *  (a link has no Title row — R-DD-9). */
export function attributeFieldsFor(type: string): readonly PropertyConfig[] {
  const common = type === "link" ? COMMON_ATTRIBUTE_FIELDS.filter((f) => f.id !== "title") : COMMON_ATTRIBUTE_FIELDS;
  return [...common, ...(TYPE_ATTRIBUTE_FIELDS[type] ?? [])];
}
