/**
 * Tab Configuration — canonical source of truth.
 *
 * GROUPED_TABS_CONFIG — 11 sidebar panel definitions (shortcuts, mode, width, zone)
 *
 * Tabs with a `zone` appear as rail buttons in that zone.
 * Tabs without a zone (design, publish) are not in the rail.
 *
 * @license BSD-3-Clause
 */

// ─── Tab Types ────────────────────────────────────────────────────────────────

export type GroupedTabId =
  | "add"
  | "ai"
  | "templates"
  | "layers"
  | "pages"
  | "components"
  | "assets"
  | "design"
  | "settings"
  | "publish"
  | "history";

export type TabSection = "top" | "bottom";
export type TabPattern = "card-drill-in" | "standalone";
export type TabMode = "panel" | "fullpage";
export type TabZone = "creation" | "structure" | "config";

/** Sidebar panel definition — purely about the panel content. */
export interface GroupedTabConfig {
  id: GroupedTabId;
  iconName: string;
  label: string;
  ariaLabel: string;
  section: TabSection;
  pattern: TabPattern;
  shortcut?: string;
  accent?: boolean;
  /** Whether this tab opens a 280px panel or replaces the canvas with a full-page view */
  mode: TabMode;
  /** Panel width in pixels (only for mode="panel"). Defaults to 280 if omitted.
   *
   *  Width rule (locked 2026-05-22):
   *   - 280  → list/tree surfaces (Layers, Pages, Add, Components, Publish, History)
   *   - 320  → browse / canvas-rich surfaces (AI conversation, Templates, Media, Design)
   *   - mode="fullpage" → workflow surfaces (Settings — too page-shaped for a drawer)
   *
   *  New tabs MUST pick one of these widths OR document why they're an
   *  exception. The 700px Settings outlier is the historical reason this
   *  rule exists. */
  panelWidth?: number;
  /** Which rail zone this tab appears in. undefined = no rail button (design, publish). */
  zone?: TabZone;
}

// ─── Sidebar Tab Data ─────────────────────────────────────────────────────────

export const GROUPED_TABS_CONFIG: GroupedTabConfig[] = [
  // ── CREATION: content creation tools ───────────────────────────────────────
  {
    id: "add",
    iconName: "Plus",
    label: "Add",
    ariaLabel: "Add elements and sections to your page",
    section: "top",
    pattern: "card-drill-in",
    shortcut: "A",
    mode: "panel",
    panelWidth: 280,
    zone: "creation",
  },
  {
    id: "ai",
    iconName: "Sparkles",
    label: "AI",
    ariaLabel: "AI assistant — chat with Claude to edit elements",
    section: "top",
    pattern: "standalone",
    shortcut: "I",
    mode: "panel",
    panelWidth: 320,
    zone: "creation",
  },
  {
    id: "templates",
    iconName: "LayoutGrid",
    label: "Templates",
    ariaLabel: "Browse page and section templates",
    section: "top",
    pattern: "standalone",
    shortcut: "T",
    mode: "panel",
    panelWidth: 320,
    zone: "creation",
  },
  {
    id: "assets",
    iconName: "Image",
    label: "Media",
    ariaLabel: "Upload and manage images, videos, and fonts",
    section: "top",
    pattern: "standalone",
    shortcut: "M",
    mode: "panel",
    panelWidth: 320,
    zone: "creation",
  },
  // ── STRUCTURE: page organization ───────────────────────────────────────────
  {
    id: "layers",
    iconName: "Layers",
    label: "Layers",
    ariaLabel: "View and reorder page structure",
    section: "top",
    pattern: "standalone",
    shortcut: "Z",
    mode: "panel",
    panelWidth: 280,
    zone: "structure",
  },
  {
    id: "pages",
    iconName: "File",
    label: "Pages",
    ariaLabel: "Manage all pages in your site",
    section: "top",
    pattern: "standalone",
    shortcut: "P",
    mode: "panel",
    panelWidth: 280,
    zone: "structure",
  },
  {
    id: "components",
    iconName: "Box",
    label: "Components",
    ariaLabel: "Create and use reusable components",
    section: "top",
    pattern: "standalone",
    shortcut: "⇧A",
    mode: "panel",
    panelWidth: 280,
    // Reclassified 2026-05-22: Components is a library (browse + insert
    // reusable patterns) — same mental class as Add/Templates. Moved to
    // CREATION zone for IA symmetry. Previously labeled "Comps" (truncated)
    // with Diamond icon (opaque); now full name + Box icon.
    zone: "creation",
  },
  // ── CONFIG: site configuration ─────────────────────────────────────────────
  {
    id: "design",
    iconName: "Palette",
    label: "Design",
    ariaLabel: "Global colors, fonts, spacing tokens",
    section: "bottom",
    pattern: "standalone",
    shortcut: "D",
    mode: "panel",
    panelWidth: 320,
    zone: "config",
  },
  {
    id: "settings",
    iconName: "Settings",
    label: "Settings",
    ariaLabel: "Site config, SEO, export, publish",
    section: "bottom",
    pattern: "card-drill-in",
    shortcut: "S",
    mode: "panel",
    panelWidth: 700,
    zone: "config",
  },
  {
    id: "publish",
    iconName: "Rocket",
    label: "Publish",
    ariaLabel: "Publish and deploy your site",
    section: "bottom",
    pattern: "standalone",
    shortcut: "U",
    mode: "panel",
    panelWidth: 280,
    // Classified 2026-05-22: publish is the user's GOAL after building, not
    // a config-tier concern. Stays bottom-section visually (alongside
    // Settings + History) but joins CONFIG zone for taxonomy. If we add a
    // dedicated "deploy" zone later this moves.
    zone: "config",
  },
  {
    id: "history",
    iconName: "Timer",
    label: "History",
    ariaLabel: "Version history and edit activity",
    section: "bottom",
    pattern: "standalone",
    shortcut: "H",
    mode: "panel",
    panelWidth: 280,
    zone: "config",
  },
];

// ─── Tab Lookup Helpers ──────────────────────────────────────────────────────

const TAB_CONFIG_MAP = new Map(GROUPED_TABS_CONFIG.map((t) => [t.id, t]));

/** Get the mode (panel or fullpage) for a given tab */
export function getTabMode(tabId: GroupedTabId): TabMode {
  return TAB_CONFIG_MAP.get(tabId)?.mode ?? "panel";
}

/** Get the panel width for a given tab (only meaningful for panel-mode tabs) */
export function getTabWidth(tabId: GroupedTabId): number {
  return TAB_CONFIG_MAP.get(tabId)?.panelWidth ?? 280;
}

/** Get full config for a tab by id */
export function getTabConfig(tabId: GroupedTabId): GroupedTabConfig | undefined {
  return TAB_CONFIG_MAP.get(tabId);
}

/** Get all tabs that belong to a specific rail zone */
export function getTabsByZone(zone: TabZone): GroupedTabConfig[] {
  return GROUPED_TABS_CONFIG.filter((t) => t.zone === zone);
}
