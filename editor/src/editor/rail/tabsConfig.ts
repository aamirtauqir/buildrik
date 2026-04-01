/**
 * Tab + Rail Configuration — canonical source of truth.
 *
 * Two separate concerns, two separate arrays:
 *   GROUPED_TABS_CONFIG — 10 sidebar panel definitions (shortcuts live here)
 *   RAIL_SLOTS          — 8 icon rail button definitions (ordered for display)
 *
 * Linked by tabId: clicking a rail button opens its corresponding sidebar tab.
 *
 * @license BSD-3-Clause
 */

// ─── Tab Types ────────────────────────────────────────────────────────────────

export type GroupedTabId =
  | "add"
  | "templates"
  | "layers"
  | "pages"
  | "components"
  | "assets" // top section
  | "design"
  | "settings"
  | "publish"
  | "history"; // bottom section

export type TabSection = "top" | "bottom";
export type TabPattern = "card-drill-in" | "standalone";

/** Sidebar panel definition — purely about the 280px panel, no rail concerns. */
export interface GroupedTabConfig {
  id: GroupedTabId;
  iconName: string;
  label: string;
  ariaLabel: string;
  section: TabSection;
  pattern: TabPattern;
  shortcut?: string;
  accent?: boolean;
}

// ─── Rail Types ───────────────────────────────────────────────────────────────

export type RailZone = "top" | "bottom" | "footer";
export type RailVariant = "rtab" | "rfbtn";

/** A single icon rail button — purely about the 60px nav bar, no sidebar concerns. */
export interface RailSlot {
  tabId: GroupedTabId;
  label: string;
  iconName: string;
  ariaLabel: string;
  zone: RailZone;
  variant: RailVariant;
  toggleMode?: boolean;
  subtitle?: string;
}

// ─── Sidebar Tab Data ─────────────────────────────────────────────────────────

export const GROUPED_TABS_CONFIG: GroupedTabConfig[] = [
  // ── TOP: creation & navigation ──────────────────────────────────────────────
  {
    id: "add",
    iconName: "SvgPlus",
    label: "Add",
    ariaLabel: "Add elements and sections to your page",
    section: "top",
    pattern: "card-drill-in",
    shortcut: "A",
  },
  {
    id: "templates",
    iconName: "SvgTemplates",
    label: "Templates",
    ariaLabel: "Browse page and section templates",
    section: "top",
    pattern: "standalone",
    shortcut: "T",
  },
  {
    id: "layers",
    iconName: "SvgLayers",
    label: "Layers",
    ariaLabel: "View and reorder page structure",
    section: "top",
    pattern: "standalone",
    shortcut: "Z",
  },
  {
    id: "pages",
    iconName: "SvgPages",
    label: "Pages",
    ariaLabel: "Manage all pages in your site",
    section: "top",
    pattern: "standalone",
    shortcut: "P",
  },
  {
    id: "components",
    iconName: "SvgComponents",
    label: "Comps",
    ariaLabel: "Create and use reusable components",
    section: "top",
    pattern: "standalone",
    shortcut: "⇧A",
  },
  {
    id: "assets",
    iconName: "SvgImage",
    label: "Media",
    ariaLabel: "Upload and manage images, videos, and fonts",
    section: "top",
    pattern: "standalone",
    shortcut: "J",
  },
  // ── BOTTOM: configuration ────────────────────────────────────────────────────
  {
    id: "design",
    iconName: "SvgPalette",
    label: "Design",
    ariaLabel: "Global colors, fonts, spacing tokens",
    section: "bottom",
    pattern: "standalone",
    shortcut: "D",
  },
  {
    id: "settings",
    iconName: "SvgSettings",
    label: "Settings",
    ariaLabel: "Site config, SEO, export, publish",
    section: "bottom",
    pattern: "card-drill-in",
    shortcut: "S",
  },
  {
    id: "publish",
    iconName: "SvgRocket",
    label: "Publish",
    ariaLabel: "Publish and deploy your site",
    section: "bottom",
    pattern: "standalone",
    shortcut: "U",
  },
  {
    id: "history",
    iconName: "SvgClock",
    label: "History",
    ariaLabel: "Version history and edit activity",
    section: "bottom",
    pattern: "standalone",
    shortcut: "H",
  },
];

// ─── Rail Button Data ─────────────────────────────────────────────────────────
// Ordered exactly as they appear in the rail (top → bottom).
// Display order within each zone is determined by array position — no sorting needed.
// Shortcuts are intentionally absent here — they live in GROUPED_TABS_CONFIG (SSOT).

// Phase 1a rail: 7 icons — Add, Media, Layers, Pages (top) + Design, Settings (bottom) + Help (footer)
// v2 Task 0D will expand to 8 by adding Templates back to top zone.
export const RAIL_SLOTS: RailSlot[] = [
  // ── TOP zone (4 items) ──────────────────────────────────────────────────────
  {
    tabId: "add",
    label: "Add",
    iconName: "SvgPlus",
    ariaLabel: "Add",
    zone: "top",
    variant: "rtab",
    subtitle: "Add elements and sections",
  },
  {
    tabId: "assets",
    label: "Media",
    iconName: "SvgImage",
    ariaLabel: "Media Library",
    zone: "top",
    variant: "rtab",
    subtitle: "Images, videos, and files",
  },
  {
    tabId: "layers",
    label: "Layers",
    iconName: "SvgLayers",
    ariaLabel: "Layers",
    zone: "top",
    variant: "rtab",
    subtitle: "View and reorder page structure",
  },
  {
    tabId: "pages",
    label: "Pages",
    iconName: "SvgPages",
    ariaLabel: "Pages",
    zone: "top",
    variant: "rtab",
    subtitle: "Manage site pages",
  },
  // ── BOTTOM zone (2 items) ────────────────────────────────────────────────────
  {
    tabId: "design",
    label: "Design",
    iconName: "SvgPalette",
    ariaLabel: "Design System",
    zone: "bottom",
    variant: "rtab",
    subtitle: "Colors, typography, and spacing",
  },
  {
    tabId: "settings",
    label: "Settings",
    iconName: "SvgSettings",
    ariaLabel: "Settings",
    zone: "bottom",
    variant: "rtab",
    subtitle: "Site settings and SEO",
  },
];

// ─── Rail Helper ──────────────────────────────────────────────────────────────

export function getSlotsByZone(zone: RailZone): RailSlot[] {
  return RAIL_SLOTS.filter((s) => s.zone === zone);
}
