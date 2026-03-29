/**
 * Appearance Tab - Typography, Background, Border (daily styling)
 * Split from DesignTab as part of C-01 fix (reduce 6-section mega-tab).
 *
 * @module components/Panels/ProInspector/tabs/AppearanceTab
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { MediaAsset, MediaAssetType } from "../../../shared/types/media";
import { evaluateShowIf } from "../config/contextEvaluator";
import { BackgroundSection } from "../sections/BackgroundSection";
import { BorderSection } from "../sections/BorderSection";
import { TypographySection } from "../sections/typography";
import { INSPECTOR_TOKENS } from "../shared/controls/controlStyles";
import type { CssContext } from "../shared/cssContext";
import { matchesSectionSearch } from "../shared/sectionConfig";
import type { BaseTabProps } from "../shared/types";

// ============================================================================
// TYPES
// ============================================================================

export interface AppearanceTabProps extends BaseTabProps {
  onOpenMediaLibrary?: (
    allowedTypes: MediaAssetType[],
    onSelect: (asset: MediaAsset) => void
  ) => void;
  autoExpandSection?: "typography" | null;
  searchQuery?: string;
  cssContext?: CssContext;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  styles,
  onChange,
  onBatchChange,
  onOpenMediaLibrary,
  autoExpandSection,
  searchQuery = "",
  cssContext,
}) => {
  const q = searchQuery.toLowerCase().trim();
  const ctx = cssContext?.inspectorContext;

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
        />
      )}

      {showBackground && (
        <BackgroundSection
          styles={styles}
          onChange={onChange}
          onOpenMediaLibrary={onOpenMediaLibrary}
        />
      )}

      {showBorder && (
        <BorderSection styles={styles} onChange={onChange} onBatchChange={onBatchChange} />
      )}
    </>
  );
};

export default AppearanceTab;
