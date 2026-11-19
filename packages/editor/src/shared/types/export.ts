/**
 * Export System Types
 * Type definitions for exporting designs to HTML/CSS
 * @license BSD-3-Clause
 */

import type { AnalyticsConfig, StripeConfig } from "./index";
import { DEVICE_PREVIEW_SIZES } from "../constants/breakpoints";

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = "html" | "zip" | "json" | "react" | "vue" | "nextjs";

/**
 * CSS export style
 */
export type CSSExportStyle = "inline" | "embedded" | "external";

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Export format */
  format: ExportFormat;
  /** Include CSS in output */
  includeCSS: boolean;
  /** CSS export style */
  cssStyle: CSSExportStyle;
  /** Minify output */
  minify: boolean;
  /** Include meta tags */
  includeMeta: boolean;
  /** Include viewport meta */
  includeViewport: boolean;
  /** Custom page title */
  pageTitle?: string;
  /** Custom meta description */
  metaDescription?: string;
  /** Include reset CSS */
  includeResetCSS: boolean;
  /** Prefix for CSS classes */
  cssPrefix: string;
  /** Include comments in output */
  includeComments: boolean;
  /** Analytics configuration for script injection */
  analytics?: AnalyticsConfig;
  /** Stripe payment integration configuration */
  stripe?: StripeConfig;
}

/**
 * Default export configuration
 */
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "html",
  includeCSS: true,
  cssStyle: "embedded",
  minify: false,
  includeMeta: true,
  includeViewport: true,
  pageTitle: "Buildrick Export",
  metaDescription: "",
  includeResetCSS: true,
  cssPrefix: "buildrick-",
  includeComments: false,
};

// ============================================================================
// EXPORT RESULT
// ============================================================================

/**
 * Exported file data
 */
export interface ExportedFile {
  /** File name */
  name: string;
  /** File content */
  content: string;
  /** MIME type */
  mimeType: string;
}

/**
 * Export result
 */
export interface ExportResult {
  /** Export was successful */
  success: boolean;
  /** HTML content */
  html?: string;
  /** CSS content (if external) */
  css?: string;
  /** All exported files */
  files?: ExportedFile[];
  /** Error message */
  error?: string;
  /** Stats about the export */
  stats?: ExportStats;
}

/**
 * Export statistics
 */
export interface ExportStats {
  /** Total elements exported */
  elementCount: number;
  /** Total CSS rules */
  cssRuleCount: number;
  /** HTML size in bytes */
  htmlSize: number;
  /** CSS size in bytes */
  cssSize: number;
  /** Export timestamp */
  timestamp: string;
}

// ============================================================================
// PREVIEW OPTIONS
// ============================================================================

/**
 * Preview device types
 */
export type PreviewDevice = "desktop" | "tablet" | "mobile";

/**
 * Device dimensions
 */
export interface DeviceDimensions {
  width: number;
  height: number;
  label: string;
}

/**
 * Preview device configurations
 */
/* Widths come from the one device table (L1-013): export used to call 1440
   "Desktop" while the canvas drew 1024 and Preview 1320. */
const { desktop, tablet, mobile } = DEVICE_PREVIEW_SIZES;
export const PREVIEW_DEVICES: Record<PreviewDevice, DeviceDimensions> = {
  desktop: { width: desktop.width, height: 900, label: `Desktop (${desktop.width}px)` },
  tablet: { width: tablet.width, height: 1024, label: `Tablet (${tablet.width}px)` },
  mobile: { width: mobile.width, height: 667, label: `Mobile (${mobile.width}px)` },
};

// ============================================================================
// CODE PREVIEW
// ============================================================================

/**
 * Code preview tab types
 */
export type CodeTab = "html" | "css" | "preview";

/**
 * Code preview state
 */
export interface CodePreviewState {
  /** Active tab */
  activeTab: CodeTab;
  /** Current preview device */
  previewDevice: PreviewDevice;
  /** Show line numbers */
  showLineNumbers: boolean;
  /** Wrap long lines */
  wrapLines: boolean;
  /** Theme (light/dark) */
  theme: "light" | "dark";
}
