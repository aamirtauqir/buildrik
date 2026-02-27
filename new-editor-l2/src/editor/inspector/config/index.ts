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
} from "./propertiesRegistry";
export type { PropertyDefinition, PropertyType } from "./propertiesRegistry";

// Context Evaluator
export {
  buildInspectorContext,
  evaluateShowIf,
  shouldShowGroup,
  evaluateGroupVisibility,
} from "./contextEvaluator";
export type { InspectorContext, ContextBuilderInput } from "./contextEvaluator";
