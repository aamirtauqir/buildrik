/**
 * Configuration Module Exports
 * Barrel file for the data-driven ProInspector configuration layer.
 *
 * @license BSD-3-Clause
 */

// Element Profiles — rewritten in Phase 6 restructure. The old
// essentials/defaultOpenGroups concept is gone; profiles now declare
// per-tab section order for the contextual InspectorTabContent renderer.
export {
  getProfileFor,
  getDefaultTab,
  ALL_PROFILE_ELEMENT_TYPES,
  PROFILE_MAP,
} from "./elementProfiles";
export type { ElementProfile } from "./elementProfiles";

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

// SectionId and the canonical section list now live in
// `sections/registry.tsx` — see `ALL_REGISTRY_SECTION_IDS` and `SectionId`
// exports there. The old `ALL_SECTION_IDS` const here was removed during
// the Phase 6 restructure because it duplicated registry state and drifted.

// Context Evaluator
export {
  buildInspectorContext,
  evaluateShowIf,
  shouldShowGroup,
  evaluateGroupVisibility,
} from "./contextEvaluator";
export type { InspectorContext, ContextBuilderInput } from "./contextEvaluator";
