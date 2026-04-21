/**
 * Spacing section schema — data-only description of the essentials block.
 *
 * Mirrors the always-visible controls in sections/SpacingSection.tsx:
 *   1. Margin — spacing4 (linkable, four sides)
 *   2. Padding — spacing4 (linkable, four sides)
 *
 * Advanced block (row-gap, column-gap) is NOT in this schema yet — it lives
 * behind a MoreSettingsToggle and needs an `advanced-group` field type
 * (future session). Mixed-value badges + per-side disabled states are also
 * future work, carried in a schema extension rather than here.
 *
 * @license BSD-3-Clause
 */

import type { SectionSchema } from "../schema";

export const spacingEssentialsSchema: SectionSchema = {
  id: "spacing",
  label: "Spacing",
  icon: "MoveHorizontal",
  density: "compact",
  fields: [
    { type: "spacing4", group: "margin", label: "Margin", linkable: true },
    { type: "spacing4", group: "padding", label: "Padding", linkable: true },
  ],
};
