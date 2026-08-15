/**
 * useInspectorSections — manages section expand/collapse state keyed by
 * `${elementType}:${sectionId}`. Each element type remembers which sections
 * the user had open last time they edited that type. expandAll / collapseAll
 * act on the currently selected element's profile only, so customizing one
 * element type never touches collapse state for another.
 *
 * Migration from the pre-Phase-6 flat key (`buildrick-inspector-sections`) runs
 * once per session at module load time: the old Set is cloned across every
 * known element type so users don't lose their prior preferences.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { ALL_PROFILE_ELEMENT_TYPES, getProfileFor } from "../config/elementProfiles";
import {
  ALL_REGISTRY_SECTION_IDS,
  sectionApplies,
  type SectionId,
} from "../sections/registry";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────


/** Legacy localStorage key (pre-Phase-6 flat section set). */
const LEGACY_PREFS_KEY = "buildrick-inspector-sections";
/** Current localStorage key — entries are `${elementType}:${sectionId}`. */
const PREFS_KEY = "buildrick-inspector-sections-v2";

/** Total section count across all inspector tabs — used for collapse/expand progress. */
export const TOTAL_SECTIONS = ALL_REGISTRY_SECTION_IDS.length;

// ─────────────────────────────────────────────────────────────────────────────
// Legacy migration (runs once per module load)
// ─────────────────────────────────────────────────────────────────────────────

let legacyMigrated = false;

/**
 * Migrate the old flat `Set<sectionId>` to the new `${type}:${id}` format.
 * Runs at most once per session. Idempotent: does nothing if the v2 key
 * already exists or if the legacy key is absent.
 *
 * Seeding strategy: clone the user's old preferences across every known
 * element type. Users who had `typography` collapsed previously will find
 * `typography` collapsed on heading / text / button / etc. alike — a
 * generous default that preserves their intent without requiring them to
 * re-customize per type.
 */
function migrateLegacyState(): void {
  if (legacyMigrated) return;
  legacyMigrated = true;
  if (typeof window === "undefined") return;

  try {
    // If the v2 store already exists, never re-migrate.
    if (localStorage.getItem(PREFS_KEY)) return;
    const legacyRaw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (!legacyRaw) return;

    const legacyIds = JSON.parse(legacyRaw) as string[];
    if (!Array.isArray(legacyIds) || legacyIds.length === 0) {
      localStorage.removeItem(LEGACY_PREFS_KEY);
      return;
    }

    const seeded = new Set<string>();
    for (const elementType of ALL_PROFILE_ELEMENT_TYPES) {
      for (const sectionId of legacyIds) {
        seeded.add(`${elementType}:${sectionId}`);
      }
    }

    localStorage.setItem(PREFS_KEY, JSON.stringify(Array.from(seeded)));
    localStorage.removeItem(LEGACY_PREFS_KEY);
  } catch {
    // Ignore storage errors — migration is best-effort.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UseInspectorSectionsOptions {
  selectedElement: { id: string; type: string } | null;
  composer?: Composer | null;
  /** The selected element's own declared styles — decides which sections open
   *  on first sight (see `getDefaultExpandedKeysForType`). */
  styles?: Record<string, string>;
}

export interface UseInspectorSectionsResult {
  /** Set of `${elementType}:${sectionId}` strings for currently expanded sections. */
  expandedSections: Set<string>;
  /** Count of expanded sections across ALL element types. */
  expandedCount: number;
  /** Collapse every section in the currently selected element's profile. */
  collapseAll: () => void;
  /** Expand every section in the currently selected element's profile. */
  expandAll: () => void;
  /** Toggle a single section for the currently selected element type. */
  toggleSection: (elementType: string, sectionId: SectionId | "variants") => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useInspectorSections({
  selectedElement,
  composer,
  styles,
}: UseInspectorSectionsOptions): UseInspectorSectionsResult {
  // Run the legacy migration on first hook mount. Uses useEffect (not useMemo)
  // because it writes to localStorage — a side effect that shouldn't run
  // during render (breaks React StrictMode/concurrent render). Guarded by
  // the module-level flag so it fires at most once per session.
  React.useEffect(() => {
    migrateLegacyState();
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const loadUserPreferences = React.useCallback((): Set<string> | null => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return new Set(parsed);
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  const saveUserPreferences = React.useCallback((sections: Set<string>) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(Array.from(sections)));
    } catch {
      // Ignore storage errors
    }
  }, []);

  // ── Smart defaults: open what applies ────────────────────────────────────
  // The sections that open are the ones carrying a value on this element —
  // the rule every profile board's footer counts ("4 of 13 sections apply" on
  // the flex board, where Layout / Flexbox / Size / Spacing are exactly the
  // four drawn open). It replaced "the first two in profile order", which
  // opened Size on a text element and showed an empty body.
  //
  // Nothing set yet (a freshly dropped element) still opens the first section,
  // so the panel never greets anyone fully shut.
  const getDefaultExpandedKeysForType = React.useCallback(
    (elementType: string): string[] => {
      const { order } = getProfileFor(elementType);
      const applying = styles ? order.filter((id) => sectionApplies(id, styles)) : [];
      const open = applying.length > 0 ? applying : order.slice(0, 1);
      // Note: VariantSection for component instances is rendered directly
      // by ProInspector outside the registry pipeline (autoExpandSection
      // === "variants" drives its open state), so we don't need to seed a
      // variants key here.
      return open.map((sectionId) => `${elementType}:${sectionId}`);
    },
    [styles]
  );

  // ── State ─────────────────────────────────────────────────────────────────
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(() => {
    const userPrefs = loadUserPreferences();
    if (userPrefs && userPrefs.size > 0) return userPrefs;
    const initialType = selectedElement?.type || "container";
    return new Set(getDefaultExpandedKeysForType(initialType));
  });

  // Tracks element types the user has never touched. On first selection of
  // a type, seed defaults from the profile. Once the user toggles anything
  // for a type, we stop seeding for that type.
  const customizedTypesRef = React.useRef<Set<string>>(new Set());

  // Seed defaults when a new element type is first selected.
  React.useEffect(() => {
    const type = selectedElement?.type;
    if (!type) return;
    if (customizedTypesRef.current.has(type)) return;

    // If the user already has any keys for this type in storage (from
    // migration or a prior session), don't overwrite them.
    setExpandedSections((prev) => {
      const hasAnyForType = Array.from(prev).some((k) => k.startsWith(`${type}:`));
      if (hasAnyForType) return prev;

      const next = new Set(prev);
      for (const key of getDefaultExpandedKeysForType(type)) {
        next.add(key);
      }
      return next;
    });
  }, [selectedElement?.type, getDefaultExpandedKeysForType]);

  // ── Controls ──────────────────────────────────────────────────────────────

  /** Build the `${type}:${id}` keys for every section in the currently
   *  selected element's profile. Used by expandAll / collapseAll to scope
   *  their action to the active element type only. */
  const keysForCurrentElement = React.useCallback((): string[] => {
    const type = selectedElement?.type;
    if (!type) return [];
    return getProfileFor(type).order.map((id) => `${type}:${id}`);
  }, [selectedElement?.type]);

  const collapseAll = React.useCallback(() => {
    const targetKeys = keysForCurrentElement();
    setExpandedSections((prev) => {
      const next = new Set(prev);
      for (const key of targetKeys) next.delete(key);
      const type = selectedElement?.type;
      if (type) customizedTypesRef.current.add(type);
      saveUserPreferences(next);
      return next;
    });
  }, [keysForCurrentElement, saveUserPreferences, selectedElement?.type]);

  const expandAll = React.useCallback(() => {
    const targetKeys = keysForCurrentElement();
    setExpandedSections((prev) => {
      const next = new Set(prev);
      for (const key of targetKeys) next.add(key);
      const type = selectedElement?.type;
      if (type) customizedTypesRef.current.add(type);
      saveUserPreferences(next);
      return next;
    });
  }, [keysForCurrentElement, saveUserPreferences, selectedElement?.type]);

  const toggleSection = React.useCallback(
    (elementType: string, sectionId: SectionId | "variants") => {
      const key = `${elementType}:${sectionId}`;
      setExpandedSections((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        customizedTypesRef.current.add(elementType);
        // Persist inside the updater so we always write the freshest set.
        try {
          localStorage.setItem(PREFS_KEY, JSON.stringify(Array.from(next)));
        } catch {
          // Ignore storage errors
        }
        return next;
      });
    },
    []
  );

  return {
    expandedSections,
    expandedCount: expandedSections.size,
    collapseAll,
    expandAll,
    toggleSection,
  };
}
