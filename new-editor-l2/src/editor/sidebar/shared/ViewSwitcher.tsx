/**
 * ViewSwitcher - Dropdown for switching between views (e.g., Layers/Pages)
 * Replaces horizontal sub-tabs with a cleaner dropdown pattern
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ChevronIcon, CheckIcon } from "./headerIcons";

export interface ViewOption<T extends string = string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
}

export interface ViewSwitcherProps<T extends string = string> {
  /** Currently selected view */
  value: T;
  /** Available view options */
  options: ViewOption<T>[];
  /** Callback when view changes */
  onChange: (value: T) => void;
  /** Label prefix (default: "View") */
  label?: string;
  /** Full width mode */
  fullWidth?: boolean;
}

export function ViewSwitcher<T extends string = string>({
  value,
  options,
  onChange,
  label = "View",
  fullWidth = false,
}: ViewSwitcherProps<T>): React.ReactElement {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close on outside click
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelect = (optionId: T) => {
    onChange(optionId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ ...containerStyles, ...(fullWidth ? { width: "100%" } : {}) }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          ...triggerStyles,
          ...(isOpen ? triggerOpenStyles : {}),
          ...(fullWidth ? { width: "100%" } : {}),
        }}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span style={labelStyles}>
          <span style={labelPrefixStyles}>{label}:</span>
          {selectedOption?.icon && <span style={iconWrapStyles}>{selectedOption.icon}</span>}
          <span style={labelValueStyles}>{selectedOption?.label || "Select..."}</span>
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {isOpen && (
        <div style={dropdownStyles} role="listbox">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              style={{
                ...optionStyles,
                ...(option.id === value ? optionSelectedStyles : {}),
              }}
              role="option"
              aria-selected={option.id === value}
            >
              {option.icon && <span style={optionIconStyles}>{option.icon}</span>}
              <span>{option.label}</span>
              {option.id === value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Styles
// ============================================

const containerStyles: React.CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const triggerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  height: 28,
  padding: "0 10px",
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-md)",
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  transition: "background 0.15s ease, border-color 0.15s ease",
  minWidth: 120,
};

const triggerOpenStyles: React.CSSProperties = {
  background: "var(--aqb-surface-4)",
  borderColor: "var(--aqb-border-hover)",
};

const labelStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const labelPrefixStyles: React.CSSProperties = {
  color: "var(--aqb-text-secondary)",
  fontWeight: 400,
};

const labelValueStyles: React.CSSProperties = {
  color: "var(--aqb-text-primary)",
};

const iconWrapStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  color: "var(--aqb-text-secondary)",
};

const dropdownStyles: React.CSSProperties = {
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  minWidth: 140,
  padding: 4,
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-border)",
  borderRadius: "var(--aqb-radius-md)",
  boxShadow: "var(--aqb-shadow-lg)",
  zIndex: "var(--aqb-z-dropdown)",
};

const optionStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  width: "100%",
  padding: "8px 10px",
  background: "transparent",
  border: "none",
  borderRadius: "var(--aqb-radius-sm)",
  color: "var(--aqb-text-primary)",
  fontSize: 12,
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "left",
  transition: "background 0.1s ease",
};

const optionSelectedStyles: React.CSSProperties = {
  background: "var(--aqb-primary-subtle)",
  color: "var(--aqb-primary)",
};

const optionIconStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  color: "var(--aqb-text-secondary)",
};

export default ViewSwitcher;
