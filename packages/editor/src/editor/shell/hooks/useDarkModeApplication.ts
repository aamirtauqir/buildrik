/**
 * useDarkModeApplication — Phase B.1 hook
 * Listens to composer.colorMode:changed and re-applies color tokens via
 * composer.darkResolver. Color-only; other token kinds passthrough untouched.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";

export function useDarkModeApplication(composer: Composer | null): void {
  React.useEffect(() => {
    if (!composer) return;
    const handler = () => {
      // Step 2.x — implementation lands in Task 2.
    };
    composer.on("colorMode:changed", handler);
    return () => {
      composer.off("colorMode:changed", handler);
    };
  }, [composer]);
}
