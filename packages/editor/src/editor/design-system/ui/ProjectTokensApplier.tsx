/**
 * Headless. Writes the SITE's token CSS — the same string export and publish
 * write (`emitTokenCss`) — into one <style>, at most once per animation frame,
 * and keeps `data-theme` on <html> explicit so the emitted
 * `prefers-color-scheme` block never follows the designer's OS (spec §2).
 * The canvas is light unless a Brand preview (`designSystem.preview`) says
 * otherwise — its tokens and theme are painted instead of the saved ones
 * while it is set. The dark look is a PREVIEW (L4-021): it used to follow
 * `composer.colorMode`, a saved, all-sites designer preference.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants/events";
import { emitTokenCss, resolveTokenLiteral } from "@buildrik/shared/tokens";
import { PAGE_BACKGROUND_TOKEN } from "@buildrik/shared/content/elementIds";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { tokensForEmit } from "@/engine/designSystem/projectTokens";
import type { DesignToken } from "@/engine/designSystem/types";
import { siteHasThemeToggle, themeToggleCss } from "@/engine/export/themeToggleRuntime";

const STYLE_ID = "bk-site-tokens";

export interface ProjectTokensApplierProps {
  composer?: Composer | null;
}

/* A dark preview (BRP1-M12 canvas-dark): the white page card takes the page
   background, the way an Auto export paints the body (AUTO_PAGE_CSS) — else
   the canvas below a short page stays white under light text. Only when the
   page has a dark colour: transparent would show the grey behind the card. */
const darkFrameCss = (tokens: readonly DesignToken[]): string => {
  const dark = resolveTokenLiteral(tokens, PAGE_BACKGROUND_TOKEN.id, "dark");
  return dark && dark !== "transparent"
    ? `\n:root[data-theme="dark"] .buildrick-canvas[data-buildrick-canvas]{background-color:var(${PAGE_BACKGROUND_TOKEN.cssVar})}\n`
    : "";
};

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
      /* The canvas always shows a theme toggle — on an Off site dimmed, as
         BRP1-M12 draws it, where publish hides it. */
      const css =
        emitTokenCss(tokens, { darkMode }) +
        (siteHasThemeToggle(composer.elements?.getAllElements?.() ?? [])
          ? themeToggleCss(darkMode === "off" ? "dimmed" : "show")
          : "") +
        (preview?.theme === "dark" ? darkFrameCss(tokens) : "");
      if (style.textContent !== css) style.textContent = css;
      document.documentElement.dataset.theme =
        preview?.theme ?? "light";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(write);
    };

    write();
    composer.on(EVENTS.PROJECT_LOADED, schedule);
    composer.on(EVENTS.SETTINGS_CHANGE, schedule);
    composer.on(EVENTS.ELEMENT_CREATED, schedule);
    composer.on(EVENTS.ELEMENT_DELETED, schedule);
    composer.on(EVENTS.BRAND_PREVIEW_CHANGED, schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      composer.off(EVENTS.PROJECT_LOADED, schedule);
      composer.off(EVENTS.SETTINGS_CHANGE, schedule);
      composer.off(EVENTS.ELEMENT_CREATED, schedule);
      composer.off(EVENTS.ELEMENT_DELETED, schedule);
      composer.off(EVENTS.BRAND_PREVIEW_CHANGED, schedule);
      document.getElementById(STYLE_ID)?.remove();
      delete document.documentElement.dataset.theme;
    };
  }, [composer]);

  return null;
};
