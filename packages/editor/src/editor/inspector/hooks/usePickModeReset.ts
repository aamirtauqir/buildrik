/**
 * usePickModeReset — subscribes to canvas pick-flow completion events and
 * resets a local "is pick button pressed" flag when the canvas emits
 * inspector:pick-result or inspector:pick-cancel. Kept as a standalone
 * hook so the canvas → inspector event contract has a unit-test surface
 * independent of ProInspector's full render tree.
 */

import * as React from "react";
import type { Composer } from "../../../engine";

export function usePickModeReset(
  composer: Composer | null | undefined,
  setPickActive: (active: boolean) => void,
): void {
  React.useEffect(() => {
    if (!composer) return;
    const clear = () => setPickActive(false);
    composer.on("inspector:pick-result", clear);
    composer.on("inspector:pick-cancel", clear);
    return () => {
      composer.off("inspector:pick-result", clear);
      composer.off("inspector:pick-cancel", clear);
    };
  }, [composer, setPickActive]);
}
