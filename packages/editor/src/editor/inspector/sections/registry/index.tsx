/**
 * Section Registry — single source of truth for inspector sections.
 *
 * This file is the public surface. External consumers
 * (`editor/inspector/...`) import types, helpers, and the composed
 * `SECTION_REGISTRY` from this path. Per-property-family files
 * (`./layout`, `./typography`, `./visual`, `./element`, `./effects`)
 * own their section definitions; this index aggregates them.
 *
 * Registry structure:
 *   - `_shared.tsx`      — types, defineSection, adaptBaseStyleProps
 *   - `layout.tsx`       — quick-actions, layout, size, spacing, flex, grid
 *   - `typography.tsx`   — typography
 *   - `visual.tsx`       — background, border, corner-radius
 *   - `element.tsx`      — link, element-properties, css-classes, all-css
 *   - `effects.tsx`      — effects, animation, interactions, visibility
 *
 * Maps every section id to a typed entry that bundles the component, a
 * shared-context adapter, an optional visibility predicate, and an optional
 * "advanced disclosure" group key. The profile-driven `InspectorTabContent`
 * renderer iterates a profile's ordered section list and calls
 * `entry.render(ctx)` — no direct prop spread, no `any`, no per-tab
 * duplication.
 *
 * Design reference:
 *   ~/.gstack/projects/aamirtauqir-buildrik/shahg-main-design-20260412-033637.md
 *   (sections "Recommended Approach" and "Section Adapter Inventory")
 *
 * @license BSD-3-Clause
 */

import { getAdvancedPropsForGroup } from "../../config/propertiesRegistry";
import type { AnySectionEntry, SectionId } from "./_shared";
import { ELEMENT_SECTIONS } from "./element";
import { EFFECTS_SECTIONS } from "./effects";
import { LAYOUT_SECTIONS } from "./layout";
import { TYPOGRAPHY_SECTIONS } from "./typography";
import { VISUAL_SECTIONS } from "./visual";

// Re-export the shared types + factory so consumers see no API change.
export type {
  AnySectionEntry,
  BaseStyleSectionProps,
  SectionContext,
  SectionEntry,
  SectionId,
  ShouldRenderContext,
  TabId,
} from "./_shared";
export { adaptBaseStyleProps, defineSection, EMPTY_MIXED_KEYS } from "./_shared";

// ============================================================================
// THE REGISTRY — composed from per-family fragments
// ============================================================================

export const SECTION_REGISTRY: Record<SectionId, AnySectionEntry> = {
  // Style tab
  ...LAYOUT_SECTIONS,
  ...TYPOGRAPHY_SECTIONS,
  ...VISUAL_SECTIONS,
  // Element tab
  ...ELEMENT_SECTIONS,
  // Effects tab
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
    if (entry.advancedKey) {
      map[entry.advancedKey] = getAdvancedPropsForGroup(entry.advancedKey);
    }
  }
  return map;
}
