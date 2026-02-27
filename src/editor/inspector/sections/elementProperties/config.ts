/**
 * Element Properties Configuration
 * Property definitions for all element types
 * @license BSD-3-Clause
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PropertyConfig {
  id: string;
  label: string;
  type: "text" | "select" | "checkbox" | "textarea";
  placeholder?: string;
  options?: { value: string; label: string }[];
}

// ============================================================================
// ELEMENT PROPERTIES
// ============================================================================

export const ELEMENT_PROPERTIES: Record<string, PropertyConfig[]> = {
  link: [
    { id: "href", label: "URL", type: "text", placeholder: "https://..." },
    {
      id: "target",
      label: "Open In",
      type: "select",
      options: [
        { value: "_self", label: "Same Window" },
        { value: "_blank", label: "New Tab" },
        { value: "_parent", label: "Parent Frame" },
        { value: "_top", label: "Top Frame" },
      ],
    },
    { id: "rel", label: "Rel", type: "text", placeholder: "noopener noreferrer" },
    { id: "title", label: "Title", type: "text", placeholder: "Link title" },
  ],

  button: [
    { id: "content", label: "Button Label", type: "textarea", placeholder: "Button text" },
    { id: "href", label: "Link URL", type: "text", placeholder: "https://..." },
    {
      id: "target",
      label: "Open In",
      type: "select",
      options: [
        { value: "_self", label: "Same Window" },
        { value: "_blank", label: "New Tab" },
      ],
    },
    {
      id: "type",
      label: "Button Type",
      type: "select",
      options: [
        { value: "button", label: "Button" },
        { value: "submit", label: "Submit" },
        { value: "reset", label: "Reset" },
      ],
    },
    { id: "disabled", label: "Disabled", type: "checkbox" },
  ],

  image: [
    { id: "src", label: "Image URL", type: "text", placeholder: "https://..." },
    { id: "alt", label: "Alt Text", type: "text", placeholder: "Image description" },
    { id: "title", label: "Title", type: "text", placeholder: "Image title" },
    {
      id: "loading",
      label: "Loading",
      type: "select",
      options: [
        { value: "lazy", label: "Lazy" },
        { value: "eager", label: "Eager" },
      ],
    },
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

  heading: [
    { id: "content", label: "Heading Text", type: "textarea", placeholder: "Enter heading..." },
  ],

  text: [{ id: "content", label: "Text Content", type: "textarea", placeholder: "Enter text..." }],

  paragraph: [
    {
      id: "content",
      label: "Paragraph Content",
      type: "textarea",
      placeholder: "Enter paragraph...",
    },
  ],

  label: [{ id: "content", label: "Label Text", type: "textarea", placeholder: "Field label" }],

  video: [
    { id: "src", label: "Video URL", type: "text", placeholder: "https://..." },
    { id: "poster", label: "Poster Image", type: "text", placeholder: "https://..." },
    { id: "autoplay", label: "Autoplay", type: "checkbox" },
    { id: "loop", label: "Loop", type: "checkbox" },
    { id: "muted", label: "Muted", type: "checkbox" },
    { id: "controls", label: "Show Controls", type: "checkbox" },
    { id: "playsinline", label: "Plays Inline", type: "checkbox" },
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
    {
      id: "type",
      label: "Input Type",
      type: "select",
      options: [
        { value: "text", label: "Text" },
        { value: "email", label: "Email" },
        { value: "password", label: "Password" },
        { value: "number", label: "Number" },
        { value: "tel", label: "Phone" },
        { value: "url", label: "URL" },
        { value: "date", label: "Date" },
        { value: "time", label: "Time" },
        { value: "datetime-local", label: "Date & Time" },
        { value: "search", label: "Search" },
        { value: "file", label: "File" },
        { value: "hidden", label: "Hidden" },
        { value: "checkbox", label: "Checkbox" },
        { value: "radio", label: "Radio" },
        { value: "range", label: "Range" },
        { value: "color", label: "Color" },
      ],
    },
    { id: "name", label: "Name", type: "text", placeholder: "field_name" },
    { id: "placeholder", label: "Placeholder", type: "text", placeholder: "Enter text..." },
    { id: "value", label: "Default Value", type: "text", placeholder: "" },
    { id: "required", label: "Required", type: "checkbox" },
    { id: "disabled", label: "Disabled", type: "checkbox" },
    { id: "readonly", label: "Read Only", type: "checkbox" },
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
    { id: "name", label: "Name", type: "text", placeholder: "field_name" },
    { id: "placeholder", label: "Placeholder", type: "text", placeholder: "Enter text..." },
    { id: "value", label: "Default Value", type: "textarea", placeholder: "Enter default text..." },
    { id: "rows", label: "Rows", type: "text", placeholder: "4" },
    { id: "cols", label: "Columns", type: "text", placeholder: "50" },
    { id: "required", label: "Required", type: "checkbox" },
    { id: "disabled", label: "Disabled", type: "checkbox" },
    { id: "readonly", label: "Read Only", type: "checkbox" },
    { id: "maxlength", label: "Max Length", type: "text", placeholder: "" },
  ],

  select: [
    { id: "name", label: "Name", type: "text", placeholder: "field_name" },
    { id: "required", label: "Required", type: "checkbox" },
    { id: "disabled", label: "Disabled", type: "checkbox" },
    { id: "multiple", label: "Multiple", type: "checkbox" },
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
        { value: "application/x-www-form-urlencoded", label: "URL Encoded" },
        { value: "multipart/form-data", label: "Multipart (File Upload)" },
        { value: "text/plain", label: "Plain Text" },
      ],
    },
    { id: "novalidate", label: "Disable Validation", type: "checkbox" },
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

  iframe: [
    { id: "src", label: "URL", type: "text", placeholder: "https://..." },
    { id: "title", label: "Title", type: "text", placeholder: "Embed title" },
    { id: "width", label: "Width", type: "text", placeholder: "100%" },
    { id: "height", label: "Height", type: "text", placeholder: "400" },
    {
      id: "loading",
      label: "Loading",
      type: "select",
      options: [
        { value: "lazy", label: "Lazy" },
        { value: "eager", label: "Eager" },
      ],
    },
    { id: "allowfullscreen", label: "Allow Fullscreen", type: "checkbox" },
  ],

  columns: [
    {
      id: "data-columns",
      label: "Number of Columns",
      type: "select",
      options: [
        { value: "2", label: "2 Columns" },
        { value: "3", label: "3 Columns" },
        { value: "4", label: "4 Columns" },
        { value: "5", label: "5 Columns" },
        { value: "6", label: "6 Columns" },
      ],
    },
    {
      id: "data-gap",
      label: "Gap Between Columns",
      type: "select",
      options: [
        { value: "0", label: "None" },
        { value: "8px", label: "Small (8px)" },
        { value: "16px", label: "Medium (16px)" },
        { value: "24px", label: "Large (24px)" },
        { value: "32px", label: "Extra Large (32px)" },
      ],
    },
  ],

  icon: [
    {
      id: "data-icon-size",
      label: "Icon Size",
      type: "select",
      options: [
        { value: "16", label: "16px (XS)" },
        { value: "20", label: "20px (S)" },
        { value: "24", label: "24px (M)" },
        { value: "32", label: "32px (L)" },
        { value: "48", label: "48px (XL)" },
        { value: "64", label: "64px (XXL)" },
      ],
    },
    {
      id: "data-icon-stroke",
      label: "Stroke Width",
      type: "select",
      options: [
        { value: "1", label: "Thin (1)" },
        { value: "1.5", label: "Light (1.5)" },
        { value: "2", label: "Normal (2)" },
        { value: "2.5", label: "Medium (2.5)" },
        { value: "3", label: "Bold (3)" },
      ],
    },
  ],

  // Common properties for all elements
  default: [
    { id: "id", label: "ID", type: "text", placeholder: "element-id" },
    { id: "title", label: "Title", type: "text", placeholder: "Element title" },
    { id: "tabindex", label: "Tab Index", type: "text", placeholder: "0" },
  ],
};

/**
 * Get properties for an element type
 */
export function getPropertiesForType(type: string): PropertyConfig[] {
  return [...(ELEMENT_PROPERTIES[type] || []), ...ELEMENT_PROPERTIES.default];
}
