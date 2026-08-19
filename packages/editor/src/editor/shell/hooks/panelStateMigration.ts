/**
 * Panel State Migration Utilities
 * Handles migration from legacy tab structure to new 3-tab grouped structure
 * @license BSD-3-Clause
 */

import type { PanelState } from "./useStudioState";
import { GROUPED_TABS_CONFIG } from "../../rail/tabsConfig";

/** Every id the tab registry knows about. */
const VALID_TABS = new Set<string>(GROUPED_TABS_CONFIG.map((t) => t.id));

// ============================================
// Migration Mapping
// ============================================

/** Migration mapping from legacy tab IDs to current GroupedTabId values */
const TAB_MIGRATION: Record<string, string> = {
  // Direct mappings — legacy ID → current GroupedTabId
  elements: "add",
  components: "components",
  templates: "templates",
  layers: "layers",
  pages: "pages",
  assets: "assets",
  cms: "add",           // CMS removed, default to Add
  // Legacy tabs that moved to fullpage mode
  design: "design",
  tokens: "design",
  settings: "settings",
  history: "history",
  publish: "publish",
  deploy: "settings",   // Deploy merged into Settings
  plugins: "settings",  // Plugins merged into Settings
  // Legacy 3-tab grouped IDs (from prior migration)
  build: "add",
  structure: "layers",
};

/* `ai` and `content` used to be listed above, mapping to "add" — "AI merged
   into Add tab" and "phantom id from the 3-tab era". Both are real tabs again
   (TabRouter renders `case "ai"` and `case "content"`, the rail registry gives
   them shortcuts I and D), so those mappings did nothing but throw the user
   back to Insert when they reopened the editor with either panel open. */

// ============================================
// Migration Function
// ============================================

/**
 * Migrate legacy panel state to current GroupedTabId values.
 * Handles both old single-tab IDs and the intermediate 3-tab grouped IDs
 * (build/structure/content) that were used briefly before the 10-tab rewrite.
 */
export function migrateLegacyPanelState(saved: PanelState): PanelState {
  if (!saved.leftPanelTab) {
    return saved;
  }

  // Map legacy tab ID to current GroupedTabId
  const mapped = TAB_MIGRATION[saved.leftPanelTab];
  if (mapped) {
    return { ...saved, leftPanelTab: mapped };
  }

  /* Kept if it is a real tab — asked of the registry rather than a second
     hand-written list, which is how `review`, `content` and `ai` came to be
     dropped here: leaving the editor with any of those open reopened it on
     Insert. */
  if (VALID_TABS.has(saved.leftPanelTab)) {
    return saved;
  }

  // Unknown tab ID, default to "add"
  return { ...saved, leftPanelTab: "add" };
}
