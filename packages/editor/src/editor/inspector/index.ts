/**
 * editor/inspector — Property editor for selected element (Layout, Style, Advanced)
 * Integration: L2 — fully wired (reads from composer.selection, updates via composer.styles)
 *
 * Public API: ProInspector component + props type.
 * Sections, hooks, and sub-components are internal to this module.
 *
 * @license BSD-3-Clause
 */

// Main inspector component
export { ProInspector } from "./ProInspector";
export type { ProInspectorProps } from "./ProInspector";
