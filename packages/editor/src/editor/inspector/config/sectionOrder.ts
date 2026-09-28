/**
 * Section order — ONE list per tab (Inspector v4, DD-15 define → shape → paint).
 *
 * Replaces the per-element-type profiles: which sections a type shows is its
 * capabilities (`@/shared/constants/elementCapabilities`) plus each entry's
 * own predicate; WHERE they show is this list, the same for every type.
 * Fill sits before Border on every type — boards 1, 8 and 17 all draw
 * "Fill + · Border +".
 *
 * @license BSD-3-Clause
 */

import type { SectionId, TabId } from "../sections/registry/_shared";

const STYLE_ORDER: readonly SectionId[] = [
  "component",
  "type",
  "layout",
  "typography",
  "size",
  "spacing",
  "fill",
  "border",
  /* Board 17: the closed "Text inside" summary sits LAST, after Border. */
  "text-inside",
];

const BEHAVIOUR_ORDER: readonly SectionId[] = [
  "form-fields",
  "form-settings",
  "slides",
  "slider-settings",
  "collection",
  "link",
  "cms-binding",
  "visibility",
  "interactions",
  "css-classes",
  "attributes",
];

const EFFECTS_ORDER: readonly SectionId[] = [
  "opacity",
  "shadow",
  "filters",
  "transform-motion",
  "effects-advanced",
];

export const SECTION_ORDER: Readonly<Record<TabId, readonly SectionId[]>> = {
  style: STYLE_ORDER,
  behaviour: BEHAVIOUR_ORDER,
  effects: EFFECTS_ORDER,
};
