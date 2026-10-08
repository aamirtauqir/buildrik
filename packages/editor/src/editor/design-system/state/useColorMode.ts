/**
 * useColorMode — subscribes to composer.colorMode and returns current value.
 *
 * Shared between:
 *   - ColorModeToggle (seg, DS panel header)
 *   - (ColorModeIconCycle deleted 2026-09-02 — it was never rendered)
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "../../../engine";
import type { ThemeMode } from "../types";
import { EVENTS } from "@/shared/constants/events";
import { DarkModeSchema, type DarkMode } from "@buildrik/shared/schemas/design-tokens";

export function useColorMode(composer: Composer): ThemeMode {
  const [mode, setMode] = React.useState<ThemeMode>(() => composer.colorMode.get());
  React.useEffect(() => {
    const sync = () => setMode(composer.colorMode.get());
    composer.on("colorMode:changed", sync);
    return () => {
      composer.off("colorMode:changed", sync);
    };
  }, [composer]);
  return mode;
}

/** The SITE's Dark mode setting ("off" | "auto", absent reads "off") — what
 *  publish emits, not the designer's preview. Re-read on every settings change
 *  (a ⌘Z of the switch included). */
export function useSiteDarkMode(composer: Composer | null | undefined): DarkMode {
  const read = React.useCallback(
    () => DarkModeSchema.catch("off").parse(composer?.getProjectSettings?.()?.darkMode),
    [composer],
  );
  const [mode, setMode] = React.useState<DarkMode>(read);
  React.useEffect(() => {
    if (!composer || typeof composer.on !== "function") return;
    const sync = () => setMode(read());
    sync();
    composer.on(EVENTS.SETTINGS_CHANGE, sync);
    return () => {
      composer.off(EVENTS.SETTINGS_CHANGE, sync);
    };
  }, [composer, read]);
  return mode;
}
