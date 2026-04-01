/**
 * SearchBar - Search input for sidebar tabs
 * Debounces onChange to parent (300ms default) while keeping input visually instant
 * @license BSD-3-Clause
 */

import * as React from "react";
import { trackSidebar } from "../../../shared/utils/sidebarAnalytics";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Accessible label for the search input (WCAG 1.3.1) */
  ariaLabel?: string;
  /** Debounce delay in ms (default: 300, 0 = instant) */
  debounceMs?: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  ariaLabel = "Search",
  debounceMs = 300,
}) => {
  // Internal state for instant visual feedback
  const [inputValue, setInputValue] = React.useState(value);
  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();

  // Sync internal state when parent value changes (e.g., external clear)
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Cleanup timer on unmount
  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (newValue: string) => {
    setInputValue(newValue);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (debounceMs <= 0) {
      onChange(newValue);
      return;
    }

    timerRef.current = setTimeout(() => {
      onChange(newValue);
      if (newValue.length > 0) {
        trackSidebar("search", { query_length: newValue.length });
      }
    }, debounceMs);
  };

  const handleClear = () => {
    // Clear is immediate — no debounce on explicit user action
    if (timerRef.current) clearTimeout(timerRef.current);
    setInputValue("");
    onChange("");
  };

  return (
    <div style={containerStyles} role="search">
      <SearchIcon />
      <input
        type="text"
        value={inputValue}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyles}
        aria-label={ariaLabel}
      />
      {inputValue && (
        <button onClick={handleClear} style={clearButtonStyles} aria-label="Clear search">
          <ClearIcon />
        </button>
      )}
    </div>
  );
};

const SearchIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    style={{ flexShrink: 0 }}
  >
    <circle cx="6" cy="6" r="4" />
    <path d="M9 9l3 3" strokeLinecap="round" />
  </svg>
);

const ClearIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M3 3l6 6M9 3l-6 6" strokeLinecap="round" />
  </svg>
);

const containerStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  margin: 0,
  padding: "8px 12px",
  background: "var(--aqb-surface-3)",
  border: "1px solid var(--aqb-bg-active)",
  borderRadius: 12,
  color: "var(--aqb-text-muted)",
  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
};

const inputStyles: React.CSSProperties = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "var(--aqb-text-primary)",
  fontSize: "var(--aqb-text-base)",
  outline: "none",
  lineHeight: "18px",
};

const clearButtonStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 2,
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "var(--aqb-text-muted)",
  borderRadius: "var(--aqb-radius-sm)",
};

export default SearchBar;
