/**
 * Flexbox Control Components
 * AlignmentGrid (9-dot picker) and GapSlider
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Input } from "@/editor/ui";

// ============================================================================
// ALIGNMENT GRID - 9-dot visual alignment picker
// ============================================================================

export interface FlexAlignmentGridProps {
  justifyContent: string;
  alignItems: string;
  onJustifyChange: (value: string) => void;
  onAlignChange: (value: string) => void;
  isColumn?: boolean;
}

export const FlexAlignmentGrid: React.FC<FlexAlignmentGridProps> = ({
  justifyContent,
  alignItems,
  onJustifyChange,
  onAlignChange,
  isColumn = false,
}) => {
  // Map positions to CSS values
  const justifyValues = ["flex-start", "center", "flex-end"];
  const alignValues = ["flex-start", "center", "flex-end"];

  // Get current position (0-2 for both axes)
  const getJustifyIndex = () => {
    if (justifyContent === "flex-start" || justifyContent === "start") return 0;
    if (justifyContent === "center") return 1;
    if (justifyContent === "flex-end" || justifyContent === "end") return 2;
    return 0;
  };

  const getAlignIndex = () => {
    if (alignItems === "flex-start" || alignItems === "start") return 0;
    if (alignItems === "center") return 1;
    if (alignItems === "flex-end" || alignItems === "end") return 2;
    return 0;
  };

  const currentJustify = getJustifyIndex();
  const currentAlign = getAlignIndex();

  const handleClick = (row: number, col: number) => {
    if (isColumn) {
      onJustifyChange(alignValues[col]);
      onAlignChange(justifyValues[row]);
    } else {
      onJustifyChange(justifyValues[col]);
      onAlignChange(alignValues[row]);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 3,
        padding: 8,
        background: "var(--bk-bg-subtle)",
        borderRadius: 6,
        border: `1px solid ${"var(--bk-border)"}`,
      }}
    >
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const isActive = isColumn
            ? row === currentAlign && col === currentJustify
            : row === currentAlign && col === currentJustify;
          return (
            <Button
              key={`${row}-${col}`}
              onClick={() => handleClick(row, col)}
              style={{
                width: 20,
                height: 20,
                borderRadius: 4,
                border: "none",
                background: isActive ? "var(--bk-accent)" : "var(--bk-bg-panel)",
                cursor: "pointer",
                transition: "all 0.1s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={`Justify: ${justifyValues[col]}, Align: ${alignValues[row]}`}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 2,
                  background: isActive ? "var(--bk-accent-on)" : "var(--bk-ink-muted)",
                }}
              />
            </Button>
          );
        })
      )}
    </div>
  );
};

// ============================================================================
// GAP SLIDER - Visual slider with text input
// ============================================================================

export interface GapSliderProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const GapSlider: React.FC<GapSliderProps> = ({ value, onChange, disabled }) => {
  // Parse numeric value from CSS (e.g., "16px" -> 16)
  const numericValue = parseInt(value) || 0;
  const maxGap = 64;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
      <Input
        type="range"
        min="0"
        max={maxGap}
        value={numericValue}
        onChange={(e) => onChange(`${e.target.value}px`)}
        disabled={disabled}
        style={{
          flex: 1,
          height: 4,
          appearance: "none" as const,
          background: `linear-gradient(to right, ${"var(--bk-accent)"} 0%, ${"var(--bk-accent)"} ${
            (numericValue / maxGap) * 100
          }%, ${"var(--bk-bg-panel)"} ${
            (numericValue / maxGap) * 100
          }%, ${"var(--bk-bg-panel)"} 100%)`,
          borderRadius: 2,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
        }}
      />
      <Input
        type="text"
        value={value || "0"}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: 48,
          padding: "4px 6px",
          background: "var(--bk-bg-card)",
          border: `1px solid ${"var(--bk-border-medium)"}`,
          borderRadius: 4,
          color: "var(--bk-ink)",
          fontSize: 12,
          textAlign: "center" as const,
          outline: "none",
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  );
};
