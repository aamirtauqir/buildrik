/**
 * Panel State Migration Utilities
 * Handles migration from legacy tab structure to new 3-tab grouped structure
 * @license BSD-3-Clause
 */

import type { PanelState } from "./useStudioState";

// ============================================
// Migration Mapping
// ============================================

/** Migration mapping from legacy tab IDs to grouped structure */
const TAB_MIGRATION: Record<string, { primary: string; sub: string }> = {
  elements: { primary: "build", sub: "elements" },
  components: { primary: "build", sub: "components" },
  templates: { primary: "build", sub: "templates" },
  layers: { primary: "structure", sub: "layers" },
  pages: { primary: "structure", sub: "pages" },
  assets: { primary: "structure", sub: "assets" },
  cms: { primary: "content", sub: "cms" },
  // Legacy tabs moved to global settings menu - default to build/elements
  design: { primary: "build", sub: "elements" }, // Design System now in top bar
  tokens: { primary: "build", sub: "elements" }, // Design Tokens now in top bar
  settings: { primary: "build", sub: "elements" }, // Project Settings now in top bar
  plugins: { primary: "build", sub: "elements" }, // Plugins now in top bar
  history: { primary: "build", sub: "elements" }, // History now in top bar
  publish: { primary: "build", sub: "elements" }, // Publish now in top bar
  deploy: { primary: "build", sub: "elements" }, // Deploy now in top bar
  ai: { primary: "build", sub: "elements" }, // AI Assistant now in top bar
};

// ============================================
// Migration Function
// ============================================

/**
 * Migrate legacy panel state to new grouped structure
 */
export function migrateLegacyPanelState(saved: PanelState): PanelState {
  // If no leftPanelTab, nothing to migrate
  if (!saved.leftPanelTab) {
    return saved;
  }

  // If already has leftPanelSubTabs, already migrated
  if (saved.leftPanelSubTabs) {
    return saved;
  }

  // Look up migration for legacy tab
  const migration = TAB_MIGRATION[saved.leftPanelTab];
  if (migration) {
    return {
      ...saved,
      leftPanelTab: migration.primary,
      leftPanelSubTabs: {
        [migration.primary]: migration.sub,
      },
    };
  }

  // Unknown tab ID, use default
  return {
    ...saved,
    leftPanelTab: "build",
    leftPanelSubTabs: {
      build: "elements",
    },
  };
}
