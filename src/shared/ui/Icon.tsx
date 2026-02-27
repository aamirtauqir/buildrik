/**
 * Unified Icon Component
 * Standardized icon rendering using Lucide icons
 * @license BSD-3-Clause
 */

import * as LucideIcons from "lucide-react";
import * as React from "react";
import { devWarn } from "../../shared/utils/devLogger";

/** Icon names from Lucide library */
export type IconName = keyof typeof LucideIcons;

/** Icon size presets */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/** Icon color variants */
export type IconColor =
  | "inherit"
  | "primary"
  | "secondary"
  | "muted"
  | "error"
  | "success"
  | "warning"
  | "ai";

export interface IconProps {
  /** Name of the Lucide icon */
  name: IconName;
  /** Size preset or specific pixel value */
  size?: IconSize | number;
  /** Color variant */
  color?: IconColor;
  /** Additional CSS class */
  className?: string;
  /** Custom stroke width (default: 1.5) */
  strokeWidth?: number;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Accessibility label */
  "aria-label"?: string;
  /** Hide from screen readers */
  "aria-hidden"?: boolean;
}

const SIZE_MAP: Record<IconSize, number> = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
};

const COLOR_MAP: Record<IconColor, string> = {
  inherit: "currentColor",
  primary: "var(--aqb-primary)",
  secondary: "var(--aqb-text-secondary)",
  muted: "var(--aqb-text-muted)",
  error: "var(--aqb-error)",
  success: "var(--aqb-success)",
  warning: "var(--aqb-warning)",
  ai: "var(--aqb-ai)",
};

/**
 * Unified Icon component using Lucide icons
 * Provides consistent sizing, colors, and styling across the app
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = "md",
  color = "inherit",
  className,
  strokeWidth = 1.5,
  style,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden = true,
}) => {
  // Get the Lucide icon component
  const LucideIcon = LucideIcons[name] as React.ComponentType<{
    size: number;
    strokeWidth: number;
    color: string;
    className?: string;
    style?: React.CSSProperties;
    "aria-label"?: string;
    "aria-hidden"?: boolean;
  }>;

  if (!LucideIcon) {
    devWarn("Icon", `Icon "${name}" not found in Lucide icons`);
    return null;
  }

  // Calculate size
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size];

  // Get color value
  const colorValue = COLOR_MAP[color];

  return (
    <LucideIcon
      size={pixelSize}
      strokeWidth={strokeWidth}
      color={colorValue}
      className={`aqb-icon ${className || ""}`}
      style={style}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
    />
  );
};

// Common icon presets for ProInspector sections
export const SECTION_ICONS = {
  layout: "LayoutGrid",
  size: "Ruler",
  spacing: "MoveHorizontal",
  typography: "Type",
  background: "Palette",
  border: "Square",
  effects: "Sparkles",
  animation: "Zap",
  interactions: "MousePointer",
  flexbox: "AlignHorizontalSpaceBetween",
  grid: "Grid3X3",
  visibility: "Eye",
  keyboard: "Keyboard",
  customCss: "Code",
} as const;

export default Icon;
