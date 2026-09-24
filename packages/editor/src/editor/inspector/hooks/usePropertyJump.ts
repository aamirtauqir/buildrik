/**
 * usePropertyJump — G2-146 (owner decision 2026-09-25: ⌘K "Jump to property"
 * instead of a search bar in the inspector).
 *
 * Two halves, both scoped to the inspector:
 * - the ⌘K rows: while an element is selected, one registry command per row
 *   of `buildPropertyIndex` ("Padding · Style › Spacing"), in the palette's
 *   PROPERTIES band. No selection, no rows (registration lifetime, the same
 *   guard the Pages panel's rows use).
 * - the reveal: UI_INSPECTOR_FOCUS_SECTION `{ section, property? }` switches
 *   to the section's tab, reveals it (Beginner "Show all" when it is
 *   advanced, its More-settings block when the property lives there),
 *   expands it, scrolls the row into view, focuses its first control and
 *   tints it for a second. The canvas menu's "Add interaction" door uses the
 *   same event without a property.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { SECTION_REGISTRY, type SectionId, type TabId } from "../sections/registry";
import { buildPropertyIndex } from "../config/propertyIndex";
import { getProfileFor, isAdvancedIn } from "../config/elementProfiles";
import type { UseAdvancedSettingsReturn } from "./useAdvancedSettings";

export const PROPERTY_COMMAND_GROUP = "Properties";
export const REVEAL_MS = 1000;

export interface FocusSectionPayload {
  section: SectionId;
  property?: string;
}

const CONTROL = "input:not([type=hidden]), select, textarea";
const FOCUSABLE = `${CONTROL}, button, [tabindex]:not([tabindex="-1"])`;

/** The row a property lives on: a `.bdi-lb` label naming it ("Box shadow"),
 *  else its first word ("Padding" for padding-top), else the section. */
function findPropertyRow(sectionEl: HTMLElement, property?: string): HTMLElement {
  if (!property) return sectionEl;
  const wanted = [property.replace(/-/g, " "), property.split("-")[0]];
  const labels = Array.from(sectionEl.querySelectorAll<HTMLElement>(".bdi-lb, label"));
  for (const w of wanted) {
    const hit = labels.find((l) => l.textContent?.trim().toLowerCase() === w);
    if (hit) return hit.closest<HTMLElement>(".bdi-row-ctrl") ?? hit.parentElement ?? sectionEl;
  }
  return sectionEl;
}

/* G2-146 — the landed row tints for a second. */
const REVEAL_CLASSES = ["tw:bg-[var(--bk-alpha-accent-15)]", "tw:rounded-[var(--bk-radius-sm)]", "tw:transition-colors"];

function revealRow(container: HTMLElement | null, section: SectionId, property?: string): void {
  const sectionEl = container?.querySelector<HTMLElement>(`#inspector-section-${section}`);
  if (!sectionEl) return;
  const row = findPropertyRow(sectionEl, property);
  row.scrollIntoView({ block: "center" });
  /* A section row focuses its first real control, not its header toggle. */
  const control = row.querySelector<HTMLElement>(row === sectionEl ? CONTROL : FOCUSABLE) ?? row.querySelector<HTMLElement>(FOCUSABLE);
  control?.focus({ preventScroll: true });
  row.setAttribute("data-bk-reveal", "");
  row.classList.add(...REVEAL_CLASSES);
  window.setTimeout(() => {
    row.removeAttribute("data-bk-reveal");
    row.classList.remove(...REVEAL_CLASSES);
  }, REVEAL_MS);
}

export interface UsePropertyJumpOptions {
  composer: Composer | null | undefined;
  selectedType: string | null;
  contentRef: React.RefObject<HTMLDivElement | null>;
  setActiveTab: (tab: TabId) => void;
  tier: string;
  setShowAll: (v: boolean) => void;
  expandedSections: Set<string>;
  toggleSection: (elementType: string, sectionId: SectionId) => void;
  advancedState: Pick<UseAdvancedSettingsReturn, "expand">;
}

export function usePropertyJump(o: UsePropertyJumpOptions): void {
  const { composer, selectedType } = o;
  /* The reveal reads the latest state without re-subscribing per render. */
  const latest = React.useRef(o);
  latest.current = o;

  React.useEffect(() => {
    /* Optional: most ProInspector test composers are hand-built stubs with no
       command registry; the real Composer always has one. */
    if (!composer?.commands?.register || !selectedType) return;
    const ids = buildPropertyIndex(selectedType).map((row) => {
      const id = `property-${row.section}-${row.property ?? "section"}`;
      composer.commands.register({
        id,
        label: `${row.label} · ${row.path}`,
        group: PROPERTY_COMMAND_GROUP,
        keywords: ["property", row.property ?? row.label.toLowerCase()],
        run: () => composer.emit(EVENTS.UI_INSPECTOR_FOCUS_SECTION, { section: row.section, property: row.property }),
      });
      return id;
    });
    return () => ids.forEach((id) => composer.commands.unregister(id));
  }, [composer, selectedType]);

  React.useEffect(() => {
    if (!composer || !selectedType) return;
    const focus = ({ section, property }: FocusSectionPayload) => {
      const entry = SECTION_REGISTRY[section];
      if (!entry) return;
      latest.current.setActiveTab(entry.tab);
      /* Next frame: the tab switch has reset Show all (a tab change does). */
      requestAnimationFrame(() => {
        const s = latest.current;
        if (s.tier === "beginner" && isAdvancedIn(getProfileFor(selectedType), section, entry.tier)) s.setShowAll(true);
        if (!s.expandedSections.has(`${selectedType}:${section}`)) s.toggleSection(selectedType, section);
        if (property && entry.advancedKey && entry.advancedProps?.includes(property)) s.advancedState.expand(entry.advancedKey);
        /* Two frames: the expanded body needs a render and a layout. */
        requestAnimationFrame(() => requestAnimationFrame(() => revealRow(latest.current.contentRef.current, section, property)));
      });
    };
    composer.on(EVENTS.UI_INSPECTOR_FOCUS_SECTION, focus);
    return () => {
      composer.off(EVENTS.UI_INSPECTOR_FOCUS_SECTION, focus);
    };
  }, [composer, selectedType]);
}
