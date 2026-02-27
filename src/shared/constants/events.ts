/**
 * Aquibra Event Constants
 * Centralized event names for type-safe event handling
 *
 * @module constants/events
 * @license BSD-3-Clause
 */

/**
 * All event names used throughout the Aquibra engine
 * Using const assertion for type safety
 */
export const EVENTS = {
  // ============================================
  // Composer Lifecycle Events
  // ============================================
  COMPOSER_READY: "composer:ready",
  COMPOSER_DESTROY: "composer:destroy",

  // ============================================
  // Project Events
  // ============================================
  PROJECT_CHANGED: "project:changed",
  PROJECT_SAVED: "project:saved",
  PROJECT_LOADED: "project:loaded",
  PROJECT_CLEARED: "project:cleared",
  SETTINGS_CHANGE: "settings:change",

  // ============================================
  // Element Events
  // ============================================
  ELEMENT_SELECTED: "element:selected",
  ELEMENT_DESELECTED: "element:deselected",
  ELEMENT_CREATED: "element:created",
  ELEMENT_DELETED: "element:deleted",
  ELEMENT_MOVED: "element:moved",
  ELEMENT_RESIZED: "element:resized",
  ELEMENT_UPDATED: "element:updated",
  ELEMENT_REPARENTED: "element:reparented",
  ELEMENT_DUPLICATED: "element:duplicated",
  /** Quick-add child element to a parent */
  ELEMENT_QUICK_ADD: "element:quick-add",
  /** Begin inline text edit on element */
  ELEMENT_EDIT_INLINE: "element:edit-inline",
  /** Add a hyperlink to element */
  ELEMENT_ADD_LINK: "element:add-link",
  /** Replace the image of an image element */
  ELEMENT_CHANGE_IMAGE: "element:change-image",
  /** Edit alt text of an image element */
  ELEMENT_EDIT_ALT: "element:edit-alt",

  // ============================================
  // Layer Panel Events
  // ============================================
  LAYER_HOVER: "layer:hover",

  // ============================================
  // Selection Events
  // ============================================
  SELECTION_CHANGED: "selection:changed",
  SELECTION_CLEARED: "selection:cleared",
  /** Multi-select mode activated with 2+ elements selected */
  SELECTION_MULTIPLE: "selection:multiple",
  /** Element added to current selection */
  SELECTION_ADDED: "selection:added",
  /** Element removed from current selection */
  SELECTION_REMOVED: "selection:removed",

  // ============================================
  // Style Events
  // ============================================
  STYLE_CHANGED: "style:changed",
  STYLE_APPLIED: "style:applied",
  STYLE_BREAKPOINT_SET: "style:breakpoint:set",
  STYLE_BREAKPOINT_CLEARED: "style:breakpoint:cleared",

  // ============================================
  // Transaction Events
  // ============================================
  TRANSACTION_BEGIN: "transaction:begin",
  TRANSACTION_END: "transaction:end",

  // ============================================
  // History Events (Undo/Redo)
  // ============================================
  HISTORY_PUSH: "history:push",
  HISTORY_UNDO: "history:undo",
  HISTORY_REDO: "history:redo",
  HISTORY_CHANGED: "history:changed",
  HISTORY_CLEARED: "history:cleared",
  HISTORY_RECORDED: "history:recorded",

  // ============================================
  // Version History Events (AQUI-031)
  // ============================================
  VERSION_CREATED: "version:created",
  VERSION_RESTORED: "version:restored",
  VERSION_DELETED: "version:deleted",
  VERSION_EXPORTED: "version:exported",
  VERSION_IMPORTED: "version:imported",
  VERSION_LIST_UPDATED: "version:list:updated",

  // ============================================
  // Component Events (AQUI-027)
  // ============================================
  COMPONENT_CREATE_REQUESTED: "component:create-requested",
  COMPONENT_CREATED: "component:created",
  COMPONENT_UPDATED: "component:updated",
  COMPONENT_DELETED: "component:deleted",
  COMPONENT_INSTANTIATED: "component:instantiated",
  COMPONENT_LIST_UPDATED: "component:list:updated",
  INSTANCE_SYNCED: "instance:synced",
  INSTANCE_DETACHED: "instance:detached",
  INSTANCE_OVERRIDE: "instance:override",
  INSTANCE_VARIANT_CHANGED: "instance:variant:changed", // GAP-FIX: Variant change event

  // ============================================
  // Clipboard Events
  // ============================================
  CLIPBOARD_COPY: "clipboard:copy",
  CLIPBOARD_CUT: "clipboard:cut",
  CLIPBOARD_PASTE: "clipboard:paste",

  // ============================================
  // Data Binding Events
  // ============================================
  BINDING_CREATED: "binding:created",
  BINDING_REMOVED: "binding:removed",
  BINDING_UPDATED: "binding:updated",

  // ============================================
  // Template Events
  // ============================================
  TEMPLATE_LOADED: "template:loaded",
  TEMPLATE_SAVED: "template:saved",
  TEMPLATE_APPLIED: "template:applied",
  TEMPLATE_REMOVED: "template:removed",

  // ============================================
  // Plugin Events
  // ============================================
  PLUGIN_REGISTERED: "plugin:registered",
  PLUGIN_LOADED: "plugin:loaded",
  PLUGIN_LOADED_FROM_URL: "plugin:loaded-from-url",
  PLUGIN_UNLOADED: "plugin:unloaded",
  PLUGIN_UNREGISTERED: "plugin:unregistered",
  PLUGIN_ENABLED: "plugin:enabled",
  PLUGIN_DISABLED: "plugin:disabled",
  PLUGIN_ERROR: "plugin:error",

  // ============================================
  // Canvas Events
  // ============================================
  CANVAS_READY: "canvas:ready",
  CANVAS_RESIZE: "canvas:resize",
  CANVAS_ZOOM: "canvas:zoom",
  CANVAS_PAN: "canvas:pan",
  CANVAS_SCROLL: "canvas:scroll",
  /** Pointer entered a canvas element (hover tracking) */
  CANVAS_HOVER: "canvas:hover",

  // ============================================
  // Canvas Indicator Events
  // ============================================
  OVERLAY_UPDATED: "overlay:updated",
  OVERLAY_TOGGLED: "overlay:toggled",
  SPACING_TOGGLED: "spacing:toggled",
  SPACING_UPDATED: "spacing:updated",
  BADGES_TOGGLED: "badges:toggled",
  BADGE_SET: "badge:set",
  BADGE_REMOVED: "badge:removed",
  GRID_TOGGLED: "grid:toggled",
  GUIDES_TOGGLED: "guides:toggled",
  GUIDE_ADDED: "guide:added",
  GUIDE_REMOVED: "guide:removed",
  GUIDES_CLEARED: "guides:cleared",
  RULERS_TOGGLED: "rulers:toggled",
  SMART_GUIDES_UPDATED: "smart-guides:updated",
  DISTANCE_UPDATED: "distance:updated",
  DIMENSIONS_UPDATED: "dimensions:updated",

  // ============================================
  // Viewport Events
  // ============================================
  VIEWPORT_CHANGED: "viewport:changed",
  VIEWPORT_ZOOM: "viewport:zoom",
  VIEWPORT_PAN: "viewport:pan",
  VIEWPORT_FIT: "viewport:fit",

  // ============================================
  // Drag & Drop Events
  // ============================================
  DRAG_START: "drag:start",
  DRAG_MOVE: "drag:move",
  DRAG_END: "drag:end",
  DRAG_CANCEL: "drag:cancel",
  DROP_ZONE_DROP: "dropzone:drop",

  // ============================================
  // Resize Events
  // ============================================
  RESIZE_START: "resize:start",
  RESIZE_MOVE: "resize:move",
  RESIZE_END: "resize:end",

  // ============================================
  // UI Panel Events
  // ============================================
  /** Open a specific inspector panel tab by name (layout/style/typography/size) */
  UI_PANEL_OPEN: "panel:open",
  /** Browse templates (opens template browser) */
  UI_BROWSE_TEMPLATES: "ui:browse-templates",
  UI_TOGGLE_TEMPLATES: "ui:toggle:templates",
  UI_TOGGLE_EXPORTER: "ui:toggle:exporter",
  UI_TOGGLE_INSPECTOR: "ui:toggle:inspector",
  UI_TOGGLE_LAYERS: "ui:toggle:layers",
  UI_TOGGLE_ASSETS: "ui:toggle:assets",
  UI_TOGGLE_CODE: "ui:toggle:code",
  UI_TOGGLE_PREVIEW: "ui:toggle:preview",
  UI_TOGGLE_AI: "ui:toggle:ai",
  UI_PANEL_RESIZE: "ui:panel:resize",

  // ============================================
  // Mode Events
  // ============================================
  MODE_CHANGED: "mode:changed",
  MODE_EDIT: "mode:edit",
  MODE_PREVIEW: "mode:preview",
  MODE_CODE: "mode:code",
  PREVIEW_MODE_CHANGED: "preview:mode:changed",

  // ============================================
  // Responsive Events
  // ============================================
  BREAKPOINT_CHANGED: "breakpoint:changed",
  RESPONSIVE_PREVIEW: "responsive:preview",

  // ============================================
  // Asset Events
  // ============================================
  ASSET_UPLOADED: "asset:uploaded",
  ASSET_DELETED: "asset:deleted",
  ASSET_SELECTED: "asset:selected",

  // ============================================
  // Font Events
  // ============================================
  FONT_LOADED: "font:loaded",
  FONT_APPLIED: "font:applied",

  // ============================================
  // Export Events
  // ============================================
  EXPORT_START: "export:start",
  EXPORT_COMPLETE: "export:complete",
  EXPORT_ERROR: "export:error",

  // ============================================
  // AI Events
  // ============================================
  AI_REQUEST_START: "ai:request:start",
  AI_REQUEST_COMPLETE: "ai:request:complete",
  AI_REQUEST_ERROR: "ai:request:error",
  AI_SUGGESTION_APPLIED: "ai:suggestion:applied",

  // ============================================
  // Form Events (AQUI-035)
  // ============================================
  FORM_REGISTERED: "form:registered",
  FORM_UNREGISTERED: "form:unregistered",
  FORM_UPDATED: "form:updated",
  FORM_SUBMITTING: "form:submitting",
  FORM_SUBMITTED: "form:submitted",
  FORM_ERROR: "form:error",
  FORM_RESET: "form:reset",

  // ============================================
  // Sync Events (AQUI-038)
  // ============================================
  SYNC_STARTED: "sync:started",
  SYNC_COMPLETED: "sync:completed",
  SYNC_ERROR: "sync:error",
  SYNC_CONFLICT: "sync:conflict",
  SYNC_CONFLICT_RESOLVED: "sync:conflict:resolved",
  NETWORK_ONLINE: "network:online",
  NETWORK_OFFLINE: "network:offline",

  // ============================================
  // Storage Events
  // ============================================
  STORAGE_ERROR: "storage:error",
  STORAGE_SAVED: "storage:saved",
  STORAGE_LOADED: "storage:loaded",

  // ============================================
  // Error Events
  // ============================================
  ERROR: "error",
  WARNING: "warning",

  // ============================================
  // Storage Quota Events
  // ============================================
  STORAGE_QUOTA_WARNING: "storage:quota:warning",
  STORAGE_QUOTA_CRITICAL: "storage:quota:critical",

  // ============================================
  // Debug Events
  // ============================================
  DEBUG_LOG: "debug:log",
  DEBUG_STATE: "debug:state",

  // ============================================
  // Page Events
  // ============================================
  PAGE_CHANGED: "page:changed",
  PAGE_CREATED: "page:created",

  // ============================================
  // Device/Zoom Events
  // ============================================
  ZOOM_CHANGED: "zoom:changed",
  ZOOM_IN: "zoom:in",
  ZOOM_OUT: "zoom:out",
  ZOOM_FIT: "zoom:fit",

  // ============================================
  // Additional Resize Events
  // ============================================
  RESIZE_CANCEL: "resize:cancel",

  // ============================================
  // Additional Template Events
  // ============================================
  TEMPLATE_DELETED: "template:deleted",
  TEMPLATES_IMPORTED: "templates:imported",
  CACHE_CLEARED: "cache:cleared",

  // ============================================
  // Collaboration Events
  // ============================================
  STATE_CHANGE: "state:change",
  SYNC_COMPLETE: "sync:complete",

  // ============================================
  // Additional Canvas Events
  // ============================================
  CANVAS_FORCE_SYNC: "canvas:force-sync",

  // ============================================
  // Navigation Events (UX Audit 2026)
  // ============================================
  /** Navigate to Layers tab and scroll to selected element */
  SHOW_IN_LAYERS: "ui:show-in-layers",
  /** Trigger scroll to selected element in Layers panel */
  LAYERS_SCROLL_TO_SELECTION: "layers:scroll-to-selection",

  // ============================================
  // Additional Style Events
  // ============================================
  STYLES_CLEARED: "styles:cleared",

  // ============================================
  // Additional Font Events
  // ============================================
  GOOGLE_FONTS_FETCHED: "google-fonts:fetched",

  // ============================================
  // Additional Project Events
  // ============================================
  PROJECT_SAVING: "project:saving",
} as const;

/**
 * Type for all valid event names
 */
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * Event name categories for documentation/tooling
 */
export type EventCategory =
  | "composer"
  | "project"
  | "element"
  | "selection"
  | "style"
  | "history"
  | "version"
  | "clipboard"
  | "data"
  | "template"
  | "canvas"
  | "viewport"
  | "drag"
  | "resize"
  | "ui"
  | "mode"
  | "responsive"
  | "asset"
  | "font"
  | "export"
  | "ai"
  | "form"
  | "sync"
  | "network"
  | "component"
  | "error"
  | "debug"
  | "page"
  | "device"
  | "zoom"
  | "content"
  | "collection"
  | "source"
  | "cache"
  | "user"
  | "room"
  | "cursor"
  | "connection"
  | "operation"
  | "divergence";

/**
 * Helper to check if a string is a valid event name
 */
export function isValidEventName(name: string): name is EventName {
  return Object.values(EVENTS).includes(name as EventName);
}

/**
 * Get all events for a specific category prefix
 */
export function getEventsByPrefix(prefix: string): EventName[] {
  return Object.values(EVENTS).filter((event) => event.startsWith(prefix)) as EventName[];
}

// ============================================
// Event Payload Types
// ============================================

/**
 * Payload types for each event category
 * Use these to type your event handlers
 */
export interface EventPayloads {
  // Composer Events
  [EVENTS.COMPOSER_READY]: import("../../engine/Composer").Composer | undefined;
  [EVENTS.COMPOSER_DESTROY]: void;

  // Project Events
  [EVENTS.PROJECT_CHANGED]: void;
  [EVENTS.PROJECT_SAVED]: import("../types").ProjectData | { saving: boolean };
  [EVENTS.PROJECT_LOADED]:
    | import("../types").ProjectData
    | {
        id?: string;
        loading?: boolean;
        importing?: boolean;
        data?: import("../types").ProjectData;
      };
  [EVENTS.PROJECT_CLEARED]: void;
  [EVENTS.SETTINGS_CHANGE]: import("../types").ProjectSettings;

  // Element Events
  [EVENTS.ELEMENT_SELECTED]: { element: import("../../engine/elements/Element").Element };
  [EVENTS.ELEMENT_DESELECTED]: { element: import("../../engine/elements/Element").Element };
  [EVENTS.ELEMENT_CREATED]: import("../../engine/elements/Element").Element;
  [EVENTS.ELEMENT_DELETED]: {
    id: string;
    element: import("../../engine/elements/Element").Element;
  };
  [EVENTS.ELEMENT_MOVED]: {
    element: import("../../engine/elements/Element").Element;
    parent: import("../../engine/elements/Element").Element;
  };
  [EVENTS.ELEMENT_RESIZED]: {
    element: import("../../engine/elements/Element").Element;
    dimensions: { width: number; height: number };
  };
  [EVENTS.ELEMENT_UPDATED]: import("../../engine/elements/Element").Element;

  // Layer Panel Events
  [EVENTS.LAYER_HOVER]: { id: string | null };

  // Selection Events
  [EVENTS.SELECTION_CHANGED]: { selected: string[] };
  [EVENTS.SELECTION_CLEARED]: void;

  // History Events
  [EVENTS.HISTORY_UNDO]: {
    entry: { timestamp: number; snapshot: import("../types").ProjectData; label?: string };
  };
  [EVENTS.HISTORY_REDO]: {
    entry: { timestamp: number; snapshot: import("../types").ProjectData; label?: string };
  };
  [EVENTS.HISTORY_RECORDED]: { label?: string };
  [EVENTS.HISTORY_CLEARED]: void;

  // Version History Events (AQUI-031)
  [EVENTS.VERSION_CREATED]: import("../types/versions").VersionCreatedPayload;
  [EVENTS.VERSION_RESTORED]: import("../types/versions").VersionRestoredPayload;
  [EVENTS.VERSION_DELETED]: import("../types/versions").VersionDeletedPayload;
  [EVENTS.VERSION_EXPORTED]: import("../types/versions").VersionExportPayload;
  [EVENTS.VERSION_IMPORTED]: import("../types/versions").VersionExportPayload;
  [EVENTS.VERSION_LIST_UPDATED]: { versions: import("../types/versions").NamedVersion[] };

  // Component Events (AQUI-027)
  [EVENTS.COMPONENT_CREATED]: import("../types/components").ComponentCreatedPayload;
  [EVENTS.COMPONENT_UPDATED]: import("../types/components").ComponentUpdatedPayload;
  [EVENTS.COMPONENT_DELETED]: import("../types/components").ComponentDeletedPayload;
  [EVENTS.COMPONENT_INSTANTIATED]: import("../types/components").ComponentInstantiatedPayload;
  [EVENTS.COMPONENT_LIST_UPDATED]: {
    components: import("../types/components").ComponentDefinition[];
  };
  [EVENTS.INSTANCE_SYNCED]: import("../types/components").InstanceSyncedPayload;
  [EVENTS.INSTANCE_DETACHED]: import("../types/components").InstanceDetachedPayload;
  [EVENTS.INSTANCE_OVERRIDE]: import("../types/components").InstanceOverridePayload;
  [EVENTS.INSTANCE_VARIANT_CHANGED]: {
    instanceId: string;
    componentId: string;
    variantId: string;
    variantName: string;
  };

  // Transaction Events
  [EVENTS.TRANSACTION_BEGIN]: { label?: string };
  [EVENTS.TRANSACTION_END]: { rolledBack?: boolean } | void;

  // Viewport Events
  [EVENTS.VIEWPORT_ZOOM]: number;
  [EVENTS.BREAKPOINT_CHANGED]: import("../types").DeviceType;

  // Error Events
  [EVENTS.ERROR]: { error: Error; operation?: string };
  [EVENTS.WARNING]: { message: string; code?: string };

  // Storage Quota Events
  [EVENTS.STORAGE_QUOTA_WARNING]: { percentage: number; used: number; quota: number };
  [EVENTS.STORAGE_QUOTA_CRITICAL]: { percentage: number; used: number; quota: number };
}

/**
 * Type-safe event handler type
 */

export type EventHandler<T extends EventName> = T extends keyof EventPayloads
  ? (_payload: EventPayloads[T]) => void
  : (_payload: unknown) => void;
