/**
 * editor/panels — Secondary panels (Layers, RichText, History)
 * Integration: L2 for LayersPanel, RichTextEditor; L1 for VersionHistoryPanel (read-only)
 *
 * @license BSD-3-Clause
 */

// Layers panel (element hierarchy tree)
export { LayersPanel } from "./layers/index";
export type { LayersPanelProps, SelectedElementInfo, LayerItem } from "./layers/types";

// Rich text inline editor (canvas overlay)
export { RichTextEditor } from "./RichTextEditor";

// Version history (read-only, L1)
export { VersionHistoryPanel } from "./VersionHistoryPanel";
