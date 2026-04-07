/**
 * Panel State Migration Utilities
 * Handles migration from legacy tab structure to new 3-tab grouped structure
 * @license BSD-3-Clause
 */

import type { PanelState } from "./useStudioState";

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
  ai: "add",            // AI merged into Add tab
  // Legacy 3-tab grouped IDs (from prior migration)
  build: "add",
  structure: "layers",
  content: "add",
};

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

  // If the tab ID is already a valid GroupedTabId, keep it
  const VALID_TABS = new Set([
    "add", "templates", "layers", "pages", "components",
    "assets", "design", "settings", "publish", "history",
  ]);
  if (VALID_TABS.has(saved.leftPanelTab)) {
    return saved;
  }

  // Unknown tab ID, default to "add"
  return { ...saved, leftPanelTab: "add" };
}
