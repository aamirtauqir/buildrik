/**
 * Headless. Writes the SITE's token CSS — the same string export and publish
 * write (`emitTokenCss`) — into one <style>, at most once per animation frame,
 * and keeps `data-theme` on <html> explicit so the emitted
 * `prefers-color-scheme` block never follows the designer's OS (spec §2).
 * A site whose Dark mode is "off" always previews light (D8).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { emitTokenCss } from "@buildrik/shared/tokens";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { tokensForEmit } from "@/engine/designSystem/projectTokens";

const STYLE_ID = "bk-site-tokens";

export interface ProjectTokensApplierProps {
  composer?: Composer | null;
}

export const ProjectTokensApplier: React.FC<ProjectTokensApplierProps> = ({ composer }) => {
  React.useEffect(() => {
    if (!composer) return;
    let frame = 0;

    const write = () => {
      frame = 0;
      const settings = composer.getProjectSettings?.();
      const darkMode = DarkModeSchema.catch("off").parse(settings?.darkMode);
      const tokens = tokensForEmit(settings, { migrate: composer.designSystem?.brandTokensV2 !== false });
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      const css = emitTokenCss(tokens, { darkMode });
      if (style.textContent !== css) style.textContent = css;
      document.documentElement.dataset.theme =
        darkMode === "off" ? "light" : (composer.colorMode?.resolved?.() ?? "light");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    composer.on(EVENTS.PROJECT_LOADED, schedule);
    composer.on(EVENTS.SETTINGS_CHANGE, schedule);
    composer.on("colorMode:changed", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      composer.off(EVENTS.PROJECT_LOADED, schedule);
      composer.off(EVENTS.SETTINGS_CHANGE, schedule);
      composer.off("colorMode:changed", schedule);
      document.getElementById(STYLE_ID)?.remove();
      delete document.documentElement.dataset.theme;
    };
  }, [composer]);

  return null;
};
