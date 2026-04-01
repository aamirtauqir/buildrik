/**
 * Appearance Tab - Typography, Background, Border (daily styling)
 * Split from DesignTab as part of C-01 fix (reduce 6-section mega-tab).
 *
 * @module components/Panels/ProInspector/tabs/AppearanceTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType, IconConfig } from "../../../shared/types/media";
import { evaluateShowIf } from "../config/contextEvaluator";
import { getAdvancedPropsForGroup } from "../config";
import { BackgroundSection } from "../sections/BackgroundSection";
import { BorderSection } from "../sections/BorderSection";
import { TypographySection } from "../sections/typography";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import type { CssContext } from "../config/cssContext";
import { matchesSectionSearch } from "../config/sectionConfig";
import { useAdvancedSettings } from "../hooks/useAdvancedSettings";
import type { BaseTabProps } from "../shared/types";
import { ElementSettingsFooter } from "../components/ElementSettingsFooter";

// ============================================================================
// TYPES
// ============================================================================

export interface AppearanceTabProps extends BaseTabProps {
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  onOpenIconPicker?: (
    currentIcon: IconConfig | undefined,
    onSelect: (icon: IconConfig) => void
  ) => void;
  autoExpandSection?: "typography" | null;
  searchQuery?: string;
  cssContext?: CssContext;
  devMode?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

// Build the advanced props map once (stable reference, outside render)
const APPEARANCE_TAB_ADVANCED_PROPS: Record<string, string[]> = {
  typography: getAdvancedPropsForGroup("typography"),
  colors: getAdvancedPropsForGroup("colors"),
  background: getAdvancedPropsForGroup("background"),
  border: getAdvancedPropsForGroup("border"),
};

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  composer,
  selectedElement,
  currentPseudoState,
  styles,
  onChange,
  onBatchChange,
  onOpenMediaLibrary,
  onOpenIconPicker,
  autoExpandSection,
  searchQuery = "",
  cssContext,
  devMode,
}) => {
  const q = searchQuery.toLowerCase().trim();
  const ctx = cssContext?.inspectorContext;

  // Advanced settings state — tracks which section "More settings" is expanded
  const { isExpanded: isAdvancedExpanded, toggle: toggleAdvanced } = useAdvancedSettings({
    advancedPropsMap: APPEARANCE_TAB_ADVANCED_PROPS,
    searchQuery: q,
  });

  // Typography: only when isTextLike == true
  const typographyVisible = ctx ? evaluateShowIf("ctx.isTextLike == true", ctx) : true;
  const showTypography = typographyVisible && matchesSectionSearch("typography", q);
  const showBackground =
    matchesSectionSearch("background", q) || matchesSectionSearch("Background", q);
  const showBorder = matchesSectionSearch("border", q) || matchesSectionSearch("BorderRadius", q);

  const hasResults = showTypography || showBackground || showBorder;

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
        No appearance properties match &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <>
      {showTypography && (
        <TypographySection
          styles={styles}
          onChange={onChange}
          isOpen={autoExpandSection === "typography" || !!q ? true : undefined}
          advancedExpanded={isAdvancedExpanded("typography")}
          onAdvancedToggle={() => toggleAdvanced("typography")}
        />
      )}

      {showBackground && (
        <BackgroundSection
          styles={styles}
          onChange={onChange}
          onOpenMediaLibrary={onOpenMediaLibrary}
          advancedExpanded={isAdvancedExpanded("background")}
          onAdvancedToggle={() => toggleAdvanced("background")}
        />
      )}

      {showBorder && (
        <BorderSection
          styles={styles}
          onChange={onChange}
          onBatchChange={onBatchChange}
          advancedExpanded={isAdvancedExpanded("border")}
          onAdvancedToggle={() => toggleAdvanced("border")}
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

export default AppearanceTab;
