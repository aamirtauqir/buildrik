/**
 * Storage Keys — Single Source of Truth
 * All localStorage / sessionStorage key strings used across the editor.
 *
 * Keys follow the `aqb-` prefix convention introduced in the v1 migration.
 * Legacy `aquibra-` prefixed keys exist only in storageMigration.ts as the
 * "old key" side of the migration map.
 *
 * @license BSD-3-Clause
 */

export const STORAGE_KEYS = {
  // ─── Project ──────────────────────────────────────────────────
  /** Prefix for all project-specific scoped keys */
  PROJECT_PREFIX: "aqb",
  /** Current active project data */
  CURRENT_PROJECT: "aqb-project",
  /** Alias for CURRENT_PROJECT */
  PROJECT_DATA: "aqb-project",
  /** Draft / autosave data (unsaved changes) */
  AUTOSAVE: "aqb-autosave",
  /** Last opened file path / ID */
  LAST_FILE: "aqb-last-file",

  // ─── User Preferences ─────────────────────────────────────────
  /** User general preferences (theme, language, etc.) */
  PREFERENCES: "aqb-preferences",
  /** Alias for PREFERENCES */
  USER_PREFERENCES: "aqb-preferences",
  /** Theme preference (light / dark / system) */
  THEME: "aqb-theme",
  /** License key */
  LICENSE_KEY: "aqb-license",
  /** Recent projects list */
  RECENT_PROJECTS: "aqb-recent-projects",

  // ─── Panel / Layout State ─────────────────────────────────────
  /** Panel layout configuration (open/closed, widths) */
  PANEL_LAYOUT: "aqb-panels",
  /** Panel state (active tabs, pin state) */
  PANEL_STATE: "aqb-panel-state",

  // ─── Canvas Controls ──────────────────────────────────────────
  /** Saved canvas guides (horizontal/vertical guide positions) */
  GUIDES: "aqb-guides",
  /** Inspector mode enabled/disabled */
  INSPECTOR_MODE: "aqb-inspector-mode",
  /** Recent commands from command palette */
  RECENT_COMMANDS: "aqb-recent-commands",

  // ─── Elements Tab ─────────────────────────────────────────────
  /** Recently used element types */
  ELEMENTS_RECENT: "aqb-elements-recent",
  /** Favorite element types */
  ELEMENTS_FAVORITES: "aqb-elements-favorites",
  /** Whether the "getting started" tip in elements panel is dismissed */
  ELEMENTS_TIP_DISMISSED: "aqb-elements-tip-dismissed",
  /** Which element category is expanded in the panel */
  ELEMENTS_EXPANDED_CATEGORY: "aqb-elements-expanded-category",

  // ─── Components Tab ───────────────────────────────────────────
  /** Favorite component IDs in the components library */
  COMPONENT_FAVORITES: "aqb-component-favorites",

  // ─── Templates Tab ────────────────────────────────────────────
  /** Recently used template IDs */
  RECENT_TEMPLATES: "aqb-recent-templates",
  /** User-saved section templates */
  SAVED_TEMPLATES: "aqb-saved-templates",
  /** Alias for SAVED_TEMPLATES */
  MY_TEMPLATES: "aqb-my-templates",

  // ─── Media / Assets ───────────────────────────────────────────
  /** Asset library data */
  ASSETS: "aqb-assets",
  /** Copied style (for paste-style functionality) */
  COPIED_STYLE: "aqb-copied-style",

  // ─── History & AI ─────────────────────────────────────────────
  /** Undo history (if persisted to storage) */
  HISTORY: "aqb-history",
  /** AI assistant conversation context */
  AI_CONTEXT: "aqb-ai-context",

  // ─── Clipboard ────────────────────────────────────────────────
  /** Clipboard data (copied elements) */
  CLIPBOARD: "aqb-clipboard",

  // ─── Onboarding ───────────────────────────────────────────────
  /** Onboarding completion state */
  ONBOARDING: "aqb-onboarding",

  // ─── Integrations ─────────────────────────────────────────────
  /** Vercel deployment token (encrypted) */
  VERCEL_TOKEN: "aqb-vercel-token",

  // ─── Debug (dev-only) ─────────────────────────────────────────
  /** Canvas debug logs */
  DEBUG_LOGS: "aqb-canvas-logs",
  /** Debug mode settings */
  DEBUG_SETTINGS: "aqb-debug-settings",

  // ─── Migration ────────────────────────────────────────────────
  /** Flag set when the v1 storage key migration has completed */
  MIGRATION_FLAG_V1: "aqb-migration-v1-complete",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
