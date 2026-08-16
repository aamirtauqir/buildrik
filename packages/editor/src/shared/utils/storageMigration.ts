/**
 * Storage Migration Utility
 * Migrates localStorage keys from `aquibra-` prefix to standardized `aqb-` prefix
 * @license BSD-3-Clause
 */

import { STORAGE_KEYS } from "../constants/storageKeys";
import { devLog } from "./devLogger";

/**
 * Migration map: old key → new key
 * New keys reference STORAGE_KEYS constants (single source of truth).
 */
const MIGRATION_MAP: Record<string, string> = {
  // Project data
  "aquibra-project": STORAGE_KEYS.CURRENT_PROJECT,
  "aquibra-preferences": STORAGE_KEYS.PREFERENCES,
  "aquibra-recent-projects": STORAGE_KEYS.RECENT_PROJECTS,
  "aquibra-panels": STORAGE_KEYS.PANEL_LAYOUT,
  "aquibra-panel-state": STORAGE_KEYS.PANEL_STATE,
  "aquibra-last-file": STORAGE_KEYS.LAST_FILE,
  "aquibra-clipboard": STORAGE_KEYS.CLIPBOARD,
  "aquibra-history": STORAGE_KEYS.HISTORY,
  "aquibra-autosave": STORAGE_KEYS.AUTOSAVE,
  "aquibra-ai-context": STORAGE_KEYS.AI_CONTEXT,
  "aquibra-license": STORAGE_KEYS.LICENSE_KEY,
  "aquibra-onboarding": STORAGE_KEYS.ONBOARDING_MODAL,
  "aquibra-my-templates": STORAGE_KEYS.MY_TEMPLATES,
  "aquibra-assets": STORAGE_KEYS.ASSETS,

  // Canvas controls
  "aquibra-guides": STORAGE_KEYS.GUIDES,
  "aquibra-inspector-mode": STORAGE_KEYS.INSPECTOR_MODE,
  "aquibra-recent-commands": STORAGE_KEYS.RECENT_COMMANDS,

  // Elements tab
  "aquibra-elements-recent": STORAGE_KEYS.ELEMENTS_RECENT,
  "aquibra-elements-favorites": STORAGE_KEYS.ELEMENTS_FAVORITES,
  "aquibra-elements-tip-dismissed": STORAGE_KEYS.ELEMENTS_TIP_DISMISSED,
  "aquibra-elements-expanded-category": STORAGE_KEYS.ELEMENTS_EXPANDED_CATEGORY,

  // Build tab
  bld_favs: STORAGE_KEYS.BUILD_FAVORITES,

  // Components tab
  "aquibra-component-favorites": STORAGE_KEYS.COMPONENT_FAVORITES,

  // Templates (note: uses underscore in old keys)
  aquibra_recent_templates: STORAGE_KEYS.RECENT_TEMPLATES,
  "aquibra-saved-templates": STORAGE_KEYS.MY_TEMPLATES,

  // Services (note: uses underscore in old key)
  aquibra_vercel_token: STORAGE_KEYS.VERCEL_TOKEN,
};

/**
 * Migrate localStorage keys from old prefix to new prefix
 * Preserves data by copying to new key, then removing old key
 * Safe to call multiple times - only runs once per browser
 */
export function migrateStorageKeys(): void {
  // Check if already migrated
  if (localStorage.getItem(STORAGE_KEYS.MIGRATION_FLAG_V1)) {
    return;
  }

  let migratedCount = 0;

  Object.entries(MIGRATION_MAP).forEach(([oldKey, newKey]) => {
    try {
      const value = localStorage.getItem(oldKey);
      if (value !== null && !localStorage.getItem(newKey)) {
        // Copy to new key
        localStorage.setItem(newKey, value);
        // Remove old key
        localStorage.removeItem(oldKey);
        migratedCount++;
      }
    } catch {
      // Silently fail for individual keys (localStorage may be full or disabled)
    }
  });

  // Mark migration complete
  try {
    localStorage.setItem(STORAGE_KEYS.MIGRATION_FLAG_V1, Date.now().toString());
  } catch {
    // Storage may be full
  }

  if (migratedCount > 0) {
    devLog("Storage", `Migrated ${migratedCount} localStorage keys to new format`);
  }
}

// V3 theme rename: aqb-* → buildrick-* (per scripts/theme-v3-mapping.json#storage_keys)
const AQB_TO_BUILDRICK_STORAGE_MAP: Record<string, string> = {
  "aqb-project": "buildrick-project",
  "aqb-autosave": "buildrick-autosave",
  "aqb-last-file": "buildrick-last-file",
  "aqb-preferences": "buildrick-preferences",
  "aqb-license": "buildrick-license",
  "aqb-recent-projects": "buildrick-recent-projects",
  "aqb-panels": "buildrick-panels",
  "aqb-panel-state": "buildrick-panel-state",
  "aqb-guides": "buildrick-guides",
  "aqb-inspector-mode": "buildrick-inspector-mode",
  "aqb-recent-commands": "buildrick-recent-commands",
  "aqb-quick-switcher-recent": "buildrick-quick-switcher-recent",
  "aqb-saved-templates": "buildrick-saved-templates",
  "aqb-elements-recent": "buildrick-elements-recent",
  "aqb-elements-favorites": "buildrick-elements-favorites",
  "aqb-elements-tip-dismissed": "buildrick-elements-tip-dismissed",
  "aqb-elements-expanded-category": "buildrick-elements-expanded-category",
  "aqb-recent-templates": "buildrick-recent-templates",
  "aqb-my-templates": "buildrick-my-templates",
  "aqb-component-favorites": "buildrick-component-favorites",
  "aqb-sidebar-state": "buildrick-sidebar-state",
  "aqb-inspector-sections": "buildrick-inspector-sections",
  "aqb-inspector-sections-v2": "buildrick-inspector-sections-v2",
  "aqb-history": "buildrick-history",
  "aqb-ai-context": "buildrick-ai-context",
  "aqb-clipboard": "buildrick-clipboard",
  "aqb-assets": "buildrick-assets",
  "aqb-copied-style": "buildrick-copied-style",
  "aqb-vercel-token": "buildrick-vercel-token",
  "aqb-canvas-logs": "buildrick-canvas-logs",
  "aqb-debug-settings": "buildrick-debug-settings",
  "aqb-last-applied-template": "buildrick-last-applied-template",
  "aqb-recent-icons": "buildrick-recent-icons",
  "aqb-layers-display-prefs": "buildrick-layers-display-prefs",
};

const EXCLUDED_AQB_PREFIXES = [
  "aqb-migration-v1-complete",
  "aqb-migration-v1-timestamp",
];

/**
 * V3 theme rename migration: migrates aqb-* localStorage keys to buildrick-*.
 * Mirrors migrateStorageKeys safety model: per-key try/catch, !localStorage.getItem(newKey) guard,
 * completion flag under new prefix (so dynamic loop can't mirror it).
 * Preserves user state across the rename.
 */
export function migrateAqbKeys(): void {
  if (localStorage.getItem(STORAGE_KEYS.AQB_MIGRATION_FLAG_V1)) return;

  let migratedCount = 0;

  // Static map pass
  Object.entries(AQB_TO_BUILDRICK_STORAGE_MAP).forEach(([oldKey, newKey]) => {
    try {
      const value = localStorage.getItem(oldKey);
      if (value !== null && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(oldKey);
        migratedCount++;
      }
    } catch {
      // localStorage may be full or disabled — fail silently
    }
  });

  // Dynamic-key families (aqb-nav-*, aqb-layers-${pageId}-*, aqb-design-tokens-${projectId}-v1)
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k) keys.push(k);
  }
  for (const key of keys) {
    if (!key.startsWith("aqb-")) continue;
    if (EXCLUDED_AQB_PREFIXES.includes(key)) continue;
    const newKey = "buildrick-" + key.slice("aqb-".length);
    try {
      const value = localStorage.getItem(key);
      if (value !== null && !localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, value);
        localStorage.removeItem(key);
        migratedCount++;
      }
    } catch { /* silent */ }
  }

  try {
    localStorage.setItem(STORAGE_KEYS.AQB_MIGRATION_FLAG_V1, Date.now().toString());
  } catch {
    // storage full
  }

  if (migratedCount > 0) {
    devLog("Storage", `Migrated ${migratedCount} localStorage keys from aqb-* to buildrick-*`);
  }
}

export default migrateStorageKeys;
