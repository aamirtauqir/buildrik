/**
 * Aquibra Configuration Constants
 * Centralized configuration values, MIME types, storage keys, and thresholds
 *
 * @module constants/config
 * @license BSD-3-Clause
 */

// ============================================
// Data Attributes
// ============================================

/**
 * HTML data attributes used by Aquibra
 */
export const DATA_ATTRIBUTES = {
  /** Element unique identifier */
  ELEMENT_ID: "data-aqb-id",
  /** Element type (div, span, img, etc.) */
  ELEMENT_TYPE: "data-aqb-type",
  /** Element is editable */
  EDITABLE: "data-aqb-editable",
  /** Element is selected */
  SELECTED: "data-aqb-selected",
  /** Element is hovered */
  HOVERED: "data-aqb-hovered",
  /** Element is locked */
  LOCKED: "data-aqb-locked",
  /** Element is hidden */
  HIDDEN: "data-aqb-hidden",
  /** Drop zone indicator */
  DROP_ZONE: "data-aqb-dropzone",
  /** Drag source marker */
  DRAG_SOURCE: "data-aqb-drag-source",
  /** Component type for custom elements */
  COMPONENT: "data-aqb-component",
  /** Binding reference */
  BINDING: "data-aqb-binding",
} as const;

export type DataAttribute = (typeof DATA_ATTRIBUTES)[keyof typeof DATA_ATTRIBUTES];

// ============================================
// MIME Types
// ============================================

/**
 * Custom MIME types for drag/drop operations
 */
export const MIME_TYPES = {
  /** Single element drag */
  ELEMENT: "application/x-aquibra-element",
  /** Block/component drag */
  BLOCK: "application/x-aquibra-block",
  /** Multiple elements drag */
  MULTI: "application/x-aquibra-multi",
  /** Template drag */
  TEMPLATE: "application/x-aquibra-template",
  /** Asset drag */
  ASSET: "application/x-aquibra-asset",
  /** Text content */
  TEXT: "text/plain",
  /** HTML content */
  HTML: "text/html",
  /** JSON data */
  JSON: "application/json",
} as const;

export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

// ============================================
// Storage Keys (SSOT in constants/storageKeys.ts)
// ============================================

// Re-export from the single source of truth
export { STORAGE_KEYS, type StorageKey } from "./storageKeys";

// ============================================
// Thresholds & Limits
// ============================================

/**
 * Numeric thresholds and limits
 */
export const THRESHOLDS = {
  // Zoom limits
  ZOOM_MIN: 10,
  ZOOM_MAX: 500,
  ZOOM_DEFAULT: 100,
  ZOOM_STEP: 10,

  // Drag thresholds
  DRAG_THRESHOLD: 5, // pixels before drag starts
  DRAG_SNAP: 8, // snap to grid size
  DRAG_SCROLL_MARGIN: 50, // auto-scroll margin
  DRAG_NEAR_THRESHOLD: 20, // pixels to consider "near" a drop target

  // Drop zone ratios
  DROP_ZONE_EDGE_RATIO: 0.25, // 25% edge zone
  DROP_ZONE_TOP_RATIO: 0.33, // top 1/3 for "before"
  DROP_ZONE_BOTTOM_RATIO: 0.67, // bottom 2/3 for "after"

  // Selection
  SELECTION_PADDING: 2,
  MULTI_SELECT_THRESHOLD: 3, // min pixels for marquee

  // History
  HISTORY_MAX_SIZE: 100,
  HISTORY_DEBOUNCE: 300, // ms

  // Auto-save
  AUTOSAVE_INTERVAL: 5000, // ms
  AUTOSAVE_DEBOUNCE: 1000, // ms

  // Performance
  RENDER_THROTTLE: 16, // ~60fps
  RESIZE_DEBOUNCE: 100,
  SCROLL_THROTTLE: 50,

  // Text editing
  TEXT_MIN_WIDTH: 20,
  TEXT_MIN_HEIGHT: 16,

  // Element sizing
  ELEMENT_MIN_WIDTH: 10,
  ELEMENT_MIN_HEIGHT: 10,
  ELEMENT_MAX_WIDTH: 10000,
  ELEMENT_MAX_HEIGHT: 10000,

  // Canvas
  CANVAS_PADDING: 100,
  CANVAS_MAX_WIDTH: 20000,
  CANVAS_MAX_HEIGHT: 20000,

  // Panels
  PANEL_MIN_WIDTH: 200,
  PANEL_MAX_WIDTH: 600,
  PANEL_DEFAULT_WIDTH: 280,

  // Tree depth
  MAX_NESTING_DEPTH: 50,

  // API
  API_TIMEOUT: 30000, // ms
  API_RETRY_COUNT: 3,
  API_RETRY_DELAY: 1000, // ms

  // Storage quota
  STORAGE_QUOTA_WARNING_THRESHOLD: 0.8, // 80% usage warning
  STORAGE_QUOTA_CRITICAL_THRESHOLD: 0.95, // 95% usage critical
  STORAGE_QUOTA_POLL_INTERVAL: 30000, // ms - check every 30 seconds
} as const;

// ============================================
// Default Values
// ============================================

/**
 * Default configuration values
 */
export const DEFAULTS = {
  // Project
  PROJECT_NAME: "Untitled Project",
  PROJECT_VERSION: "1.0.0",

  // Canvas
  CANVAS_WIDTH: 1440,
  CANVAS_HEIGHT: 900,
  CANVAS_BACKGROUND: "#ffffff",

  // Element
  ELEMENT_WIDTH: 100,
  ELEMENT_HEIGHT: 100,
  ELEMENT_COLOR: "#3b82f6",

  // Typography
  FONT_FAMILY: "Inter, system-ui, sans-serif",
  FONT_SIZE: 16,
  LINE_HEIGHT: 1.5,

  // Spacing
  PADDING: 16,
  MARGIN: 0,
  GAP: 8,

  // Border
  BORDER_WIDTH: 0,
  BORDER_RADIUS: 4,
  BORDER_COLOR: "#e5e7eb",

  // Colors
  PRIMARY_COLOR: "#3b82f6",
  SECONDARY_COLOR: "#6b7280",
  SUCCESS_COLOR: "#10b981",
  WARNING_COLOR: "#f59e0b",
  ERROR_COLOR: "#ef4444",
  BACKGROUND_COLOR: "#ffffff",
  TEXT_COLOR: "#1f2937",
} as const;

// ============================================
// API Configuration
// ============================================

/**
 * API endpoints and configuration
 */
export const API = {
  BASE_URL: "/api",
  AI_ENDPOINT: "/api/ai",
  ASSETS_ENDPOINT: "/api/assets",
  TEMPLATES_ENDPOINT: "/api/templates",
  EXPORT_ENDPOINT: "/api/export",

  // External services
  PLACEHOLDER_IMAGE: "https://picsum.photos",
  FONT_API: "https://fonts.googleapis.com",
} as const;

// ============================================
// CSS Class Names
// ============================================

/**
 * CSS class name prefixes and common classes
 */
export const CSS_CLASSES = {
  PREFIX: "aqb-",
  CANVAS: "aqb-canvas",
  ELEMENT: "aqb-element",
  SELECTED: "aqb-selected",
  HOVERED: "aqb-hovered",
  DRAGGING: "aqb-dragging",
  RESIZING: "aqb-resizing",
  DROP_TARGET: "aqb-drop-target",
  HIDDEN: "aqb-hidden",
  LOCKED: "aqb-locked",
  EDITABLE: "aqb-editable",
  EDITING: "aqb-editing",
} as const;

// ============================================
// Feature Flags
// ============================================

/**
 * Feature flags for enabling/disabling functionality
 */
export const FEATURES = {
  AI_ASSISTANT: true,
  TEMPLATES: true,
  CUSTOM_COMPONENTS: true,
  DATA_BINDING: true,
  RESPONSIVE_PREVIEW: true,
  CODE_EXPORT: true,
  COLLABORATION: false, // Not yet implemented
  PLUGINS: false, // Implemented but disabled - enable when ready
  VERSION_HISTORY: false, // Not yet implemented
} as const;

export type FeatureFlag = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature] ?? false;
}
