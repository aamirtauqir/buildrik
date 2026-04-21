/**
 * Border section schema — data-only description of the full section.
 *
 * Mirrors sections/BorderSection.tsx:
 *   Essentials:
 *     1. Border Width — length
 *     2. Border Style — select
 *     3. Border Color — color
 *     4. Border Radius — corners4 (linkable)
 *   Advanced (inside advanced-group disclosure):
 *     5-8. Individual Borders — text inputs for border-{top,right,bottom,left}
 *     9-12. Outline Width / Style / Color / Offset
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

/** 4 outline-style values. Narrower than border-style per BorderSection.tsx:206-211. */
const OUTLINE_STYLE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
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

/**
 * Full Border schema including the advanced-disclosure block. Callers that
 * only want essentials can import `borderEssentialsSchema`; callers that
 * want parity with the hand-written BorderSection use this one.
 */
export const borderSchema: SectionSchema = {
  id: "border",
  label: "Border",
  icon: "Square",
  density: "compact",
  fields: [
    ...borderEssentialsSchema.fields,
    {
      type: "advanced-group",
      label: "Individual borders & outline",
      fields: [
        { type: "group-heading", label: "Individual Borders" },
        {
          type: "text",
          prop: "border-top",
          label: "Top",
          placeholder: "1px solid #ccc",
        },
        {
          type: "text",
          prop: "border-right",
          label: "Right",
          placeholder: "1px solid #ccc",
        },
        {
          type: "text",
          prop: "border-bottom",
          label: "Bottom",
          placeholder: "1px solid #ccc",
        },
        {
          type: "text",
          prop: "border-left",
          label: "Left",
          placeholder: "1px solid #ccc",
        },
        { type: "group-heading", label: "Outline", divider: true },
        {
          type: "length",
          prop: "outline-width",
          label: "Width",
          units: ["px", "em"],
        },
        {
          type: "select",
          prop: "outline-style",
          label: "Style",
          options: OUTLINE_STYLE_OPTIONS,
        },
        { type: "color", prop: "outline-color", label: "Color" },
        {
          type: "length",
          prop: "outline-offset",
          label: "Offset",
          units: ["px", "em"],
        },
      ],
    },
  ],
};
