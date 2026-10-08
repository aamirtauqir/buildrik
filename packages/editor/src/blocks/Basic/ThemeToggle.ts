/**
 * Theme toggle (spec §2, D12; board BRP1-M12): a Light / Dark pair visitors
 * use to switch an Auto site's theme. Token-bound like every inserted block
 * (§3), no fallbacks. Each segment carries `data-bk-tt`; the current theme's
 * one is filled by `themeToggleCss` (engine/export/themeToggleRuntime.ts).
 * Offered only when Dark mode is Auto.
 *
 * @license BSD-3-Clause
 */
import type { DarkMode } from "@buildrik/shared/schemas/design-tokens";
import { THEME_TOGGLE_ATTR, THEME_TOGGLE_ICON_ATTR } from "../../engine/export/themeToggleRuntime";
import type { BlockBuildConfig, Composer } from "../types";
import { LAYER_NAME_KEY } from "../../shared/constants/elementTypeLabels";

export const isThemeToggleOffered = (darkMode: DarkMode): boolean => darkMode === "auto";

/* BRP1-M12 canvas-light (8228:233132): two 28-tall segments, 8 apart. Both
   carry the resting look; the current theme's one is filled by
   `themeToggleCss("show")`, which is why neither binds Primary here. */
const SEGMENT_STYLES = {
  display: "inline-flex",
  "align-items": "center",
  "justify-content": "center",
  height: "28px",
  "padding-top": "0",
  "padding-bottom": "0",
  "padding-left": "var(--buildrick-design-space-3)",
  "padding-right": "var(--buildrick-design-space-3)",
  "background-color": "var(--buildrick-design-color-surface-raised)",
  color: "var(--buildrick-design-color-text-strong)",
  "border-width": "1px",
  "border-style": "solid",
  "border-color": "var(--buildrick-design-color-border-subtle)",
  "border-radius": "var(--buildrick-design-radius-md)",
  "font-size": "var(--buildrick-design-font-size-sm)",
  "font-weight": "500",
  "line-height": "20px",
  cursor: "pointer",
};

function buildThemeToggle(composer: Composer, parentId: string, dropIndex?: number): string {
  const group = composer.elements.createElement("container", {
    tagName: "div",
    attributes: { [THEME_TOGGLE_ATTR]: "true", role: "group", "aria-label": "Theme" },
    styles: {
      display: "inline-flex",
      "align-items": "center",
      gap: "var(--buildrick-design-space-2)",
    },
  });
  group.setData(LAYER_NAME_KEY, "Theme toggle");
  composer.elements.addElement(group, parentId, dropIndex);
  for (const [mode, label] of [["light", "Light"], ["dark", "Dark"]] as const) {
    const segment = composer.elements.createElement("button", {
      tagName: "button",
      content: label,
      attributes: { [THEME_TOGGLE_ICON_ATTR]: mode, type: "button" },
      styles: SEGMENT_STYLES,
    });
    composer.elements.addElement(segment, group.getId());
  }
  return group.getId();
}

export const themeToggleBlockConfig: BlockBuildConfig = {
  id: "theme-toggle",
  label: "Theme toggle",
  category: "Basic",
  elementType: "container",
  description: "Light / Dark switch",
  icon: "/src/assets/icons/blocks/basic/button.svg",
  content: "",
  build: buildThemeToggle,
};
