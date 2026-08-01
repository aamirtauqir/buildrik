/**
 * Aquibra — @buildrik/editor public API
 *
 * Notes:
 *   - Package has no `main`/`module`/`exports` in package.json — not published.
 *     No external consumers. Active runtime entry is demo/main.tsx → editor/shell/.
 *   - This barrel kept as a clean re-export surface for any future consumer.
 *   - Components dropped from this barrel (Topbar, Canvas, LayersPanel,
 *     StylesPanel, TraitPanel, RichTextEditor, Accordion, Badge, form fields):
 *     2026-05-02 graveyard cleanup. Future consumers import from canonical
 *     paths under src/editor/ (incl. editor/ui/) or src/shared/forms/ directly
 *     (src/shared/ui/ deleted 2026-07-28, Slice 6B).
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
// Editor Shell
// ============================================
export { AquibraStudio } from "./editor/shell/AquibraStudio";

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
import { AquibraStudio } from "./editor/shell/AquibraStudio";
export default AquibraStudio;
