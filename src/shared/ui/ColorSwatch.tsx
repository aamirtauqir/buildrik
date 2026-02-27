/**
 * ColorSwatch Component
 * Compact color display with selection state
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Tooltip } from "./Tooltip";

export interface ColorSwatchProps {
  color: string;
  size?: "xs" | "sm" | "md" | "lg";
  selected?: boolean;
  tooltip?: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ColorSwatch: React.FC<ColorSwatchProps> = ({
  color,
  size = "md",
  selected = false,
  tooltip,
  disabled = false,
  onClick,
  className = "",
  style,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const sizeMap = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
  };

  const dimension = sizeMap[size];
  const isTransparent = color === "transparent" || color === "";
  const isWhite =
    color.toLowerCase() === "#ffffff" || color.toLowerCase() === "#fff" || color === "white";

  const containerStyles: React.CSSProperties = {
    position: "relative",
    width: dimension,
    height: dimension,
    borderRadius: size === "xs" ? 3 : "var(--aqb-radius-sm)",
    cursor: disabled ? "not-allowed" : onClick ? "pointer" : "default",
    opacity: disabled ? 0.4 : 1,
    transition: "all var(--aqb-transition-fast)",
    transform: isHovered && onClick ? "scale(1.1)" : "scale(1)",
    ...style,
  };

  const checkerboardStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: `
      linear-gradient(45deg, #666 25%, transparent 25%),
      linear-gradient(-45deg, #666 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #666 75%),
      linear-gradient(-45deg, transparent 75%, #666 75%)
    `,
    backgroundSize: "8px 8px",
    backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
  };

  const colorStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    background: isTransparent ? "transparent" : color,
  };

  const borderStyles: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "inherit",
    border: selected
      ? "2px solid var(--aqb-primary)"
      : isWhite || isTransparent
        ? "1px solid var(--aqb-border)"
        : "1px solid transparent",
    boxShadow: selected ? "0 0 0 2px var(--aqb-primary-light)" : "none",
    pointerEvents: "none",
  };

  const swatch = (
    <div
      className={`aqb-color-swatch ${selected ? "selected" : ""} ${className}`}
      style={containerStyles}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      aria-selected={selected}
      aria-label={tooltip || `Color: ${color}`}
    >
      <div style={checkerboardStyles} />
      <div style={colorStyles} />
      <div style={borderStyles} />
    </div>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} position="top">
        {swatch}
      </Tooltip>
    );
  }

  return swatch;
};

export const ColorSwatchGroup: React.FC<{
  colors: string[];
  selectedColor?: string;
  size?: ColorSwatchProps["size"];
  onSelect?: (color: string) => void;
  className?: string;
  style?: React.CSSProperties;
}> = ({ colors, selectedColor, size = "sm", onSelect, className = "", style }) => {
  return (
    <div
      className={`aqb-color-swatch-group ${className}`}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        ...style,
      }}
    >
      {colors.map((color) => (
        <ColorSwatch
          key={color}
          color={color}
          size={size}
          selected={selectedColor === color}
          onClick={onSelect ? () => onSelect(color) : undefined}
          tooltip={color}
        />
      ))}
    </div>
  );
};

export default ColorSwatch;
