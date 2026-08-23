/**
 * Aquibra Constants
 * Central export for all application constants
 *
 * @module constants
 * @license BSD-3-Clause
 */

// Event constants
export {
  EVENTS,
  DOCUMENT_CHANGED_EVENTS,
  isNavigationOnlyChange,
  type EventName,
  type EventCategory,
  isValidEventName,
  getEventsByPrefix,
} from "./events";

// Command constants
export {
  COMMANDS,
  SHORTCUTS,
  type CommandId,
  type CommandCategory,
  isValidCommand,
  getShortcut,
} from "./commands";

// Configuration constants
export {
  DATA_ATTRIBUTES,
  MIME_TYPES,
  STORAGE_KEYS,
  THRESHOLDS,
  DEFAULTS,
  API,
  FEATURES,
  type DataAttribute,
  type MimeType,
  type StorageKey,
  type FeatureFlag,
  isFeatureEnabled,
} from "./config";

// Canvas constants
export {
  CANVAS_COLORS,
  BUTTON_BASE_STYLE,
  PANEL_STYLE,
  INPUT_STYLE,
  DROPDOWN_STYLE,
  LABEL_STYLE,
  GROUP_HEADER_STYLE,
  Z_INDEX,
  SIZES,
  DEVICE_PRESETS,
  ZOOM_PRESETS,
  ZOOM_LIMITS,
} from "./canvas";

// Breakpoint constants
export {
  BREAKPOINTS,
  BREAKPOINT_ORDER,
  BREAKPOINT_QUERIES,
  getBreakpointQuery,
  getBreakpointConfig,
  isValidBreakpoint,
  getBreakpointForWidth,
} from "./breakpoints";

// Default element styles
export { DEFAULT_ELEMENT_STYLES, getDefaultStyles, hasDefaultStyles } from "./defaultStyles";

// Shared UI Styles (Single Source of Truth)
export {
  UI,
  TEXT_STYLES,
  COLOR,
  SPACE,
  CARD_STYLES,
  TAB_STYLES,
  ACCORDION_STYLES,
  BADGE_STYLES,
  LABEL_STYLES,
  INPUT_STYLES,
  UI_ANIMATIONS,
  mergeStyles,
} from "./uiStyles";
