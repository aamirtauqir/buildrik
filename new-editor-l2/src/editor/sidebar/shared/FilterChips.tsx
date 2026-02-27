/**
 * FilterChips - Scrollable horizontal filter chip row
 * Used for category filtering in Suggestions, Styling tabs
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================
// Types
// ============================================

export interface FilterChip {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterChipsProps {
  /** Available filter chips */
  chips: FilterChip[];
  /** Currently selected chip ID */
  value: string;
  /** Selection change handler */
  onChange: (id: string) => void;
  /** Optional class name */
  className?: string;
  /** Optional style prop */
  style?: React.CSSProperties;
}

// ============================================
// Component
// ============================================

export const FilterChips: React.FC<FilterChipsProps> = ({
  chips,
  value,
  onChange,
  className,
  style,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight" && index < chips.length - 1) {
      e.preventDefault();
      onChange(chips[index + 1].id);
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      onChange(chips[index - 1].id);
    }
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...containerStyles, ...style }}
      role="tablist"
      aria-label="Filter options"
    >
      {chips.map((chip, index) => {
        const isActive = value === chip.id;
        return (
          <button
            key={chip.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            style={{
              ...chipStyles,
              ...(isActive ? chipActiveStyles : {}),
            }}
            onClick={() => onChange(chip.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            {chip.icon && <span style={iconStyles}>{chip.icon}</span>}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: "8px 12px",
  overflowX: "auto",
  scrollbarWidth: "none",
  WebkitOverflowScrolling: "touch",
};

const chipStyles: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 12px",
  height: 28,
  background: "transparent",
  border: "1px solid var(--aqb-border)",
  borderRadius: 8,
  color: "var(--aqb-text-secondary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
  transition: "all 0.15s ease",
  flexShrink: 0,
};

const chipActiveStyles: React.CSSProperties = {
  background: "var(--aqb-primary)",
  borderColor: "var(--aqb-primary)",
  color: "#fff",
};

const iconStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  fontSize: 14,
};

export default FilterChips;
