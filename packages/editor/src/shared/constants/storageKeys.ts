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
  CURRENT_PROJECT: "buildrick-project",
  /** Draft / autosave data (unsaved changes) */
  AUTOSAVE: "buildrick-autosave",
  /** Last opened file path / ID */
  LAST_FILE: "buildrick-last-file",

  // ─── User Preferences ─────────────────────────────────────────
  /** User general preferences (theme, language, etc.) */
  PREFERENCES: "buildrick-preferences",
  /** License key */
  LICENSE_KEY: "buildrick-license",
  /** Recent projects list */
  RECENT_PROJECTS: "buildrick-recent-projects",

  // ─── Panel / Layout State ─────────────────────────────────────
  /** Panel layout configuration (open/closed, widths) */
  PANEL_LAYOUT: "buildrick-panels",
  /** Panel state (active tabs, pin state) */
  PANEL_STATE: "buildrick-panel-state",

  // ─── Canvas Controls ──────────────────────────────────────────
  /** Saved canvas guides (horizontal/vertical guide positions) */
  GUIDES: "buildrick-guides",
  /** Inspector mode enabled/disabled */
  INSPECTOR_MODE: "buildrick-inspector-mode",
  /** Recent commands from command palette */
  RECENT_COMMANDS: "buildrick-recent-commands",

  // ─── Elements Tab ─────────────────────────────────────────────
  /** Recently used element types */
  ELEMENTS_RECENT: "buildrick-elements-recent",
  /** Favorite element types */
  ELEMENTS_FAVORITES: "buildrick-elements-favorites",
  /** Whether the "getting started" tip in elements panel is dismissed */
  ELEMENTS_TIP_DISMISSED: "buildrick-elements-tip-dismissed",
  /** Which element category is expanded in the panel */
  ELEMENTS_EXPANDED_CATEGORY: "buildrick-elements-expanded-category",

  // ─── Build Tab ────────────────────────────────────────────────
  /** Favorite element names in the Build tab */
  BUILD_FAVORITES: "buildrick-build-favorites",
  /** Recently used element IDs in the Build tab (max 8) */
  BUILD_RECENT: "buildrick-build-recent",
  /** Open category IDs in Build tab accordion (sessionStorage) */
  BUILD_OPEN_CATS: "buildrick-build-open-cats",
  /** Whether the onboarding tip in Build tab has been dismissed */
  BUILD_TIP_DISMISSED: "buildrick-build-tip-dismissed",
  /** Whether the user has been informed that favorites are browser-local only */
  BUILD_FAVS_INFORMED: "buildrick-build-favs-informed",
  /** @deprecated — Sections mode removed 2026-04-23. Cleaned on next read of BUILD_OPEN_CATS. */
  BUILD_MODE: "buildrick-build-mode",
  /** @deprecated — Quick Picks removed in v4. Cleaned on TransitionCallout dismiss. */
  BUILD_PICKS: "buildrick-build-picks",
  /** @deprecated — Quick Picks FTUE removed in v4. Cleaned on TransitionCallout dismiss. */
  BUILD_FTUE_SEEN: "buildrick-build-ftue-seen",
  /** One-time flag: user has seen the "Quick Picks removed" v4 transition callout */
  BUILD_V4_TRANSITION_SEEN: "buildrick-build-v4-transition-seen",

  // ─── Components Tab ───────────────────────────────────────────
  /** Favorite component IDs in the components library */
  COMPONENT_FAVORITES: "buildrick-component-favorites",

  // ─── Templates Tab ────────────────────────────────────────────
  /** Recently used template IDs */
  RECENT_TEMPLATES: "buildrick-recent-templates",
  /** User-saved section templates */
  MY_TEMPLATES: "buildrick-my-templates",
  /** Last applied site-template ID (sessionStorage — survives tab close) */
  APPLIED_TEMPLATE_ID: "buildrick-applied-template-id",

  // ─── Media / Assets ───────────────────────────────────────────
  /** Asset library data */
  ASSETS: "buildrick-assets",
  /** Copied style (for paste-style functionality) */
  COPIED_STYLE: "buildrick-copied-style",
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
  HISTORY: "buildrick-history",
  /** AI assistant conversation context */
  AI_CONTEXT: "buildrick-ai-context",

  // ─── Clipboard ────────────────────────────────────────────────
  /** Clipboard data (copied elements) */
  CLIPBOARD: "buildrick-clipboard",

  // ─── Onboarding ───────────────────────────────────────────────
  /** Center modal — shown once on first visit */
  ONBOARDING_MODAL: "buildrick-onboarding-modal",
  /** Spotlight tour — v2 key forces reset for users with old tour state */
  ONBOARDING_TOUR: "buildrick-onboarding-tour-v2",
  /** Get-started checklist step progress (JSON array of OnboardingStep) */
  ONBOARDING_PROGRESS: "buildrick-onboarding-progress",
  /** Whether the checklist widget has been dismissed */
  ONBOARDING_DISMISSED: "buildrick-onboarding-dismissed",
  /** Schema version — bump when DEFAULT_STEPS changes to clear stale data */
  ONBOARDING_SCHEMA_VERSION: "buildrick-onboarding-schema-v",
  /** Current onboarding phase — "modal" | "tour" | "checklist" | "done" */
  ONBOARDING_PHASE: "buildrick-onboarding-phase",
  /** Current tour step index (0-based) — persisted so refresh resumes same step */
  ONBOARDING_TOUR_STEP: "buildrick-onboarding-tour-step",
  /** Whether user has named their project during onboarding */
  ONBOARDING_PROJECT_NAMED: "buildrick-onboarding-project-named",

  // ─── Integrations ─────────────────────────────────────────────
  /** Vercel deployment token (encrypted) */
  VERCEL_TOKEN: "buildrick-vercel-token",

  // ─── Debug (dev-only) ─────────────────────────────────────────
  /** Canvas debug logs */
  DEBUG_LOGS: "buildrick-canvas-logs",
  /** Debug mode settings */
  DEBUG_SETTINGS: "buildrick-debug-settings",

  // ─── Migration ────────────────────────────────────────────────
  /** Flag set when the v1 storage key migration has completed */
  MIGRATION_FLAG_V1: "aqb-migration-v1-complete",
  /** V3 theme rename migration completion marker */
  AQB_MIGRATION_FLAG_V1: "buildrick-aqb-migration-v1-complete",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
