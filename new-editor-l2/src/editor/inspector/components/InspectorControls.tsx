/**
 * Inspector Controls - Search and Collapse/Expand All
 * Phase 7: Aquibra Hybrid Inspector Approach
 *
 * @license BSD-3-Clause
 */

import * as React from "react";

// ============================================================================
// TYPES
// ============================================================================

interface InspectorControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  expandedCount: number;
  totalCount: number;
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
    gap: 8,
    padding: "8px 16px",
    background: "rgba(0, 0, 0, 0.15)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
  },
  searchContainer: {
    flex: 1,
    position: "relative" as const,
  },
  searchInput: {
    width: "100%",
    padding: "7px 32px 7px 12px",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    color: "#e4e4e7",
    fontSize: 12,
    outline: "none",
    transition: "all 0.15s",
  },
  searchInputFocused: {
    background: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(0, 115, 230, 0.5)",
  },
  searchIcon: {
    position: "absolute" as const,
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#6c7086",
    fontSize: 12,
    pointerEvents: "none" as const,
  },
  clearButton: {
    position: "absolute" as const,
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    padding: 4,
    background: "transparent",
    border: "none",
    color: "#6c7086",
    fontSize: 12,
    cursor: "pointer",
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCount: {
    fontSize: 10,
    color: "#6c7086",
    whiteSpace: "nowrap" as const,
  },
  controlButton: {
    padding: "5px 8px",
    background: "transparent",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    color: "#6c7086",
    fontSize: 11,
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  controlButtonHover: {
    background: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.2)",
    color: "#cdd6f4",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export const InspectorControls: React.FC<InspectorControlsProps> = ({
  searchQuery,
  onSearchChange,
  expandedCount,
  totalCount,
  onCollapseAll,
  onExpandAll,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [hoveredButton, setHoveredButton] = React.useState<string | null>(null);

  return (
    <div style={styles.container}>
      {/* Search */}
      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search properties..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            ...styles.searchInput,
            ...(isFocused ? styles.searchInputFocused : {}),
          }}
          aria-label="Search inspector properties"
        />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange("")}
            style={styles.clearButton}
            title="Clear search"
            aria-label="Clear search"
          >
            ✕
          </button>
        ) : (
          <span style={styles.searchIcon}>🔍</span>
        )}
      </div>

      {/* Section count */}
      <span style={styles.sectionCount}>
        {expandedCount}/{totalCount}
      </span>

      {/* Collapse All */}
      <button
        onClick={onCollapseAll}
        onMouseEnter={() => setHoveredButton("collapse")}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          ...styles.controlButton,
          ...(hoveredButton === "collapse" ? styles.controlButtonHover : {}),
        }}
        title="Collapse all sections"
        aria-label="Collapse all sections"
      >
        ▲
      </button>

      {/* Expand All */}
      <button
        onClick={onExpandAll}
        onMouseEnter={() => setHoveredButton("expand")}
        onMouseLeave={() => setHoveredButton(null)}
        style={{
          ...styles.controlButton,
          ...(hoveredButton === "expand" ? styles.controlButtonHover : {}),
        }}
        title="Expand all sections"
        aria-label="Expand all sections"
      >
        ▼
      </button>
    </div>
  );
};

export default InspectorControls;
