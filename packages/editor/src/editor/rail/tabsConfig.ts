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
  | "templates"
  | "layers"
  | "pages"
  | "components"
  | "assets"
  | "design"
  | "settings"
  | "publish"
  | "history"
  | "activity"
  | "review"
  | "content";

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
  /** Whether this tab opens the drawer (width: `--bk-size-drawer`) or replaces
   *  the canvas with a full-page view. */
  mode: TabMode;
  /** Which rail zone this tab appears in. undefined = no rail button (design, publish). */
  zone?: TabZone;
}

// ─── Sidebar Tab Data ─────────────────────────────────────────────────────────

export const GROUPED_TABS_CONFIG: GroupedTabConfig[] = [
  // ── CREATION: content creation tools ───────────────────────────────────────
  {
    id: "add",
    iconName: "Plus",
    // v3 IA (docs/plans/2026-09-14-editor-v3-ia.md Q4): "Add" — the verb the
    // designer thinks in; Blocks and Components live inside this one panel.
    label: "Add",
    ariaLabel: "Add elements, blocks and components to your page",
    section: "top",
    pattern: "card-drill-in",
    shortcut: "A",
    mode: "panel",
    zone: "creation",
  },
  {
    id: "templates",
    iconName: "LayoutGrid",
    label: "Templates",
    ariaLabel: "Browse page and section templates",
    section: "top",
    // 2026-05-22 D2: TemplatesTab already drills in internally
    // (detailTemplate state at TemplatesTab.tsx:113) — was mislabeled
    // as "standalone". Truthful pattern: card-drill-in matches Add +
    // Components for IA symmetry in CREATION zone.
    pattern: "card-drill-in",
    shortcut: "T",
    // Decision #24 (2026-09-21): a full-canvas view, not a 280/700 drawer
    // plus a preview modal (board 4418:54134).
    mode: "fullpage",
    zone: "creation",
  },
  {
    id: "assets",
    iconName: "Image",
    // v3 IA Q4: "Assets" — the Webflow/Framer term; the id already said so.
    label: "Assets",
    ariaLabel: "Upload and manage images, videos, and fonts",
    section: "top",
    pattern: "standalone",
    shortcut: "M",
    mode: "panel",
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
    shortcut: "L",
    mode: "panel",
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
    zone: "structure",
  },
  {
    id: "components",
    iconName: "Box",
    label: "Components",
    ariaLabel: "Create and use reusable components",
    section: "top",
    // 2026-05-22 D2: ComponentsTab already drills in internally
    // (detailComponent state at ComponentsTab.tsx:169) — was mislabeled
    // as "standalone". Truthful pattern: card-drill-in matches Add +
    // Templates for IA symmetry in CREATION zone.
    pattern: "card-drill-in",
    shortcut: "⇧A",
    mode: "panel",
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
    // 2026-07-25 P1 rail convergence: Figma board 52:2 names this rail item
    // "Brand" (tokens + presets + starters + lint = the site's brand system).
    label: "Brand",
    ariaLabel: "Brand — global colors, fonts, spacing tokens",
    section: "bottom",
    pattern: "standalone",
    shortcut: "B",
    // C1 (i), 2026-09-22: the drawer is retired for the full-canvas Brand
    // workspace (Figma 7315:80955 — the owner's single Brand design, OD-1).
    // FullPageRouter mounts it edge-to-edge the way it mounts Settings.
    mode: "fullpage",
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
    // P5: graduated from a 320px drawer to a full-page surface (authoritative
    // IA 14-screen-specs.md:8 — "Site full-page = settings×11 …"). SettingsTab's
    // 140px-snav + 1fr-pane now renders full-width via FullPageRouter; the drawer
    // path is retired.
    mode: "fullpage",
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
    zone: "config",
  },
  {
    // Board 4418:140587 — its own right-column panel (owner, 2026-09-25), not
    // a tab inside History. Off-rail (no `zone`), no shortcut: its doors are
    // the site menu's "Activity log", ⌘K "Open Activity" and the
    // notifications popover's "View all activity ›".
    id: "activity",
    iconName: "Activity",
    label: "Activity",
    ariaLabel: "Site activity — edits, comments and publishes",
    section: "bottom",
    pattern: "standalone",
    mode: "panel",
  },
  {
    // P0 wedge: the editor-side review loop. Sits BELOW a divider, not in the
    // locked 6-tool rail order (cargo-sheets §6.5); agency_layer-gated. No
    // `zone` → the zone-driven rail render leaves it out; the below-divider
    // rail button is a follow-up (the panel is routable today via TabRouter).
    id: "review",
    iconName: "MessageSquare",
    label: "Review",
    ariaLabel: "Client review — comments, approval, and the review link",
    section: "bottom",
    pattern: "standalone",
    shortcut: "R",
    mode: "panel",
  },
  {
    // P4.2 data front-door. Off-rail like review (no `zone`), so it doesn't
    // disturb the locked 6-tool rail order; reachable via ⌘K ("Open Content
    // panel") + routable. The authoritative IA (14-screen-specs.md:8) promotes
    // it to a first-class rail tab in the pending 6-tab redesign.
    id: "content",
    iconName: "LayoutGrid",
    // v3 IA Q4: "CMS" — the panel IS the CMS (collections, records, fields,
    // dynamic pages, sources, {{site.*}} variables). "Content" read as
    // page copy and nobody looked here for collections (Critical UX-F-01).
    label: "CMS",
    ariaLabel: "Collections, records and data sources for dynamic content",
    section: "bottom",
    pattern: "standalone",
    // Keyboard legend 58:215: rail letters are A L P M D B — D opens Content.
    // Bare C toggles comment mode (useEditorShortcuts).
    shortcut: "D",
    mode: "panel",
  },
];

// ─── Tab Lookup Helpers ──────────────────────────────────────────────────────

const TAB_CONFIG_MAP = new Map(GROUPED_TABS_CONFIG.map((t) => [t.id, t]));

/** Get the mode (panel or fullpage) for a given tab */
export function getTabMode(tabId: GroupedTabId): TabMode {
  return TAB_CONFIG_MAP.get(tabId)?.mode ?? "panel";
}

/** Get full config for a tab by id */
export function getTabConfig(tabId: GroupedTabId): GroupedTabConfig | undefined {
  return TAB_CONFIG_MAP.get(tabId);
}

// ─── Figma-contract rail (F1) ─────────────────────────────────────────────────
//
// P1 rail convergence (2026-07-25): the live Figma board `S1 · Editor —
// ASSEMBLED` (g4GzQFqzNYz5sosz1QtZXC node 52:2, rail frame 52:6) draws SIX
// rail items in ONE group — no divider, 48px pitch, icon + visible label:
//
//   Insert · Layers · Pages · Media · Content · Brand
//
// v3 IA (2026-09-14, page 4418:45431): same six ids, three labels renamed —
// Add · Layers · Pages · Assets · CMS · Brand. The rail component set there
// (4418:144790) is the visual source; the ids never changed.
//
// (The previous 5-item Add/Assets/Components + Layers/Pages reading came from
// an incomplete fetch of the design file — see feedback_figma_page_list_unreliable.)
//
// The panels that leave the rail keep their engine + panel intact and are
// reachable off-rail (verified entry points, so nothing is stranded):
//   ai         → contextual: canvas selection ✨ + ⌘K command palette
//   templates  → Pages panel "From template" (new-page flow) + ⌘K + shortcut T
//   components → shortcut ⇧A + ⌘K ("Open Components panel"); folds into
//                Brand · components per the design in a later phase
//   settings   → topbar ⋯ site menu ("Site settings")
//   publish    → topbar Publish button
//   history    → topbar ⋯ site menu ("Version history")
//
// It is the one rail (the legacy zone rail and the E3 tool rail were deleted
// with C5 G1-095). It reads GROUPED_TABS_CONFIG and never mutates it.

/** The six rail items of the Figma contract, in board 52:2 order, one group. */
export const RAIL_FIGMA: ReadonlyArray<{ zone: TabZone; ids: readonly GroupedTabId[] }> = [
  { zone: "creation", ids: ["add", "layers", "pages", "assets", "content", "design"] },
] as const;

/** Flat set of tab ids that appear in the Figma rail (for filtering / tests). */
export const RAIL_FIGMA_IDS: ReadonlySet<GroupedTabId> = new Set(
  RAIL_FIGMA.flatMap((g) => g.ids),
);

/**
 * The Figma rail as ordered groups of resolved tab configs. Each group is one
 * visual cluster in the rail (a divider sits between groups). Unknown ids are
 * dropped defensively so a config typo can't crash the rail.
 */
export function getFigmaRailGroups(): Array<{ zone: TabZone; tabs: GroupedTabConfig[] }> {
  return RAIL_FIGMA.map((g) => ({
    zone: g.zone,
    tabs: g.ids.map((id) => TAB_CONFIG_MAP.get(id)).filter((t): t is GroupedTabConfig => Boolean(t)),
  }));
}
