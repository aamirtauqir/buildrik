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
