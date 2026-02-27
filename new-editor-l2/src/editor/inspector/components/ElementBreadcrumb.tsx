/**
 * Element Breadcrumb Navigation
 * Shows clickable path from root to selected element
 * Click any ancestor to select it
 *
 * Features:
 * - Click breadcrumb item to select ancestor
 * - "Show in Layers" button to switch to Layers tab + scroll
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../engine";
import { EVENTS } from "../../../shared/constants/events";

// ============================================================================
// TYPES
// ============================================================================

export interface ElementBreadcrumbProps {
  selectedElement: {
    id: string;
    type: string;
    tagName?: string;
  } | null;
  composer?: Composer | null;
}

interface BreadcrumbItem {
  id: string;
  type: string;
  tagName: string;
  label: string;
}

// ============================================================================
// ICONS
// ============================================================================

/** Small layers icon for the "Show in Layers" button */
const LayersIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  container: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    padding: "8px 12px",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    overflowX: "auto" as const,
    scrollbarWidth: "none" as const,
    flex: 1,
    minWidth: 0,
  },
  item: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    background: "transparent",
    border: "none",
    borderRadius: 4,
    color: "#89b4fa",
    fontSize: 11,
    fontFamily: "monospace",
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap" as const,
  },
  itemHover: {
    background: "rgba(137, 180, 250, 0.2)",
  },
  itemCurrent: {
    color: "#e4e4e7",
    background: "rgba(255, 255, 255, 0.08)",
    cursor: "default",
  },
  separator: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 10,
    userSelect: "none" as const,
  },
  emptyState: {
    padding: "8px 12px",
    color: "#6c7086",
    fontSize: 11,
    fontStyle: "italic" as const,
  },
  showInLayersBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "6px 10px",
    background: "transparent",
    border: "1px solid rgba(137, 180, 250, 0.3)",
    borderRadius: 6,
    color: "#89b4fa",
    fontSize: 10,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    whiteSpace: "nowrap" as const,
    flexShrink: 0,
  },
  showInLayersBtnHover: {
    background: "rgba(137, 180, 250, 0.15)",
    borderColor: "rgba(137, 180, 250, 0.5)",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a display label for an element type
 */
function getDisplayLabel(type: string, tagName: string): string {
  // Prefer tagName if available and different from type
  if (tagName && tagName !== type) {
    return tagName.toLowerCase();
  }
  return type.toLowerCase();
}

/**
 * Build the ancestor chain from root to the selected element
 */
function buildBreadcrumbPath(elementId: string, composer: Composer): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  let current = composer.elements.getElement(elementId);

  if (!current) return path;

  // Build path from current element up to root
  while (current) {
    const id = current.getId();
    const type = current.getType?.() || "element";
    const tagName = current.getTagName?.() || type;

    path.unshift({
      id,
      type,
      tagName,
      label: getDisplayLabel(type, tagName),
    });

    const parent = current.getParent?.();
    current = parent ?? undefined;
  }

  return path;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ElementBreadcrumb: React.FC<ElementBreadcrumbProps> = ({
  selectedElement,
  composer,
}) => {
  const [path, setPath] = React.useState<BreadcrumbItem[]>([]);
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);
  const [showLayersBtnHover, setShowLayersBtnHover] = React.useState(false);

  // Build path when selection changes
  React.useEffect(() => {
    if (!selectedElement?.id || !composer) {
      setPath([]);
      return;
    }

    const newPath = buildBreadcrumbPath(selectedElement.id, composer);
    setPath(newPath);
  }, [selectedElement, composer]);

  // Handle clicking on a breadcrumb item
  const handleItemClick = React.useCallback(
    (item: BreadcrumbItem, index: number) => {
      // Don't do anything if clicking the current (last) item
      if (index === path.length - 1) return;

      if (!composer) return;

      const element = composer.elements.getElement(item.id);
      if (element) {
        composer.selection.select(element);
      }
    },
    [composer, path.length]
  );

  // Handle keyboard navigation
  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent, item: BreadcrumbItem, index: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleItemClick(item, index);
      }
    },
    [handleItemClick]
  );

  // Handle "Show in Layers" button click
  const handleShowInLayers = React.useCallback(() => {
    if (!composer || !selectedElement?.id) return;
    // Emit event for AquibraStudio to switch to Layers tab
    composer.emit(EVENTS.SHOW_IN_LAYERS, { elementId: selectedElement.id });
  }, [composer, selectedElement]);

  // Don't render if no path or only one item (root)
  if (path.length <= 1) {
    return null;
  }

  return (
    <div style={styles.wrapper}>
      <nav style={styles.container} aria-label="Element hierarchy" role="navigation">
        {path.map((item, index) => {
          const isLast = index === path.length - 1;
          const isHovered = hoveredIndex === index;

          return (
            <React.Fragment key={item.id}>
              <button
                type="button"
                style={{
                  ...styles.item,
                  ...(isHovered && !isLast ? styles.itemHover : {}),
                  ...(isLast ? styles.itemCurrent : {}),
                }}
                onClick={() => handleItemClick(item, index)}
                onKeyDown={(e) => handleKeyDown(e, item, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                tabIndex={isLast ? -1 : 0}
                aria-current={isLast ? "location" : undefined}
                aria-label={`Select ${item.label} element`}
                title={isLast ? "Current element" : `Click to select ${item.label}`}
              >
                {item.label}
              </button>
              {!isLast && (
                <span style={styles.separator} aria-hidden="true">
                  {">"}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>
      {/* Show in Layers button - Phase 6 UX Audit */}
      <button
        type="button"
        style={{
          ...styles.showInLayersBtn,
          ...(showLayersBtnHover ? styles.showInLayersBtnHover : {}),
        }}
        onClick={handleShowInLayers}
        onMouseEnter={() => setShowLayersBtnHover(true)}
        onMouseLeave={() => setShowLayersBtnHover(false)}
        aria-label="Show this element in Layers panel"
        title="Show in Layers (opens Layers tab and scrolls to element)"
      >
        <LayersIcon />
        Layers
      </button>
    </div>
  );
};

export default ElementBreadcrumb;
