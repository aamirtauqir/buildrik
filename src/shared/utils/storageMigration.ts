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
  "aquibra-theme": STORAGE_KEYS.THEME,
  "aquibra-panels": STORAGE_KEYS.PANEL_LAYOUT,
  "aquibra-panel-state": STORAGE_KEYS.PANEL_STATE,
  "aquibra-last-file": STORAGE_KEYS.LAST_FILE,
  "aquibra-clipboard": STORAGE_KEYS.CLIPBOARD,
  "aquibra-history": STORAGE_KEYS.HISTORY,
  "aquibra-autosave": STORAGE_KEYS.AUTOSAVE,
  "aquibra-ai-context": STORAGE_KEYS.AI_CONTEXT,
  "aquibra-license": STORAGE_KEYS.LICENSE_KEY,
  "aquibra-onboarding": STORAGE_KEYS.ONBOARDING,
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

  // Components tab
  "aquibra-component-favorites": STORAGE_KEYS.COMPONENT_FAVORITES,

  // Templates (note: uses underscore in old keys)
  aquibra_recent_templates: STORAGE_KEYS.RECENT_TEMPLATES,
  "aquibra-saved-templates": STORAGE_KEYS.SAVED_TEMPLATES,

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

/**
 * Get the new key name for a legacy key
 * Useful for checking if a key should be migrated
 */
export function getNewKeyName(oldKey: string): string | undefined {
  return MIGRATION_MAP[oldKey];
}

/**
 * Check if a key uses the old prefix
 */
export function isLegacyKey(key: string): boolean {
  return key.startsWith("aquibra-") || key.startsWith("aquibra_");
}

export default migrateStorageKeys;
