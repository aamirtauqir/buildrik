/**
 * UI Types
 * Types for panels, toolbars, and basic export interfaces
 *
 * @module types/ui
 * @license BSD-3-Clause
 */

// ============================================
// Export Types (basic/core versions)
// ============================================

export interface ExportOptions {
  /** Include inline styles */
  inlineStyles?: boolean;
  /** Minify output */
  minify?: boolean;
  /** Include only selected elements */
  selectedOnly?: boolean;
  /** Clean unused styles */
  cleanStyles?: boolean;
}

export interface ExportResult {
  /** HTML content */
  html: string;
  /** CSS content */
  css: string;
  /** Combined HTML document */
  combined: string;
}

// ============================================
// UI Types
// ============================================

export interface PanelConfig {
  /** Panel ID */
  id: string;
  /** Panel title */
  title: string;
  /** Panel icon */
  icon?: string;
  /** Panel position */
  position: "left" | "right" | "top" | "bottom";
  /** Panel width/height */
  size?: number;
  /** Is resizable */
  resizable?: boolean;
  /** Is collapsible */
  collapsible?: boolean;
  /** Default collapsed state */
  collapsed?: boolean;
}

export interface ToolbarItem {
  /** Item ID */
  id: string;
  /** Item label */
  label?: string;
  /** Item icon */
  icon?: string;
  /** Item type */
  type: "button" | "toggle" | "dropdown" | "separator";
  /** Command to run */
  command?: string;
  /** Is active */
  active?: boolean;
  /** Is disabled */
  disabled?: boolean;
  /** Dropdown items */
  items?: ToolbarItem[];
}
