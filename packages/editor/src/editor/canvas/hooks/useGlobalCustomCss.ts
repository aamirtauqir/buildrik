/**
 * Reads the project's global custom CSS (Settings → Advanced) and keeps it in
 * sync with SETTINGS_CHANGE. Canvas renders the returned string in a <style>
 * tag so the user's custom CSS actually applies on the canvas — previously it
 * was saved but injected nowhere (PRD gap A5 / Module 3 §3.1).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants";
import type { ProjectSettings } from "../../../shared/types";

export function useGlobalCustomCss(composer: Composer | null): string {
  const [css, setCss] = React.useState(
    () => composer?.getProjectSettings?.()?.customCode?.globalCss ?? ""
  );

  React.useEffect(() => {
    if (!composer) return;
    const sync = (settings: ProjectSettings) => {
      setCss(settings?.customCode?.globalCss ?? "");
    };
    // Seed once (settings may have loaded between mount and effect).
    setCss(composer.getProjectSettings?.()?.customCode?.globalCss ?? "");
    composer.on(EVENTS.SETTINGS_CHANGE, sync);
    return () => {
      composer.off(EVENTS.SETTINGS_CHANGE, sync);
    };
  }, [composer]);

  return css;
}
