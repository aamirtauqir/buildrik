/**
 * Groups Configuration
 * Loads and provides access to group definitions from groups.json spec.
 * Groups define which sections appear in each tab with their properties.
 *
 * Key concepts:
 * - Base groups (baseGroupsAlwaysOn) render for ALL elements
 * - Conditional groups have showIf conditions evaluated at runtime
 *
 * @license BSD-3-Clause
 */

import type { TabName } from "../hooks/useInspectorState";

// ============================================================================
// TYPES
// ============================================================================

export interface GroupConfig {
  id: string;
  tab: "layout" | "appearance" | "effects" | "settings";
  title: string;
  showIf: string;
  essentialsProps: string[];
  advancedProps: string[];
}

// ============================================================================
// BASE GROUPS (Always render for ALL elements)
// ============================================================================

export const BASE_GROUPS_ALWAYS_ON = {
  layout: ["Display", "Spacing", "Size", "Position", "Overflow"],
  appearance: ["Colors", "Background", "BorderRadius"],
  effects: ["Shadow", "Effects", "Motion"],
  settings: [
    "Attributes",
    "Accessibility",
    "Classes",
    "Interactions",
    "DataRepeaters",
    "ConditionalVisibility",
  ],
} as const;

// ============================================================================
// GROUP DEFINITIONS
// ============================================================================

export const GROUPS: GroupConfig[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT TAB - Base Groups (always)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Display",
    tab: "layout",
    title: "Display",
    showIf: "always",
    essentialsProps: ["layout.display", "layout.visibility"],
    advancedProps: ["layout.boxSizing", "layout.isolation", "layout.contain"],
  },
  {
    id: "Spacing",
    tab: "layout",
    title: "Spacing",
    showIf: "always",
    essentialsProps: ["spacing.margin", "spacing.padding", "layout.gap"],
    advancedProps: ["spacing.negativeMargin", "spacing.rowGap", "spacing.columnGap"],
  },
  {
    id: "Size",
    tab: "layout",
    title: "Size",
    showIf: "always",
    essentialsProps: ["size.width", "size.height"],
    advancedProps: [
      "size.minWidth",
      "size.maxWidth",
      "size.minHeight",
      "size.maxHeight",
      "size.aspectRatio",
    ],
  },
  {
    id: "Position",
    tab: "layout",
    title: "Position",
    showIf: "always",
    essentialsProps: ["position.position", "position.anchorUI"],
    advancedProps: ["position.inset", "position.zIndex"],
  },
  {
    id: "Overflow",
    tab: "layout",
    title: "Overflow",
    showIf: "always",
    essentialsProps: ["overflow.overflow"],
    advancedProps: [
      "overflow.overflowX",
      "overflow.overflowY",
      "overflow.scrollBehavior",
      "overflow.scrollSnapType",
      "overflow.scrollSnapAlign",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // LAYOUT TAB - Conditional Groups
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Flex",
    tab: "layout",
    title: "Flex",
    showIf: "ctx.display == 'flex'",
    essentialsProps: ["flex.direction", "flex.justify", "flex.align", "flex.wrap", "layout.gap"],
    advancedProps: [
      "flex.alignContent",
      "flex.childGrow",
      "flex.childShrink",
      "flex.childBasis",
      "flex.childOrder",
      "flex.childAlignSelf",
    ],
  },
  {
    id: "Grid",
    tab: "layout",
    title: "Grid",
    showIf: "ctx.display == 'grid'",
    essentialsProps: ["grid.columns", "grid.rows", "layout.gap"],
    advancedProps: [
      "grid.areas",
      "grid.autoFlow",
      "grid.autoRows",
      "grid.autoCols",
      "grid.placeItems",
      "grid.placeContent",
      "grid.placeSelf",
      "grid.itemPlacement",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APPEARANCE TAB - Conditional Group (Typography)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Typography",
    tab: "appearance",
    title: "Typography",
    showIf: "ctx.isTextLike == true",
    essentialsProps: [
      "typography.fontFamily",
      "typography.fontSize",
      "typography.fontWeight",
      "typography.lineHeight",
      "typography.textAlign",
      "typography.letterSpacing",
    ],
    advancedProps: [
      "typography.textTransform",
      "typography.textDecoration",
      "typography.whiteSpace",
      "typography.wordBreak",
      "typography.overflowWrap",
      "typography.textOverflow",
      "typography.textShadow",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APPEARANCE TAB - Base Groups (always)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Colors",
    tab: "appearance",
    title: "Colors",
    showIf: "always",
    essentialsProps: ["colors.textColor", "colors.backgroundColor", "colors.borderColor"],
    advancedProps: ["effects.opacity", "colors.mixBlendMode"],
  },
  {
    id: "Background",
    tab: "appearance",
    title: "Background",
    showIf: "always",
    essentialsProps: [
      "background.backgroundColor",
      "background.backgroundImage",
      "background.gradientPreset",
    ],
    advancedProps: [
      "background.size",
      "background.position",
      "background.repeat",
      "background.attachment",
      "background.clip",
      "background.origin",
    ],
  },
  {
    id: "BorderRadius",
    tab: "appearance",
    title: "Border & Radius",
    showIf: "always",
    essentialsProps: ["border.border", "border.radius"],
    advancedProps: [
      "border.borderTop",
      "border.borderRight",
      "border.borderBottom",
      "border.borderLeft",
      "border.outline",
      "border.outlineOffset",
    ],
  },
  {
    id: "Shadow",
    tab: "effects",
    title: "Shadow",
    showIf: "always",
    essentialsProps: ["effects.shadowPreset"],
    advancedProps: ["effects.boxShadow", "typography.textShadow"],
  },
  {
    id: "Effects",
    tab: "effects",
    title: "Effects",
    showIf: "always",
    essentialsProps: ["effects.opacity", "effects.transformPreset"],
    advancedProps: [
      "effects.transform",
      "effects.filter",
      "effects.backdropFilter",
      "effects.clipPath",
    ],
  },
  {
    id: "Motion",
    tab: "effects",
    title: "Motion",
    showIf: "always",
    essentialsProps: ["motion.transitionPreset"],
    advancedProps: ["motion.transition", "motion.animation"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // APPEARANCE TAB - Conditional (Icon)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Icon",
    tab: "appearance",
    title: "Icon",
    showIf: "ctx.elementType == 'icon'",
    essentialsProps: ["icon.pick", "icon.size", "icon.strokeWidth", "colors.textColor"],
    advancedProps: ["icon.fillMode", "icon.rotation"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS TAB - Conditional Groups
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Media",
    tab: "settings",
    title: "Media",
    showIf: "ctx.isMedia == true",
    essentialsProps: ["media.src", "media.alt", "media.objectFit"],
    advancedProps: ["media.objectPosition", "media.loading", "media.decoding"],
  },
  {
    id: "Content",
    tab: "settings",
    title: "Content",
    showIf: "ctx.hasContent == true",
    essentialsProps: ["content.text", "content.label"],
    advancedProps: ["content.placeholder"],
  },
  {
    id: "Link",
    tab: "settings",
    title: "Link",
    showIf: "ctx.isLinkLike == true",
    essentialsProps: ["link.type", "link.href"],
    advancedProps: ["link.target", "link.rel"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS TAB - Base Groups (always)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "DataRepeaters",
    tab: "settings",
    title: "Data / Repeaters",
    showIf: "always",
    essentialsProps: ["data.collection", "data.bindField"],
    advancedProps: [
      "data.repeaterEnabled",
      "data.mapping",
      "data.filters",
      "data.sort",
      "data.limit",
      "data.emptyState",
    ],
  },
  {
    id: "ConditionalVisibility",
    tab: "settings",
    title: "Conditional Visibility",
    showIf: "always",
    essentialsProps: ["visibilityRules.enabled", "visibilityRules.simpleRule"],
    advancedProps: ["visibilityRules.groups", "visibilityRules.previewData"],
  },
  {
    id: "Interactions",
    tab: "settings",
    title: "Interactions",
    showIf: "always",
    essentialsProps: ["interactions.add", "interactions.list"],
    advancedProps: ["interactions.conditions", "interactions.timing", "interactions.variables"],
  },
  {
    id: "Attributes",
    tab: "settings",
    title: "Attributes",
    showIf: "always",
    essentialsProps: ["attributes.id"],
    advancedProps: ["attributes.dataAttrs", "attributes.customAttrs"],
  },
  {
    id: "Accessibility",
    tab: "settings",
    title: "Accessibility",
    showIf: "always",
    essentialsProps: ["a11y.ariaLabel"],
    advancedProps: ["a11y.role", "a11y.tabIndex", "a11y.ariaControls", "a11y.ariaExpanded"],
  },
  {
    id: "Classes",
    tab: "settings",
    title: "Classes",
    showIf: "always",
    essentialsProps: ["classes.applied", "classes.add"],
    advancedProps: ["classes.reorder", "classes.createFromStyles", "classes.convertInline"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS TAB - Dev Mode Only
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "AllCSS",
    tab: "settings",
    title: "All CSS",
    showIf: "ctx.devMode == true",
    essentialsProps: ["allCss.addProperty"],
    advancedProps: ["allCss.list", "allCss.resetAll"],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // SETTINGS TAB - Element-Specific (Complex Components)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "Modal",
    tab: "settings",
    title: "Modal",
    showIf: "ctx.elementType == 'modal'",
    essentialsProps: [
      "modal.openTrigger",
      "modal.closeBehavior",
      "modal.overlay",
      "modal.scrollLock",
    ],
    advancedProps: [
      "modal.focusTrap",
      "modal.closeOnEsc",
      "modal.closeOnOutsideClick",
      "modal.zIndex",
    ],
  },
  {
    id: "Tabs",
    tab: "settings",
    title: "Tabs",
    showIf: "ctx.elementType == 'tabs'",
    essentialsProps: ["tabs.items", "tabs.defaultTab", "tabs.behavior"],
    advancedProps: ["tabs.animate", "tabs.urlSync", "tabs.lazyMount"],
  },
  {
    id: "Accordion",
    tab: "settings",
    title: "Accordion",
    showIf: "ctx.elementType == 'accordion'",
    essentialsProps: ["accordion.items", "accordion.defaultOpen", "accordion.behavior"],
    advancedProps: ["accordion.multipleOpen", "accordion.animate", "accordion.iconPosition"],
  },
  {
    id: "Slider",
    tab: "settings",
    title: "Slider",
    showIf: "ctx.elementType == 'slider'",
    essentialsProps: [
      "slider.slides",
      "slider.autoplay",
      "slider.navUI",
      "slider.transitionPreset",
    ],
    advancedProps: ["slider.loop", "slider.drag", "slider.pauseOnHover", "slider.easing"],
  },
  {
    id: "Navbar",
    tab: "settings",
    title: "Navbar",
    showIf: "ctx.elementType == 'navbar'",
    essentialsProps: ["navbar.menuItems", "navbar.logo", "navbar.sticky", "navbar.mobileCollapse"],
    advancedProps: ["navbar.breakpoint", "navbar.activeLinkStyle", "navbar.animation"],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all groups for a specific tab
 */
export function getGroupsForTab(tab: TabName): GroupConfig[] {
  return GROUPS.filter((g) => g.tab === tab);
}

/**
 * Get a specific group by ID
 */
export function getGroupById(groupId: string): GroupConfig | undefined {
  return GROUPS.find((g) => g.id === groupId);
}

/**
 * Check if a group is a base group (always shown)
 */
export function isBaseGroup(groupId: string, tab: TabName): boolean {
  const baseGroups = BASE_GROUPS_ALWAYS_ON[tab as keyof typeof BASE_GROUPS_ALWAYS_ON];
  return baseGroups?.includes(groupId as never) ?? false;
}

/**
 * Get all property IDs for a group (both essentials and advanced)
 */
export function getGroupProperties(groupId: string): string[] {
  const group = getGroupById(groupId);
  if (!group) return [];
  return [...group.essentialsProps, ...group.advancedProps];
}

/**
 * Find which group a property belongs to
 */
export function findGroupForProperty(propertyId: string): GroupConfig | undefined {
  return GROUPS.find(
    (g) => g.essentialsProps.includes(propertyId) || g.advancedProps.includes(propertyId)
  );
}

/**
 * Check if a property is in the advanced section of its group
 */
export function isAdvancedProperty(propertyId: string): boolean {
  const group = findGroupForProperty(propertyId);
  return group?.advancedProps.includes(propertyId) ?? false;
}

/**
 * Get search keywords for a group (includes title, id, and property names)
 */
export function getGroupSearchKeywords(group: GroupConfig): string[] {
  const keywords = [group.id.toLowerCase(), group.title.toLowerCase()];

  // Add property IDs as keywords
  for (const prop of [...group.essentialsProps, ...group.advancedProps]) {
    // Extract the property name part (e.g., "typography.fontSize" -> "fontSize", "fontSize")
    const parts = prop.split(".");
    keywords.push(...parts.map((p) => p.toLowerCase()));
  }

  return keywords;
}

/**
 * Check if a group matches a search query
 */
export function groupMatchesSearch(group: GroupConfig, query: string): boolean {
  if (!query) return true;

  const q = query.toLowerCase().trim();
  const keywords = getGroupSearchKeywords(group);

  return keywords.some((kw) => kw.includes(q) || q.includes(kw));
}
