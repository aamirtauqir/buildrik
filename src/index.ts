/**
 * Aquibra - Visual Web Composer
 * Modern, lightweight visual web composer built for developers
 *
 * @module aquibra
 * @version 1.0.0
 * @license BSD-3-Clause
 */

// ============================================
// Core Engine
// ============================================
export {
  Composer,
  createComposer,
  EventEmitter,
  ElementManager,
  Element,
  StyleEngine,
  CommandCenter,
  SelectionManager,
  HistoryManager,
  StorageAdapter,
  Viewport,
} from "./engine";

// ============================================
// Editor Components
// ============================================
export { AquibraStudio, Topbar, Canvas } from "./components";

// ============================================
// Panel Components
// ============================================
export { LayersPanel, StylesPanel, TraitPanel, RichTextEditor } from "./components";

// ============================================
// UI Components
// ============================================
export {
  Button,
  Modal,
  ConfirmDialog,
  ToastProvider,
  useToast,
  Tooltip,
  Tabs,
  Accordion,
  ContextMenu,
  useContextMenu,
  Spinner,
  Badge,
  Popover,
} from "./components";

// ============================================
// Form Components
// ============================================
export {
  InputField,
  NumberField,
  SelectField,
  ColorField,
  SwitchField,
  TextareaField,
  SliderField,
  CodeField,
  FileField,
  GradientPicker,
} from "./components";

// ============================================
// Themes
// ============================================
export { applyTheme, defaultTheme } from "./themes";

// ============================================
// Types
// ============================================
export type {
  ComposerConfig,
  ComposerState,
  StorageConfig,
  ProjectConfig,
  CanvasConfig,
  ThemeConfig,
  PluginConfig,
  ProjectData,
  PageData,
  ElementData,
  ElementType,
  StyleData,
  BlockData,
  CommandData,
  DeviceType,
  ExportOptions,
  ExportResult,
} from "./shared/types";

// ============================================
// Default Export
// ============================================
import { AquibraStudio } from "./components";
export default AquibraStudio;
