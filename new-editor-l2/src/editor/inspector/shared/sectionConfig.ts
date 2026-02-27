/**
 * Section Configuration for ProInspector
 *
 * KEY CHANGE: Base groups now render for ALL elements (Rule A from spec).
 * Only conditional groups (Flex, Grid, Typography, Media) use showIf evaluation.
 *
 * @license BSD-3-Clause
 */

import type { InspectorContext } from "../config";
import { GROUPS, BASE_GROUPS_ALWAYS_ON, getGroupsForTab, groupMatchesSearch } from "../config";
import { evaluateShowIf } from "../config/contextEvaluator";
import type { TabName } from "../hooks/useInspectorState";

// ============================================================================
// TYPES
// ============================================================================

export type LayoutSectionName =
  | "Display"
  | "Spacing"
  | "Size"
  | "Position"
  | "Overflow"
  | "Flex"
  | "Grid";
export type DesignSectionName =
  | "Typography"
  | "Colors"
  | "Background"
  | "BorderRadius"
  | "Shadow"
  | "Effects"
  | "Motion"
  | "Icon";
export type SettingsSectionName =
  | "Content"
  | "Link"
  | "Media"
  | "Attributes"
  | "Accessibility"
  | "Classes"
  | "Interactions"
  | "DataRepeaters"
  | "ConditionalVisibility"
  | "AllCSS"
  | "Modal"
  | "Tabs"
  | "Accordion"
  | "Slider"
  | "Navbar";
export type AllSectionName = LayoutSectionName | DesignSectionName | SettingsSectionName;

// ============================================================================
// LEGACY MAPS (kept for backward compatibility during migration)
// ============================================================================

// These are no longer used for filtering but kept for reference
export type LegacyLayoutSectionName = "layout" | "size" | "spacing" | "flexbox";
export type LegacyDesignSectionName = "typography" | "background" | "border" | "effects";

export const LAYOUT_ELEMENT_SECTIONS: Record<string, LegacyLayoutSectionName[]> = {
  default: ["layout", "size", "spacing", "flexbox"],
};

export const DESIGN_ELEMENT_SECTIONS: Record<string, LegacyDesignSectionName[]> = {
  default: ["typography", "background", "border", "effects"],
};

// ============================================================================
// SEARCH KEYWORDS (enhanced with group-based keywords)
// ============================================================================

export const SECTION_KEYWORDS: Record<string, string[]> = {
  // Layout tab groups
  Display: [
    "layout",
    "display",
    "position",
    "flex",
    "block",
    "inline",
    "absolute",
    "relative",
    "fixed",
    "grid",
    "none",
    "visibility",
  ],
  Spacing: ["spacing", "margin", "padding", "gap", "space"],
  Size: ["size", "width", "height", "min", "max", "dimension", "aspect"],
  Position: [
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "z-index",
    "inset",
    "anchor",
    "absolute",
    "relative",
    "fixed",
    "sticky",
  ],
  Overflow: ["overflow", "scroll", "hidden", "visible", "auto", "clip"],
  Flex: [
    "flex",
    "flexbox",
    "align",
    "justify",
    "direction",
    "wrap",
    "grow",
    "shrink",
    "basis",
    "order",
  ],
  Grid: ["grid", "columns", "rows", "template", "area", "auto-flow", "gap"],

  // Design tab groups
  Typography: [
    "typography",
    "font",
    "text",
    "size",
    "weight",
    "color",
    "line",
    "letter",
    "align",
    "decoration",
    "transform",
  ],
  Colors: ["colors", "color", "text-color", "background-color", "border-color", "opacity"],
  Background: ["background", "bg", "gradient", "image", "fill", "cover", "contain"],
  BorderRadius: ["border", "radius", "corner", "outline", "stroke", "rounded"],
  Shadow: ["shadow", "box-shadow", "text-shadow", "elevation"],
  Effects: ["effects", "opacity", "blur", "filter", "transform", "clip-path", "backdrop"],
  Motion: ["motion", "transition", "animation", "animate", "keyframe", "duration", "easing"],
  Icon: ["icon", "svg", "stroke", "fill"],

  // Settings tab groups
  Content: ["content", "text", "label", "placeholder"],
  Link: ["link", "href", "url", "target", "anchor", "navigation", "rel"],
  Media: ["media", "src", "alt", "image", "video", "object-fit", "loading"],
  Attributes: ["attributes", "id", "data", "custom"],
  Accessibility: ["accessibility", "a11y", "aria", "role", "tab-index", "screen-reader"],
  Classes: ["class", "css", "classes", "style", "selector", "inline"],
  Interactions: ["interaction", "hover", "click", "trigger", "event", "action"],
  DataRepeaters: ["data", "collection", "repeater", "bind", "mapping", "filter", "sort", "limit"],
  ConditionalVisibility: ["conditional", "visibility", "show", "hide", "rule", "condition"],
  AllCSS: ["css", "all", "property", "raw", "custom"],
  Modal: ["modal", "dialog", "popup", "overlay", "close", "trigger"],
  Tabs: ["tabs", "tab", "panel", "active"],
  Accordion: ["accordion", "collapse", "expand", "panel"],
  Slider: ["slider", "carousel", "slide", "autoplay", "navigation"],
  Navbar: ["navbar", "nav", "menu", "navigation", "header", "sticky"],

  // Legacy keywords for backwards compatibility
  layout: [
    "layout",
    "display",
    "position",
    "flex",
    "block",
    "inline",
    "absolute",
    "relative",
    "fixed",
  ],
  size: ["size", "width", "height", "min", "max", "dimension", "overflow"],
  spacing: ["spacing", "margin", "padding", "gap", "space"],
  flexbox: ["flex", "flexbox", "align", "justify", "direction", "wrap", "grow", "shrink"],
  grid: ["grid", "columns", "rows", "template", "area"],
  visibility: ["visibility", "visible", "hidden", "opacity", "display", "show", "hide"],
  typography: ["typography", "font", "text", "size", "weight", "color", "line", "letter", "align"],
  background: ["background", "bg", "color", "gradient", "image", "fill"],
  border: ["border", "radius", "corner", "outline", "stroke"],
  effects: ["effects", "shadow", "box-shadow", "opacity", "blur", "filter", "transform"],
  animation: ["animation", "animate", "motion", "transition", "keyframe"],
  interactions: ["interaction", "hover", "click", "trigger", "event"],
};

// ============================================================================
// VISIBILITY HELPERS
// ============================================================================

/**
 * Get visible groups for a tab based on context
 * Base groups are always visible; conditional groups use showIf evaluation
 */
export function getVisibleGroupsForTab(
  tab: TabName,
  ctx: InspectorContext,
  searchQuery = ""
): string[] {
  const groups = getGroupsForTab(tab);
  const baseGroups = BASE_GROUPS_ALWAYS_ON[tab as keyof typeof BASE_GROUPS_ALWAYS_ON] ?? [];

  return groups
    .filter((group) => {
      // Check search filter first
      if (searchQuery && !groupMatchesSearch(group, searchQuery)) {
        return false;
      }

      // Base groups are always visible (Rule A)
      if ((baseGroups as readonly string[]).includes(group.id)) {
        return true;
      }

      // Conditional groups use showIf evaluation (Rule B)
      return evaluateShowIf(group.showIf, ctx);
    })
    .map((g) => g.id);
}

/**
 * Check if a specific group should be visible
 */
export function isGroupVisible(groupId: string, tab: TabName, ctx: InspectorContext): boolean {
  const baseGroups = BASE_GROUPS_ALWAYS_ON[tab as keyof typeof BASE_GROUPS_ALWAYS_ON] ?? [];

  // Base groups always visible
  if ((baseGroups as readonly string[]).includes(groupId)) {
    return true;
  }

  // Find the group definition
  const group = GROUPS.find((g) => g.id === groupId);
  if (!group) return false;

  // Evaluate showIf condition
  return evaluateShowIf(group.showIf, ctx);
}

// ============================================================================
// LEGACY HELPER FUNCTIONS (for backward compatibility)
// ============================================================================

/**
 * Get sections for an element type in the Layout tab
 * @deprecated Use getVisibleGroupsForTab instead
 */
export function getLayoutSectionsForElement(_elementType: string): LegacyLayoutSectionName[] {
  // Now returns all layout sections for all elements (Rule A)
  return ["layout", "size", "spacing", "flexbox"];
}

/**
 * Get sections for an element type in the Design tab
 * @deprecated Use getVisibleGroupsForTab instead
 */
export function getDesignSectionsForElement(_elementType: string): LegacyDesignSectionName[] {
  // Now returns all design sections for all elements (Rule A)
  return ["typography", "background", "border", "effects"];
}

/**
 * Check if a section matches a search query
 */
export function matchesSectionSearch(sectionName: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  const keywords = SECTION_KEYWORDS[sectionName] || [sectionName.toLowerCase()];
  return keywords.some((kw) => kw.includes(q) || q.includes(kw));
}
