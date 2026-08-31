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
  | "history"
  | "review"
  | "content";

export type TabSection = "top" | "bottom";
export type TabPattern = "card-drill-in" | "standalone";
export type TabMode = "panel" | "fullpage";
export type TabZone = "creation" | "structure" | "config";

/**
 * E3 target IA — the 11 panel tabs collapse to 4 structural rail tools, plus two
 * non-rail homes. This field is the SSOT for that mapping: it records each tab's
 * new home WITHOUT changing today's rail (the `zone`-driven render is untouched),
 * so the rail rebuild lands on an explicit, tested map — "map every tab to its
 * new home first; re-route UI, never delete engine features" (spec E3).
 *
 *   insert    — add / build content: elements, sections, templates, components, media
 *   pages     — page management
 *   styles    — global design tokens (colors, fonts, spacing)
 *   site      — site config, publish, version history
 *   assistant — AI moves to a top-right ✨ panel, not a rail tab
 *   structure — layers/outline moves to a footer ⌗ floating popover
 */
export type RailTool = "insert" | "pages" | "styles" | "site" | "assistant" | "structure";

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
  /** E3 target home — which of the 4 rail tools (or assistant/structure) this tab folds into. */
  tool: RailTool;
}

// ─── Sidebar Tab Data ─────────────────────────────────────────────────────────

export const GROUPED_TABS_CONFIG: GroupedTabConfig[] = [
  // ── CREATION: content creation tools ───────────────────────────────────────
  {
    id: "add",
    tool: "insert",
    iconName: "Plus",
    label: "Insert",
    ariaLabel: "Insert elements and sections into your page",
    section: "top",
    pattern: "card-drill-in",
    shortcut: "A",
    mode: "panel",
    zone: "creation",
  },
  {
    id: "ai",
    tool: "assistant",
    iconName: "Sparkles",
    label: "AI",
    ariaLabel: "AI assistant — chat with Claude to edit elements",
    section: "top",
    pattern: "standalone",
    shortcut: "I",
    mode: "panel",
    zone: "creation",
  },
  {
    id: "templates",
    tool: "insert",
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
    mode: "panel",
    zone: "creation",
  },
  {
    id: "assets",
    tool: "insert",
    iconName: "Image",
    label: "Media",
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
    tool: "structure",
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
    tool: "pages",
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
    tool: "insert",
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
    tool: "styles",
    iconName: "Palette",
    // 2026-07-25 P1 rail convergence: Figma board 52:2 names this rail item
    // "Brand" (tokens + presets + starters + lint = the site's brand system).
    label: "Brand",
    ariaLabel: "Brand — global colors, fonts, spacing tokens",
    section: "bottom",
    pattern: "standalone",
    shortcut: "B",
    mode: "panel",
    zone: "config",
  },
  {
    id: "settings",
    tool: "site",
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
    tool: "site",
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
    tool: "site",
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
    // P0 wedge: the editor-side review loop. Sits BELOW a divider, not in the
    // locked 6-tool rail order (cargo-sheets §6.5); agency_layer-gated. No
    // `zone` → the zone-driven rail render leaves it out; the below-divider
    // rail button is a follow-up (the panel is routable today via TabRouter).
    id: "review",
    tool: "site",
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
    tool: "site",
    iconName: "LayoutGrid",
    label: "Content",
    ariaLabel: "Data sources and collections for dynamic content",
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

/** Get all tabs that belong to a specific rail zone */
export function getTabsByZone(zone: TabZone): GroupedTabConfig[] {
  return GROUPED_TABS_CONFIG.filter((t) => t.zone === zone);
}

/** The 4 structural rail tools, in rail order (E3 target). assistant + structure
 *  are deliberately excluded — they live in the topbar (✨) and footer (⌗). */
export const RAIL_TOOLS: readonly RailTool[] = ["insert", "pages", "styles", "site"] as const;

/** Get all panel tabs that fold into a given E3 tool/home. */
export function getTabsByTool(tool: RailTool): GroupedTabConfig[] {
  return GROUPED_TABS_CONFIG.filter((t) => t.tool === tool);
}

export type RailToolPlacement = "rail" | "topbar" | "footer";

export interface RailToolMeta {
  label: string;
  iconName: string;
  ariaLabel: string;
  /** Where the entry-point lives: the 4 tools in the left rail, AI in the
   *  topbar (✨), structure in the footer (⌗). */
  placement: RailToolPlacement;
}

/**
 * Render SSOT for the E3 rail. The rail rebuild reads this — it does NOT
 * re-derive labels/icons. Keeps the 4-tool rail, the topbar assistant, and the
 * footer structure popover describing themselves from one place. Pure data; no
 * behaviour wired yet (the live rail still renders from GROUPED_TABS_CONFIG).
 */
export const RAIL_TOOL_META: Record<RailTool, RailToolMeta> = {
  insert: { label: "Insert", iconName: "Plus", ariaLabel: "Insert elements, sections, templates, components, and media", placement: "rail" },
  pages: { label: "Pages", iconName: "File", ariaLabel: "Manage the pages in your site", placement: "rail" },
  styles: { label: "Styles", iconName: "Palette", ariaLabel: "Global colors, fonts, and spacing", placement: "rail" },
  site: { label: "Site", iconName: "Settings", ariaLabel: "Site settings, publish, and version history", placement: "rail" },
  assistant: { label: "Ask AI", iconName: "Sparkles", ariaLabel: "AI assistant", placement: "topbar" },
  structure: { label: "Structure", iconName: "Layers", ariaLabel: "Page structure outline", placement: "footer" },
};

/** The 4 rail tools, in order, each paired with its render metadata. */
export function getRailTools(): Array<{ tool: RailTool; meta: RailToolMeta }> {
  return RAIL_TOOLS.map((tool) => ({ tool, meta: RAIL_TOOL_META[tool] }));
}

// ─── Figma-contract rail (F1) ─────────────────────────────────────────────────
//
// P1 rail convergence (2026-07-25): the live Figma board `S1 · Editor —
// ASSEMBLED` (g4GzQFqzNYz5sosz1QtZXC node 52:2, rail frame 52:6) draws SIX
// rail items in ONE group — no divider, 48px pitch, icon + visible label:
//
//   Insert · Layers · Pages · Media · Content · Brand
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
// This is a THIRD render source alongside the zone rail (legacy) and the tool
// rail (E3). All three read GROUPED_TABS_CONFIG; none of them mutate it. Which
// one renders is chosen by editorViewMode.railMode ("figma" is the default).

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
