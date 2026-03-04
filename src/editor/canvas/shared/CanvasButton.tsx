/**
 * Canvas Button Component
 * Shared button component for canvas UI elements
 * @license BSD-3-Clause
 */

import * as React from "react";
import { CANVAS_COLORS, BUTTON_BASE_STYLE } from "../../../shared/constants/canvas";

export interface CanvasButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  variant?: "default" | "primary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_STYLES: Record<string, React.CSSProperties> = {
  sm: { padding: "4px 8px", fontSize: 12 },
  md: { padding: "6px 10px", fontSize: 12 },
  lg: { padding: "8px 14px", fontSize: 13 },
};

const VARIANT_STYLES: Record<string, { base: React.CSSProperties; hover: React.CSSProperties }> = {
  default: {
    base: {
      background: "rgba(255,255,255,0.06)",
      border: `1px solid ${CANVAS_COLORS.border}`,
      color: CANVAS_COLORS.textPrimary,
    },
    hover: {
      background: CANVAS_COLORS.bgHover,
    },
  },
  primary: {
    base: {
      background: CANVAS_COLORS.primaryGradient,
      border: "none",
      color: CANVAS_COLORS.bgPanel,
      fontWeight: 600,
    },
    hover: {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 12px rgba(137, 180, 250, 0.3)",
    },
  },
  danger: {
    base: {
      background: CANVAS_COLORS.errorBg,
      border: `1px solid ${CANVAS_COLORS.errorBorder}`,
      color: CANVAS_COLORS.error,
      fontWeight: 600,
    },
    hover: {
      background: "rgba(243, 139, 168, 0.25)",
    },
  },
  ghost: {
    base: {
      background: "transparent",
      border: "none",
      color: CANVAS_COLORS.textSecondary,
    },
    hover: {
      background: CANVAS_COLORS.bgHover,
      color: CANVAS_COLORS.textPrimary,
    },
  },
};

/**
 * Reusable button component for canvas UI
 */
export const CanvasButton: React.FC<CanvasButtonProps> = ({
  onClick,
  icon,
  label,
  active = false,
  disabled = false,
  title,
  variant = "default",
  size = "md",
  className,
  style,
  ...rest
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const buttonStyle: React.CSSProperties = {
    ...BUTTON_BASE_STYLE,
    ...sizeStyle,
    ...variantStyle.base,
    ...(active && {
      background: CANVAS_COLORS.primary,
      color: "#fff",
    }),
    ...(isHovered && !disabled && variantStyle.hover),
    ...(disabled && {
      opacity: 0.5,
      cursor: "not-allowed",
    }),
    ...style,
  };

  return (
    <button
      {...rest}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      className={className}
      style={buttonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon && <span>{icon}</span>}
      {label && <span>{label}</span>}
    </button>
  );
};

export default CanvasButton;
