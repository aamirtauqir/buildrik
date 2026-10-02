/**
 * Section Registry — single source of truth for inspector sections.
 *
 * This file is the public surface: types, helpers and the composed
 * `SECTION_REGISTRY`. The entries live in one file per Inspector v4 lane
 * (build plan §1.2), so parallel lanes never edit the same registry file:
 *   - `_shared.tsx`    — types, defineSection, adapters (W1)
 *   - `type.tsx`       — the type block (W1)
 *   - `component.tsx`  — the component row (W1 → L2-D2)
 *   - `text.tsx`       — Typography, Text inside (L2-A)
 *   - `box.tsx`        — Layout, Size, Spacing, Fill, Border (L2-C)
 *   - `effects.tsx`    — the Effects tab (L2-C)
 *   - `behaviour.tsx`  — the Behaviour tab (L2-D1)
 *
 * WHERE a section renders is `config/sectionOrder.ts` (one order per tab);
 * WHETHER it renders is its `capability` (the element's type) and
 * `shouldRender` (its runtime state).
 *
 * @license BSD-3-Clause
 */

import type { AnySectionEntry, SectionId, ShouldRenderContext } from "./_shared";
import { BEHAVIOUR_SECTIONS } from "./behaviour";
import { BOX_SECTIONS } from "./box";
import { COMPONENT_SECTIONS } from "./component";
import { EFFECTS_SECTIONS } from "./effects";
import { TEXT_SECTIONS } from "./text";
import { TYPE_SECTIONS } from "./type";

export type {
  AnySectionEntry,
  BaseStyleSectionProps,
  SectionContext,
  SectionEntry,
  SectionId,
  SectionOpen,
  ShouldRenderContext,
  TabId,
} from "./_shared";
export { adaptBaseStyleProps, adaptElementProps, defineSection, EMPTY_MIXED_KEYS, INSPECTOR_TABS } from "./_shared";

// ============================================================================
// THE REGISTRY — composed from per-lane fragments
// ============================================================================

export const SECTION_REGISTRY: Record<SectionId, AnySectionEntry> = {
  ...COMPONENT_SECTIONS,
  ...TYPE_SECTIONS,
  ...TEXT_SECTIONS,
  ...BOX_SECTIONS,
  ...BEHAVIOUR_SECTIONS,
  ...EFFECTS_SECTIONS,
} as Record<SectionId, AnySectionEntry>;

// ============================================================================
// DERIVED HELPERS
// ============================================================================

// Stamp each entry with its own id so consumers (tests, devtools) can
// reference it without needing the enclosing Record key.
(Object.keys(SECTION_REGISTRY) as SectionId[]).forEach((id) => {
  SECTION_REGISTRY[id].id = id;
});

/**
 * All section ids in registry declaration order. Useful for `expandAll` and
 * integrity tests — the source of truth for "every section that exists."
 */
export const ALL_REGISTRY_SECTION_IDS = Object.keys(SECTION_REGISTRY) as SectionId[];

/**
 * Flat array of all registry entries with their ids stamped in.
 * Useful for tests and tooling that need to iterate or find by id.
 */
export const SECTION_REGISTRY_LIST: (AnySectionEntry & { id: SectionId })[] =
  ALL_REGISTRY_SECTION_IDS.map((id) => SECTION_REGISTRY[id] as AnySectionEntry & { id: SectionId });

/** Values that mean "nothing set" for the has-a-value test. */
const UNSET = new Set(["", "none", "normal", "auto", "initial", "unset", "0", "0px", "transparent", "rgba(0, 0, 0, 0)"]);

/**
 * Does this section say anything about THIS element — does the element carry
 * one of its own values (not a type default, not a computed fallback) for a
 * property the section owns? Decides "open" vs the "+" row for a `valued`
 * section (DD-11). Sections that own no CSS never apply by this rule.
 */
function sectionApplies(id: SectionId, authored: Record<string, string>): boolean {
  const keys = SECTION_REGISTRY[id]?.styleKeys ?? [];
  return keys.some((k) => {
    const v = authored[k];
    return v !== undefined && !UNSET.has(String(v).trim());
  });
}

/** An entry's own `hasValue`, else `sectionApplies` over its style keys. */
export function sectionHasValue(id: SectionId, ctx: ShouldRenderContext): boolean {
  const entry = SECTION_REGISTRY[id];
  return entry.hasValue ? entry.hasValue(ctx) : sectionApplies(id, ctx.authoredStyles);
}

/**
 * Build the advanced-prop map that `useAdvancedSettings` takes as input.
 * Iterates the registry, collects every entry with an `advancedKey`, and
 * resolves it to the real property list via the properties registry. This
 * replaces the three hardcoded const objects (LAYOUT_TAB_ADVANCED_PROPS etc.)
 * that used to live in the per-tab components.
 */
export function buildAdvancedPropsMapFromRegistry(): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const entry of Object.values(SECTION_REGISTRY)) {
    /* From the section's own declaration, not from a registry prefix. The
       prefix derivation asked propertiesRegistry which ids start with e.g.
       "layout." and are tiered advanced — a different set from what the
       section's advanced block renders, so groups stayed shut on values the
       user had just set. Sections declare what they draw. */
    if (entry.advancedKey && entry.advancedProps?.length) {
      map[entry.advancedKey] = [...entry.advancedProps];
    }
  }
  return map;
}
