/**
 * Theme toggle (spec §2, D12): a button visitors use to switch an Auto site
 * between light and dark. Token-bound like every inserted block (§3), no
 * fallbacks. The two icon children carry `data-bk-tt`; which one shows is
 * decided by `themeToggleCss` (engine/export/themeToggleRuntime.ts), so they
 * must not carry an inline `display`. Offered only when Dark mode is Auto.
 *
 * @license BSD-3-Clause
 */
import type { DarkMode } from "@buildrik/shared/schemas/design-tokens";
import { THEME_TOGGLE_ATTR, THEME_TOGGLE_ICON_ATTR } from "../../engine/export/themeToggleRuntime";
import type { BlockBuildConfig, Composer } from "../types";

const SUN = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-icon="sun" data-library="lucide"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-icon="moon" data-library="lucide"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;

export const isThemeToggleOffered = (darkMode: DarkMode): boolean => darkMode === "auto";

function buildThemeToggle(composer: Composer, parentId: string, dropIndex?: number): string {
  const button = composer.elements.createElement("button", {
    tagName: "button",
    attributes: {
      [THEME_TOGGLE_ATTR]: "true",
      "aria-label": "Switch light or dark theme",
      type: "button",
    },
    styles: {
      display: "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      width: "var(--buildrick-design-btn-height-md)",
      height: "var(--buildrick-design-btn-height-md)",
      padding: "0",
      "background-color": "var(--buildrick-design-color-surface-raised)",
      color: "var(--buildrick-design-color-text-strong)",
      "border-width": "1px",
      "border-style": "solid",
      "border-color": "var(--buildrick-design-color-border-subtle)",
      "border-radius": "var(--buildrick-design-radius-full)",
      cursor: "pointer",
    },
  });
  composer.elements.addElement(button, parentId, dropIndex);
  for (const [mode, svg] of [["light", SUN], ["dark", MOON]] as const) {
    const icon = composer.elements.createElement("icon", {
      content: svg,
      attributes: { [THEME_TOGGLE_ICON_ATTR]: mode, "aria-hidden": "true" },
    });
    composer.elements.addElement(icon, button.getId());
  }
  return button.getId();
}

export const themeToggleBlockConfig: BlockBuildConfig = {
  id: "theme-toggle",
  label: "Theme toggle",
  category: "Basic",
  elementType: "button",
  icon: "/src/assets/icons/blocks/basic/button.svg",
  content: "",
  build: buildThemeToggle,
};
