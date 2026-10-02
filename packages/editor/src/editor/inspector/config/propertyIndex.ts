/**
 * Property index — G2-146 (owner decision 2026-09-25): the rows ⌘K "Jump to
 * property" offers for the selected element, built from the inspector's own
 * section registry (title, tab, styleKeys), the tab orders and the type's
 * capabilities, so a section added to the registry is searchable with no
 * list to keep.
 *
 * @license BSD-3-Clause
 */
import { INSPECTOR_TABS, SECTION_REGISTRY, type SectionId, type TabId } from "../sections/registry";
import { SECTION_ORDER } from "./sectionOrder";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";

export interface PropertyIndexRow {
  /** "Padding", "Opacity" */
  label: string;
  /** "Style › Spacing" for a property, "Effects" for a section. */
  path: string;
  section: SectionId;
  tab: TabId;
  /** The CSS property the row stands for; absent on a section row. */
  property?: string;
}

/** `box-shadow` → `Box shadow`. */
const humanize = (prop: string) => {
  const words = prop.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export function buildPropertyIndex(elementType: string): PropertyIndexRow[] {
  const rows: PropertyIndexRow[] = [];
  const seen = new Set<string>();
  const add = (row: PropertyIndexRow) => {
    const key = row.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };
  const caps = capabilitiesFor(elementType);
  for (const { id: tab, label: tabLabel } of INSPECTOR_TABS) {
    for (const section of SECTION_ORDER[tab]) {
      const entry = SECTION_REGISTRY[section];
      if (entry.capability && !entry.capability(caps)) continue;
      add({ label: entry.title, path: tabLabel, section, tab });
      for (const property of entry.styleKeys) {
        if (property.startsWith("--")) continue;
        add({ label: humanize(property), path: `${tabLabel} › ${entry.title}`, section, tab, property });
      }
    }
  }
  return rows;
}
