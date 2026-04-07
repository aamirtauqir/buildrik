/**
 * Configuration Module Exports
 * Barrel file for the data-driven ProInspector configuration layer.
 *
 * @license BSD-3-Clause
 */

// Element Profiles
export {
  getElementProfile,
  getDefaultTab,
  getEssentialsForTab,
  getDefaultOpenGroups,
  isEssentialProperty,
} from "./elementProfiles";
export type { ElementProfile, EssentialsConfig, DefaultOpenGroups } from "./elementProfiles";

// Groups Configuration
export {
  GROUPS,
  BASE_GROUPS_ALWAYS_ON,
  getGroupsForTab,
  getGroupById,
  isBaseGroup,
  getGroupProperties,
  findGroupForProperty,
  isAdvancedProperty,
  getGroupSearchKeywords,
  groupMatchesSearch,
} from "./groupsConfig";
export type { GroupConfig } from "./groupsConfig";

// Properties Registry
export {
  PROPERTIES,
  getProperty,
  getCssProperty,
  isUiOnlyProperty,
  isResponsiveProperty,
  supportsStates,
  getPropertyType,
  getAllPropertyIds,
  searchProperties,
  getAdvancedPropsForGroup,
} from "./propertiesRegistry";
export type { PropertyDefinition, PropertyType } from "./propertiesRegistry";

// Section Config
export {
  getVisibleGroupsForTab,
  isGroupVisible,
  matchesSectionSearch,
  SECTION_KEYWORDS,
} from "./sectionConfig";
export type {
  LayoutSectionName,
  DesignSectionName,
  SettingsSectionName,
  AllSectionName,
} from "./sectionConfig";

// CSS Context
export { deriveCssContext, getPropertyStates } from "./cssContext";
export type { CssContext } from "./cssContext";

// Section IDs — canonical list for expandAll and expand tracking
/** Canonical list of all inspector section IDs — used by expandAll() */
export const ALL_SECTION_IDS = [
  "layout",
  "size",
  "spacing",
  "typography",
  "background",
  "border",
  "effects",
  "animation",
  "interactions",
  "visibility",
] as const;

export type SectionId = (typeof ALL_SECTION_IDS)[number];

// Context Evaluator
export {
  buildInspectorContext,
  evaluateShowIf,
  shouldShowGroup,
  evaluateGroupVisibility,
} from "./contextEvaluator";
export type { InspectorContext, ContextBuilderInput } from "./contextEvaluator";
