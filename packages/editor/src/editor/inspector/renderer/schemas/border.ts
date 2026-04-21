/**
 * Border section schema — data-only description of the essentials block.
 *
 * Mirrors the always-visible controls in sections/BorderSection.tsx:
 *   1. Border Width — length
 *   2. Border Style — select
 *   3. Border Color — color
 *   4. Border Radius — corners4 (linkable)
 *
 * Advanced block (Individual Borders + Outline) is NOT in this schema yet —
 * it lives behind a MoreSettingsToggle which requires an `advanced-group`
 * field type (future session).
 *
 * @license BSD-3-Clause
 */

import type { SectionSchema } from "../schema";

/** 9 CSS border-style values. Order matches BorderSection.tsx:111-122. */
const BORDER_STYLE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
  { value: "groove", label: "Groove" },
  { value: "ridge", label: "Ridge" },
  { value: "inset", label: "Inset" },
  { value: "outset", label: "Outset" },
] as const;

export const borderEssentialsSchema: SectionSchema = {
  id: "border",
  label: "Border",
  icon: "Square",
  density: "compact",
  fields: [
    {
      type: "length",
      prop: "border-width",
      label: "Width",
      units: ["px", "em", "rem"],
    },
    {
      type: "select",
      prop: "border-style",
      label: "Style",
      options: BORDER_STYLE_OPTIONS,
    },
    {
      type: "color",
      prop: "border-color",
      label: "Color",
    },
    {
      type: "corners4",
      label: "Radius",
      linkable: true,
    },
  ],
};
