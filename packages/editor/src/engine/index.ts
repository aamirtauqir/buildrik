/**
 * Aquibra Engine
 * Core visual composer engine exports
 *
 * @module engine
 * @license BSD-3-Clause
 */

// Main Composer
export { Composer, createComposer } from "./Composer";

// Event System
export { EventEmitter } from "./EventEmitter";

// Element System
export { ElementManager } from "./elements/ElementManager";
export { Element } from "./elements/Element";

// Style System
export { StyleEngine } from "./styles/StyleEngine";

// Command System
export { CommandCenter } from "./commands/CommandCenter";

// Selection
export { SelectionManager } from "./SelectionManager";

// Drag & Drop
export { DragManager } from "./drag/DragManager";
export type {
  DragOperation,
  DragSource,
  DragStartPayload,
  DragMovePayload,
  DragEndPayload,
  DragCancelPayload,
} from "./drag/types";

// History (Undo/Redo)
export { HistoryManager } from "./HistoryManager";

// Storage
export { StorageAdapter } from "./storage/StorageAdapter";

// Viewport
export { Viewport } from "./Viewport";

// Page Routing
export { PageRouter } from "./routing/PageRouter";

// Plugin System
export { PluginManager } from "./PluginManager";

// Data Sources
export { DataManager } from "./data/DataManager";
export { TemplateEngine } from "./data/TemplateEngine";
export { StyleDataBinding } from "./data/StyleDataBinding";
export { TraitDataBinding } from "./data/TraitDataBinding";
export type { StyleBinding } from "./data/StyleDataBinding";
export type { TraitBinding } from "./data/TraitDataBinding";

// Global Styles
export { GlobalStyleManager } from "./styles/GlobalStyleManager";
export type { GlobalStyle } from "./styles/GlobalStyleManager";

// Templates
export { TemplateManager } from "./templates/TemplateManager";

// Canvas Indicators
export { CanvasIndicators } from "./canvas/indicators";

// Resize Handler
export { ResizeHandler } from "./canvas/ResizeHandler";
export type {
  HandlePosition,
  Bounds,
  TransformBounds,
  SizeConstraints,
  ResizeOptions,
} from "./canvas/ResizeHandler";

// Font Manager
export { FontManager } from "./fonts/FontManager";

// Utilities
export {
  getTransformFunction,
  applyTransform,
  registerTransform,
  hasTransform,
  builtInTransforms,
  stringTransforms,
  numberTransforms,
  dateTransforms,
  attributeTransforms,
  type TransformFunction,
} from "./utils/Transforms";

// Re-export commonly used types from types folder
export type {
  DataSource,
  DataContext,
  DataBinding,
  DataSchema,
  VariableBinding,
  CollectionBinding,
  ConditionBinding,
  TemplateExportOptions,
} from "../shared/types/data";

export type {
  SpacingIndicator,
  ElementBadge,
  CanvasOverlay,
  CanvasGuide,
  SmartGuide,
  SelectionBox,
  DragTarget,
} from "../shared/types/canvas";

export type {
  Template,
  TemplateSource,
  TemplateFilter,
  TemplateCategory,
} from "../shared/types/templates";
