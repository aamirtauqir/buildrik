/**
 * Layout Tab - Display, Position, Dimensions, Flexbox, Grid, Visibility
 *
 * KEY CHANGE: Base groups (Display, Spacing, Size, Position, Overflow) now
 * render for ALL elements. Conditional groups (Flex, Grid) use showIf evaluation.
 *
 * @module components/Panels/ProInspector/tabs/LayoutTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import { evaluateShowIf } from "../config/contextEvaluator";
import { FlexboxSection } from "../sections/flexbox";
import { GridSection } from "../sections/GridSection";
import { LayoutSection } from "../sections/layout";
import { SizeSection } from "../sections/SizeSection";
import { SpacingSection } from "../sections/SpacingSection";
import { VisibilitySection } from "../sections/VisibilitySection";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import type { CssContext } from "../shared/cssContext";
import { matchesSectionSearch } from "../shared/sectionConfig";
import type { BaseTabProps, PropertyStates } from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface LayoutTabProps extends BaseTabProps {
  /** Property states for contextual UI (disabled, hidden, etc.) */
  propertyStates?: PropertyStates;
  /** Section to auto-expand based on element type */
  autoExpandSection?: "layout" | "size" | null;
  /** CSS context for conditional groups and property states */
  cssContext: CssContext;
  /** Search query for filtering sections */
  searchQuery?: string;
}

export const LayoutTab: React.FC<LayoutTabProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  autoExpandSection,
  cssContext,
  searchQuery = "",
}) => {
  const q = searchQuery.toLowerCase().trim();

  // Get inspector context for showIf evaluation
  const ctx = cssContext.inspectorContext;

  // ═══════════════════════════════════════════════════════════════════════════
  // BASE GROUPS - Always render for ALL elements (Rule A)
  // ═══════════════════════════════════════════════════════════════════════════
  const showLayout = matchesSectionSearch("layout", q) || matchesSectionSearch("Display", q);
  const showSize = matchesSectionSearch("size", q) || matchesSectionSearch("Size", q);
  const showSpacing = matchesSectionSearch("spacing", q) || matchesSectionSearch("Spacing", q);

  // Position and Overflow are also base groups (always shown)
  const showPosition = matchesSectionSearch("Position", q);
  const showOverflow = matchesSectionSearch("Overflow", q);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONDITIONAL GROUPS - Use showIf evaluation (Rule B)
  // ═══════════════════════════════════════════════════════════════════════════

  // Flex: only when display == 'flex' or 'inline-flex'
  const flexVisible =
    evaluateShowIf("ctx.display == 'flex'", ctx) || cssContext.display === "inline-flex";
  const showFlexbox = flexVisible && matchesSectionSearch("flexbox", q);

  // Grid: only when display == 'grid' or 'inline-grid'
  const gridVisible =
    evaluateShowIf("ctx.display == 'grid'", ctx) || cssContext.display === "inline-grid";
  const showGrid = gridVisible && matchesSectionSearch("grid", q);

  // Visibility is a base group (always available for responsive hiding)
  const showVisibility = matchesSectionSearch("visibility", q);

  // Check if any results match search
  const hasResults =
    showLayout ||
    showSize ||
    showSpacing ||
    showPosition ||
    showOverflow ||
    showFlexbox ||
    showGrid ||
    showVisibility;

  if (q && !hasResults) {
    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: INSPECTOR_TOKENS.textTertiary,
          fontSize: 13,
        }}
      >
        No layout properties match "{searchQuery}"
      </div>
    );
  }

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          BASE GROUPS - Always shown for all elements
          ═══════════════════════════════════════════════════════════════════ */}

      {showLayout && (
        <LayoutSection
          styles={styles}
          onChange={onChange}
          onBatchChange={onBatchChange}
          propertyStates={propertyStates}
          isOpen={autoExpandSection === "layout" || !!q ? true : undefined}
        />
      )}

      {showSize && (
        <SizeSection
          styles={styles}
          onChange={onChange}
          propertyStates={propertyStates}
          isOpen={autoExpandSection === "size" || !!q ? true : undefined}
        />
      )}

      {showSpacing && (
        <SpacingSection
          styles={styles}
          onChange={onChange}
          onBatchChange={onBatchChange}
          propertyStates={propertyStates}
        />
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          CONDITIONAL GROUPS - Shown based on context
          ═══════════════════════════════════════════════════════════════════ */}

      {/* Flexbox - only when display:flex */}
      {showFlexbox && (
        <FlexboxSection styles={styles} onChange={onChange} propertyStates={propertyStates} />
      )}

      {/* Grid - only when display:grid */}
      {showGrid && (
        <GridSection
          styles={styles}
          onChange={onChange}
          isGridContainer={cssContext.isGridContainer}
          isGridItem={cssContext.isGridItem}
        />
      )}

      {/* Visibility - always available for responsive hiding */}
      {showVisibility && <VisibilitySection styles={styles} onChange={onChange} />}
    </>
  );
};

export default LayoutTab;
