/**
 * Inspector Controls — search + expand/collapse all. Ported to --bd-* tokens.
 *
 * @license BSD-3-Clause
 */

import { ChevronsDownUp, ChevronsUpDown, Search, X } from "lucide-react";
import * as React from "react";

interface InspectorControlsProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
}

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  } as React.CSSProperties,
  searchContainer: {
    flex: 1,
    position: "relative",
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,
  searchIcon: {
    position: "absolute",
    left: 7,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--bd-fg-muted)",
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
  } as React.CSSProperties,
  searchInput: {
    width: "100%",
    height: 24,
    padding: "0 24px 0 24px",
    background: "var(--bd-bg-subtle)",
    border: "1px solid transparent",
    borderRadius: 4,
    color: "var(--bd-fg-primary)",
    font: "500 11.5px var(--bd-font)",
    outline: "none",
    transition: "background 120ms, border-color 120ms, box-shadow 120ms",
  } as React.CSSProperties,
  searchInputFocused: {
    background: "#fff",
    borderColor: "var(--bd-accent)",
    boxShadow: "0 0 0 2px rgba(45, 109, 255, 0.12)",
  } as React.CSSProperties,
  clearButton: {
    position: "absolute",
    right: 3,
    top: "50%",
    transform: "translateY(-50%)",
    width: 18,
    height: 18,
    padding: 0,
    background: "rgba(15, 23, 42, 0.06)",
    border: "none",
    color: "var(--bd-fg-muted)",
    cursor: "pointer",
    borderRadius: 3,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as React.CSSProperties,
  iconButton: {
    width: 22,
    height: 22,
    padding: 0,
    background: "transparent",
    border: "none",
    color: "var(--bd-fg-muted)",
    cursor: "pointer",
    transition: "color 120ms, background 120ms",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 3,
    flexShrink: 0,
  } as React.CSSProperties,
  iconButtonHover: {
    background: "rgba(15, 23, 42, 0.06)",
    color: "var(--bd-fg-primary)",
  } as React.CSSProperties,
};

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
      <div style={styles.searchContainer}>
        <span style={styles.searchIcon}>
          <Search size={11} aria-hidden="true" />
        </span>
        <input
          id="inspector-search-input"
          type="text"
          placeholder="Search · /"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
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
            type="button"
            onClick={() => onSearchChange("")}
            style={styles.clearButton}
            title="Clear search"
            aria-label="Clear search"
          >
            <X size={10} aria-hidden="true" />
          </button>
        )}
      </div>

      <button
        type="button"
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
        <ChevronsDownUp size={12} aria-hidden="true" />
      </button>

      <button
        type="button"
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
        <ChevronsUpDown size={12} aria-hidden="true" />
      </button>
    </div>
  );
};

export default InspectorControls;
