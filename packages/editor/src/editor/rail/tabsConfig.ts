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
    panelWidth: 280,
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
    panelWidth: 320,
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
    panelWidth: 320,
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
    panelWidth: 320,
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
    shortcut: "Z",
    mode: "panel",
    panelWidth: 280,
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
    panelWidth: 280,
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
    tool: "styles",
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
    tool: "site",
    iconName: "Settings",
    label: "Settings",
    ariaLabel: "Site config, SEO, export, publish",
    section: "bottom",
    pattern: "card-drill-in",
    shortcut: "S",
    mode: "panel",
    // 2026-05-22 design plan review D1: normalized 700px outlier → 320px.
    // Matches Media + Design + AI + Templates panel widths. Drill-in
    // pattern stays — root shows category cards, drilled-in screens
    // (SEO, Headers, Redirects, Locale) wrap form fields to the narrower
    // 320px column.
    panelWidth: 320,
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
    panelWidth: 280,
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
// The 02 · Editor Figma design (2026-07) supersedes the E3 4-tool rail: the rail
// carries five first-class tools grouped into two zones, and everything else
// leaves the rail entirely.
//
//   creation   Add · Assets · Components
//   structure  Layers · Pages
//
// The six panels that leave the rail keep their engine + panel intact and are
// reachable off-rail (verified entry points, so nothing is stranded):
//   ai        → contextual: canvas selection + ⌘K command palette
//   templates → inside the Add drawer ("Browse templates")
//   design    → topbar ⋯ site menu ("Design system")
//   settings  → topbar ⋯ site menu ("Site settings")
//   publish   → topbar Publish button
//   history   → topbar ⋯ site menu ("History")
//
// This is a THIRD render source alongside the zone rail (legacy) and the tool
// rail (E3). All three read GROUPED_TABS_CONFIG; none of them mutate it. Which
// one renders is chosen by editorViewMode.railMode ("figma" is the default).

/** The five rail tools of the Figma contract, in rail order, grouped by zone. */
export const RAIL_FIGMA: ReadonlyArray<{ zone: Extract<TabZone, "creation" | "structure">; ids: readonly GroupedTabId[] }> = [
  { zone: "creation", ids: ["add", "assets", "components"] },
  { zone: "structure", ids: ["layers", "pages"] },
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
