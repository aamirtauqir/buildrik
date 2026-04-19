/**
 * @lint-hex-policy: component-theme
 *   Intentional component-specific palette. Chrome-hex lint rules do not apply.
 *
 * Inspector Controls - Search and Collapse/Expand All
 * Phase 7: Aquibra Hybrid Inspector Approach
 *
 * @license BSD-3-Clause
 */

import { ChevronsDownUp, ChevronsUpDown, Search, X } from "lucide-react";
import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

interface InspectorControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    background: "transparent",
    borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
  },
  searchContainer: {
    flex: 1,
    position: "relative" as const,
  },
  searchInput: {
    width: "100%",
    padding: "6px 28px 6px 28px",
    background: "rgba(255, 255, 255, 0.04)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 6,
    color: "#e4e4e7",
    fontSize: 12,
    outline: "none",
    transition: "all 0.15s",
  },
  searchInputFocused: {
    background: "rgba(255, 255, 255, 0.07)",
    borderColor: "rgba(0, 115, 230, 0.5)",
  },
  searchIcon: {
    position: "absolute" as const,
    left: 8,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--buildrick-text-muted)",
    pointerEvents: "none" as const,
    display: "flex",
    alignItems: "center",
  },
  clearButton: {
    position: "absolute" as const,
    right: 4,
    top: "50%",
    transform: "translateY(-50%)",
    padding: 4,
    background: "transparent",
    border: "none",
    color: "var(--buildrick-text-muted)",
    cursor: "pointer",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  iconButton: {
    width: 26,
    height: 26,
    padding: 0,
    background: "transparent",
    border: "none",
    color: "var(--buildrick-text-muted)",
    cursor: "pointer",
    transition: "color 0.15s, background 0.15s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  iconButtonHover: {
    background: "rgba(255, 255, 255, 0.06)",
    color: "#cdd6f4",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const InspectorControls: React.FC<InspectorControlsProps> = ({
  searchQuery,
  onSearchChange,
  onCollapseAll,
  onExpandAll,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  return (
    <div style={styles.container}>
      {/* Search */}
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>
          <Search size={13} aria-hidden="true" />
        </span>
        <input
          id="inspector-search-input"
          type="text"
          placeholder="Search…  (press /)"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            // Escape clears the query and unfocuses. Clearing via onSearchChange
            // also collapses the PropertySearchResults view back to normal tabs.
            if (e.key === "Escape") {
              e.preventDefault();
              onSearchChange("");
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          style={{
            ...styles.searchInput,
            ...(isFocused ? styles.searchInputFocused : {}),
          }}
          aria-label="Search inspector properties"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            style={styles.clearButton}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Collapse All */}
      <button
        onClick={onCollapseAll}
        onMouseEnter={() => setHoveredButton("collapse")}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          ...styles.iconButton,
          ...(hoveredButton === "collapse" ? styles.iconButtonHover : {}),
        }}
        title="Collapse all sections"
        aria-label="Collapse all sections"
      >
        <ChevronsDownUp size={14} aria-hidden="true" />
      </button>

      {/* Expand All */}
      <button
        onClick={onExpandAll}
        onMouseEnter={() => setHoveredButton("expand")}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          ...styles.iconButton,
          ...(hoveredButton === "expand" ? styles.iconButtonHover : {}),
        }}
        title="Expand all sections"
        aria-label="Expand all sections"
      >
        <ChevronsUpDown size={14} aria-hidden="true" />
      </button>
    </div>
  );
};

export default InspectorControls;
