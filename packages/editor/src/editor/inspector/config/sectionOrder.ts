/**
 * Section order — ONE list per tab: Content · Style (Inspector v4, DD-15
 * define → shape → paint) · Behavior · Effects (2L9 page 04).
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
import { SECTION_REGISTRY } from "../sections/registry";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";

/* 2L9 page 04: the defining block, the type's own lists, the binding, then
   Semantics and the closed Advanced attributes (boards 161:8480, 156:716,
   247:26594). */
const CONTENT_ORDER: readonly SectionId[] = [
  /* B5-D04: a bound element's Dynamic bindings head the tab. */
  "cms-binding",
  /* B-17 / B-21: a modal trigger's dialog, a Tabs block's pairs (2L9 C07, C01). */
  "modal-relationship",
  "dialog-content",
  "tabs-pairs",
  "tab-panel",
  "type",
  "form-fields",
  "slides",
  "collection",
  "validation",
  /* 2L9 245:42929: a table's Structure and Accessibility. */
  "table-structure",
  "table-accessibility",
  "table-cell",
  /* B69: a container's direct children, after its own defining block. */
  "children",
  "commerce",
  "semantics",
  /* B-11: Conditions sit above Advanced attributes (2L9 B4-D04). */
  "conditions",
  "attributes",
];

const STYLE_ORDER: readonly SectionId[] = [
  /* 2L9 245:44049: a table's scroll wrapper leads with its own layout. */
  "table-wrapper",
  "type-layout",
  "layout",
  /* 2L9 247:21216: "Advanced layout · n set" right under Children layout. */
  "layout-advanced",
  "typography",
  "size",
  /* 2L9 247:22853: a flex / grid child's own group, before Spacing. */
  "flex-item",
  "grid-item",
  "spacing",
  "fill",
  "border",
  /* Board 17: the closed "Text inside" summary sits LAST, after Border. */
  "text-inside",
];

/* Board 156:6055: the type's own settings lead, then Visibility and
   Interactions. */
const BEHAVIOUR_ORDER: readonly SectionId[] = [
  /* 2L9 C18: a dialog's behaviour heads Behavior. */
  "dialog-behavior",
  "tabs-behavior",
  "form-settings",
  "slider-settings",
  "link",
  "visibility",
  "interactions",
];

const EFFECTS_ORDER: readonly SectionId[] = [
  "opacity",
  "shadow",
  "filters",
  "transform-motion",
  "effects-advanced",
];

export const SECTION_ORDER: Readonly<Record<TabId, readonly SectionId[]>> = {
  content: CONTENT_ORDER,
  style: STYLE_ORDER,
  behaviour: BEHAVIOUR_ORDER,
  effects: EFFECTS_ORDER,
};

/** The Content sections that define an element — its type block and its own
 *  lists. Attributes and a CMS binding alone do not. */
const DEFINING_CONTENT: readonly SectionId[] = ["type", "form-fields", "slides", "collection"];

/**
 * The tab a newly selected TYPE opens on (DD-20; same-type selections keep
 * theirs): Content when the type has something defining there (a heading's
 * text, a form's fields, an image's source — 2L9 boards 161:8480, 156:716),
 * else Style (a container is its layout — board 36:2 "Container layout").
 */
export function openingTab(type: string): TabId {
  const caps = capabilitiesFor(type);
  /* A table is defined by its structure (2L9 245:42929), Tabs by their pairs
     (C01–C04, every Tabs board opens on Content). */
  if (type === "table" || type === "tabs") return "content";
  return DEFINING_CONTENT.some((id) => SECTION_REGISTRY[id].capability?.(caps) ?? true) ? "content" : "style";
}
