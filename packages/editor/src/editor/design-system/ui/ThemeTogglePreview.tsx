/**
 * Headless. BRP1-M12 (canvas-light 8228:233132 · canvas-dark 8228:233404): on
 * an Auto site a click on the theme-toggle block's Light / Dark segment ON THE
 * CANVAS shows the canvas in that theme, the way a visitor's click does on the
 * published page. It is a PREVIEW of the saved brand (L4-021) through the
 * Brand preview layer — never saved, never in ⌘Z, no colour-mode or
 * localStorage write — and is tagged `source: "canvas"` so Brand checks do not
 * read it as the mode the site ships. An Off site's canvas stays light (the
 * toggle is drawn dimmed); turning the site Off mid-preview drops it to light.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { DarkModeSchema } from "@buildrik/shared/schemas/design-tokens";
import { THEME_TOGGLE_ATTR, THEME_TOGGLE_ICON_ATTR } from "@/engine/export/themeToggleRuntime";
import { useBrandPreview } from "../state/useBrandPreview";

const CANVAS_SEGMENT = `.buildrick-canvas [${THEME_TOGGLE_ATTR}] [${THEME_TOGGLE_ICON_ATTR}]`;

export const ThemeTogglePreview: React.FC<{ composer?: Composer | null }> = ({ composer }) => {
  const preview = useBrandPreview(composer ?? null);
  const { show, clear } = preview;

  React.useEffect(() => {
    if (!composer) return;
    const onClick = (e: MouseEvent) => {
      const segment = e.target instanceof Element ? e.target.closest(CANVAS_SEGMENT) : null;
      if (!segment) return;
      const auto = DarkModeSchema.catch("off").parse(composer.getProjectSettings?.()?.darkMode) === "auto";
      if (!auto || segment.getAttribute(THEME_TOGGLE_ICON_ATTR) !== "dark") return clear();
      show((tokens, settings) =>
        DarkModeSchema.catch("off").parse(settings.darkMode) === "off"
          ? null
          : { tokens, darkMode: "auto", theme: "dark", source: "canvas" },
      );
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [composer, show, clear]);

  return null;
};
