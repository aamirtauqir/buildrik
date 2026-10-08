/**
 * The SITE's Dark mode setting ("off" | "auto", absent reads "off") — what
 * publish emits, not the designer's preview. Re-read on every settings change
 * (a ⌘Z of the switch included).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { DarkModeSchema, type DarkMode } from "@buildrik/shared/schemas/design-tokens";

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
