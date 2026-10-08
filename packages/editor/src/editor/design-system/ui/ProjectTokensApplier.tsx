/**
 * Headless. Writes the SITE's token CSS — the same string export and publish
 * write (`emitTokenCss`) — into one <style>, at most once per animation frame,
 * and keeps `data-theme` on <html> explicit so the emitted
 * `prefers-color-scheme` block never follows the designer's OS (spec §2).
 * A site whose Dark mode is "off" always previews light (D8). A Brand flow's
 * preview (`designSystem.preview`) is painted instead of the saved tokens
 * while it is set.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { emitTokenCss } from "@buildrik/shared/tokens";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { tokensForEmit } from "@/engine/designSystem/projectTokens";
import { siteHasThemeToggle, themeToggleCss } from "@/engine/export/themeToggleRuntime";

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
      const preview = composer.designSystem?.preview ?? null;
      const settings = composer.getProjectSettings?.();
      const darkMode = preview?.darkMode ?? DarkModeSchema.catch("off").parse(settings?.darkMode);
      const tokens =
        preview?.tokens ?? tokensForEmit(settings, { migrate: composer.designSystem?.brandTokensV2 !== false });
      let style = document.getElementById(STYLE_ID);
      if (!style) {
        style = document.createElement("style");
        style.id = STYLE_ID;
        document.head.appendChild(style);
      }
      /* The canvas always swaps a theme toggle's icons, even on an Off site —
         publish hides it there, the canvas shows it with the board's note. */
      const css =
        emitTokenCss(tokens, { darkMode }) +
        (siteHasThemeToggle(composer.elements?.getAllElements?.() ?? []) ? themeToggleCss("show") : "");
      if (style.textContent !== css) style.textContent = css;
      document.documentElement.dataset.theme =
        preview?.theme ?? (darkMode === "off" ? "light" : (composer.colorMode?.resolved?.() ?? "light"));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    composer.on(EVENTS.PROJECT_LOADED, schedule);
    composer.on(EVENTS.SETTINGS_CHANGE, schedule);
    composer.on("colorMode:changed", schedule);
    composer.on(EVENTS.ELEMENT_CREATED, schedule);
    composer.on(EVENTS.ELEMENT_DELETED, schedule);
    composer.on(EVENTS.BRAND_PREVIEW_CHANGED, schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      composer.off(EVENTS.PROJECT_LOADED, schedule);
      composer.off(EVENTS.SETTINGS_CHANGE, schedule);
      composer.off("colorMode:changed", schedule);
      composer.off(EVENTS.ELEMENT_CREATED, schedule);
      composer.off(EVENTS.ELEMENT_DELETED, schedule);
      composer.off(EVENTS.BRAND_PREVIEW_CHANGED, schedule);
      document.getElementById(STYLE_ID)?.remove();
      delete document.documentElement.dataset.theme;
    };
  }, [composer]);

  return null;
};
