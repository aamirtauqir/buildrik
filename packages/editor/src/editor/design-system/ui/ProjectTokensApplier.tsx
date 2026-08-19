/**
 * Headless. Puts the SITE's own tokens on the page as soon as the project
 * loads, instead of when someone happens to open the Brand panel.
 *
 * Same shape as `DSLintRunner`, and for the same reason: the work belonged to
 * the project, not to a panel. The token registry seeds itself from
 * localStorage, and the merge with `projectSettings.designTokens` ran inside
 * `DesignSystemTab`, so on any machine without that cache — a teammate, a
 * second browser, anyone who cleared site data — the editor drew the site in
 * the DEFAULT brand while the published page shipped the real one. Measured:
 * body font Palatino in the project, `--buildrick-design-font-body` reading
 * "Inter" on the canvas until Brand was clicked.
 *
 * Colours resolve through the composer's dark resolver so a site opened in
 * dark mode does not flash its light values.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";
import { mergeProjectTokens } from "../state/projectTokens";

export interface ProjectTokensApplierProps {
  composer?: Composer | null;
}

export const ProjectTokensApplier: React.FC<ProjectTokensApplierProps> = ({ composer }) => {
  React.useEffect(() => {
    if (!composer) return;

    const apply = () => {
      const settings = composer.getProjectSettings?.();
      const incoming = settings?.designTokens;
      if (!incoming?.length) return;
      const merged = mergeProjectTokens(
        incoming as never,
        settings?.designTokensSchemaVersion
      );
      const resolved = composer.colorMode?.resolved?.() ?? "light";
      for (const token of merged) {
        if (!token.cssVar) continue;
        // `kind` is only carried by the eleven newer token kinds; colours are
        // identified by category, the same field the registry filters on.
        const value =
          token.category === "colors" && composer.darkResolver
            ? composer.darkResolver.resolve(token, resolved)
            : token.value;
        document.documentElement.style.setProperty(token.cssVar, value);
      }
    };

    apply();
    composer.on(EVENTS.PROJECT_LOADED, apply);
    composer.on(EVENTS.SETTINGS_CHANGE, apply);
    return () => {
      composer.off(EVENTS.PROJECT_LOADED, apply);
      composer.off(EVENTS.SETTINGS_CHANGE, apply);
    };
  }, [composer]);

  return null;
};
