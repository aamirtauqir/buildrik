/**
 * useSettingsScreen — shared hook for Settings sub-screens
 *
 * Centralizes: composer load on mount and the EVENTS subscription. Dirty is
 * each screen's own difference from `value` (a field typed back to its saved
 * value is clean), so the hook keeps no dirty flag.
 * Replaces the copy-pasted loadSettings + useEffect pattern in every screen.
 * @license BSD-3-Clause
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { Composer } from "../../../../../engine/Composer";
import { EVENTS } from "../../../../../shared/constants/events";
import type { ProjectSettings } from "../../../../../shared/types/project";

export interface UseSettingsScreenResult<T> {
  /** Current value selected from ProjectSettings */
  value: T;
}

export function useSettingsScreen<T>(
  composer: Composer | null | undefined,
  selector: (settings: ProjectSettings) => T,
  defaultValue: T
): UseSettingsScreenResult<T> {
  const [value, setValue] = useState<T>(defaultValue);

  // Callers pass an inline `selector` arrow function. If we put `selector` in
  // `reload`'s useCallback deps, every parent render busts the memo, the
  // effect re-runs, calls `reload()`, which calls `setValue(...)` with a new
  // object reference (the selector returns a fresh `{...}`), which triggers
  // another render — infinite loop. Snapshot the latest selector via a ref
  // so `reload` stays stable per `composer`.
  const selectorRef = useRef(selector);
  selectorRef.current = selector;

  const reload = useCallback(() => {
    if (!composer) return;
    setValue(selectorRef.current(composer.getProjectSettings()));
  }, [composer]);

  useEffect(() => {
    reload();
    composer?.on(EVENTS.PROJECT_LOADED, reload);
    composer?.on(EVENTS.SETTINGS_CHANGE, reload);
    return () => {
      composer?.off(EVENTS.PROJECT_LOADED, reload);
      composer?.off(EVENTS.SETTINGS_CHANGE, reload);
    };
  }, [composer, reload]);

  return { value };
}
