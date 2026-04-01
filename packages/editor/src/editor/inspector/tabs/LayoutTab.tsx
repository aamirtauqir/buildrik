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
import { getAdvancedPropsForGroup } from "../config";
import { FlexboxSection } from "../sections/flexbox";
import { GridSection } from "../sections/GridSection";
import { LayoutSection } from "../sections/layout";
import { SizeSection } from "../sections/SizeSection";
import { SpacingSection } from "../sections/SpacingSection";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import type { CssContext } from "../config/cssContext";
import { matchesSectionSearch } from "../config/sectionConfig";
import { useAdvancedSettings } from "../hooks/useAdvancedSettings";
import type { BaseTabProps, PropertyStates } from "../shared/types";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { ElementSettingsFooter } from "../components/ElementSettingsFooter";

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
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  devMode?: boolean;
}

// Build the advanced props map once (stable reference, outside render)
const LAYOUT_TAB_ADVANCED_PROPS: Record<string, string[]> = {
  layout: getAdvancedPropsForGroup("layout"),
  size: getAdvancedPropsForGroup("size"),
  spacing: getAdvancedPropsForGroup("spacing"),
  position: getAdvancedPropsForGroup("position"),
  overflow: getAdvancedPropsForGroup("overflow"),
  flex: getAdvancedPropsForGroup("flex"),
  grid: getAdvancedPropsForGroup("grid"),
};

export const LayoutTab: React.FC<LayoutTabProps> = ({
  composer,
  selectedElement,
  currentPseudoState,
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  autoExpandSection,
  cssContext,
  searchQuery = "",
  onOpenMediaLibrary,
  onOpenIconPicker,
  devMode,
}) => {
  const q = searchQuery.toLowerCase().trim();

  // Advanced settings state — tracks which section "More settings" is expanded
  const { isExpanded: isAdvancedExpanded, toggle: toggleAdvanced } = useAdvancedSettings({
    advancedPropsMap: LAYOUT_TAB_ADVANCED_PROPS,
    searchQuery: q,
  });

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

  // Check if any results match search
  const hasResults =
    showLayout ||
    showSize ||
    showSpacing ||
    showPosition ||
    showOverflow ||
    showFlexbox ||
    showGrid;

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
          advancedExpanded={isAdvancedExpanded("layout")}
          onAdvancedToggle={() => toggleAdvanced("layout")}
        />
      )}

      {showSize && (
        <SizeSection
          styles={styles}
          onChange={onChange}
          propertyStates={propertyStates}
          isOpen={autoExpandSection === "size" || !!q ? true : undefined}
          advancedExpanded={isAdvancedExpanded("size")}
          onAdvancedToggle={() => toggleAdvanced("size")}
        />
      )}

      {showSpacing && (
        <SpacingSection
          styles={styles}
          onChange={onChange}
          onBatchChange={onBatchChange}
          propertyStates={propertyStates}
          advancedExpanded={isAdvancedExpanded("spacing")}
          onAdvancedToggle={() => toggleAdvanced("spacing")}
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

      <ElementSettingsFooter
        composer={composer}
        selectedElement={selectedElement}
        currentPseudoState={currentPseudoState}
        onOpenMediaLibrary={onOpenMediaLibrary}
        onOpenIconPicker={onOpenIconPicker}
        devMode={devMode}
      />
    </>
  );
};

export default LayoutTab;
