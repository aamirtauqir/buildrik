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

  // ─── Build Tab ────────────────────────────────────────────────
  /** Favorite element names in the Build tab */
  BUILD_FAVORITES: "aqb-build-favorites",
  /** Recently used element IDs in the Build tab (max 8) */
  BUILD_RECENT: "aqb-build-recent",
  /** Open category IDs in Build tab accordion (sessionStorage) */
  BUILD_OPEN_CATS: "aqb-build-open-cats",
  /** Whether the onboarding tip in Build tab has been dismissed */
  BUILD_TIP_DISMISSED: "aqb-build-tip-dismissed",
  /** Whether the user has been informed that favorites are browser-local only */
  BUILD_FAVS_INFORMED: "aqb-build-favs-informed",

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
  /** Last applied site-template ID (sessionStorage — survives tab close) */
  APPLIED_TEMPLATE_ID: "aqb-applied-template-id",

  // ─── Media / Assets ───────────────────────────────────────────
  /** Asset library data */
  ASSETS: "aqb-assets",
  /** Copied style (for paste-style functionality) */
  COPIED_STYLE: "aqb-copied-style",
  /** Media library sort field (name | date | size | type) */
  MEDIA_SORT: "med_sort",
  /** Media library sort direction (asc | desc) */
  MEDIA_SORT_DIR: "med_sort_dir",
  /** Media library grid columns (2 | 3 | 4) */
  MEDIA_GRID_N: "med_grid_n",
  /** Media library active type filter (all | img | vid | ico | fnt) */
  MEDIA_ACTIVE_TYPE: "med_active_type",
  /** Whether the media panel tip has been dismissed */
  MEDIA_TIP_DISMISSED: "med_tip_dismissed",
  /** Media library search query persistence */
  MEDIA_LIB_SEARCH: "med_lib_search",
  /** Media discovery search query persistence */
  MEDIA_DISC_SEARCH: "med_disc_search",

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
