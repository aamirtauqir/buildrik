/**
 * useSettingsScreen — shared hook for Settings sub-screens
 *
 * Centralizes: composer load on mount, EVENTS subscription, dirty-state tracking.
 * Replaces the copy-pasted loadSettings + useEffect pattern in every screen.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { EVENTS } from "../../../../../shared/constants/events";
import type { ProjectSettings } from "../../../../../shared/types/project";

export interface UseSettingsScreenResult<T> {
  /** Current value selected from ProjectSettings */
  value: T;
  /** True if user has made changes not yet saved */
  isDirty: boolean;
  /** Call on any field change to mark form dirty */
  markDirty: () => void;
  /** Call after successful save to clear dirty state */
  markClean: () => void;
  /** Manually reload value from composer (rarely needed) */
  reload: () => void;
}

export function useSettingsScreen<T>(
  composer: Composer | null,
  selector: (settings: ProjectSettings) => T,
  defaultValue: T
): UseSettingsScreenResult<T> {
  const [value, setValue] = useState<T>(defaultValue);
  const [isDirty, setIsDirty] = useState(false);

  const reload = useCallback(() => {
    if (!composer) return;
    setValue(selector(composer.getProjectSettings()));
    // NOTE: intentionally does NOT reset isDirty.
    // Only handleSave (via markClean) should reset dirty state.
    // If SETTINGS_CHANGE fires while user has unsaved edits, we preserve their work.
  }, [composer, selector]);

  useEffect(() => {
    reload();
    composer?.on(EVENTS.PROJECT_LOADED, reload);
    composer?.on(EVENTS.SETTINGS_CHANGE, reload);
    return () => {
      composer?.off(EVENTS.PROJECT_LOADED, reload);
      composer?.off(EVENTS.SETTINGS_CHANGE, reload);
    };
  }, [composer, reload]);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const markClean = useCallback(() => setIsDirty(false), []);

  return { value, isDirty, markDirty, markClean, reload };
}
