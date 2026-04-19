/**
 * Typography Section - Font, Size, Weight, Color, Alignment
 * AQUI-032: Google Fonts Integration
 *
 * Refactored from TypographySection.tsx into modular sub-components:
 * - FontPicker: Font family dropdown with Google Fonts
 * - FontControls: Weight, style, decoration, spacing
 * - TypographyControls: Alignment, transform, color, white-space
 *
 * @module editor/inspector/sections/typography
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, MoreSettingsToggle, type SectionTier } from "../../shared/controls";
import { FontControls } from "./FontControls";
import { FontPicker } from "./FontPicker";
import { TypographyControls } from "./TypographyControls";
import { MixedValueBadge } from "../../shared/MixedValueBadge";

// ============================================================================
// TYPES
// ============================================================================

export interface TypographySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  /** Whether advanced settings (color, align, transform, white-space, word-break) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TypographySection: React.FC<TypographySectionProps> = ({
  styles,
  onChange,
  isOpen,
  onToggle,
  tier = "primary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
  isMultiSelect,
}) => {
  // Handle font-family changes from FontPicker
  const handleFontChange = React.useCallback(
    (value: string) => {
      onChange("font-family", value);
    },
    [onChange]
  );

  // Collapsed preview: "Inter · 14" so users can scan the current font without
  // expanding. Trim quotes and fallback stacks so only the primary face shows.
  const fontFamilyRaw = styles["font-family"] || "";
  const primaryFont = fontFamilyRaw.split(",")[0]?.replace(/["']/g, "").trim() || "";
  const fontSize = styles["font-size"] || "";
  const typographyPreview =
    primaryFont || fontSize ? (
      <span
        style={{
          fontSize: 11,
          color: "var(--buildrick-text-tertiary)",
          fontFamily: "var(--buildrick-design-font-mono)",
          whiteSpace: "nowrap",
          maxWidth: 140,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {primaryFont || "—"}
        {fontSize ? ` · ${fontSize}` : ""}
      </span>
    ) : undefined;

  return (
    <Section
      title="Typography"
      icon="Type"
      isOpen={isOpen}
      onToggle={onToggle}
      preview={typographyPreview}
      tier={tier}
      id="inspector-section-typography"
    >
      {/* Font Family Picker - AQUI-032 */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("font-family") && (
          <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <FontPicker value={styles["font-family"] || ""} onChange={handleFontChange} />
      </div>

      {/* Font Size, Weight, Line Height, Letter Spacing, Decoration, Style */}
      <FontControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} isMultiSelect={isMultiSelect} />

      {/* ─── Advanced: Color, Alignment, Transform, White Space, Word Break ─── */}
      {advancedExpanded && <TypographyControls styles={styles} onChange={onChange} mixedKeys={mixedKeys} isMultiSelect={isMultiSelect} />}

      {/* Progressive disclosure toggle */}
      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          advancedCount={5}
        />
      )}
    </Section>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { FontPicker, SYSTEM_FONTS, type SystemFont } from "./FontPicker";
export { FontControls, FONT_WEIGHTS } from "./FontControls";
export { TypographyControls } from "./TypographyControls";
export { FontSearchInput, CategoryTabs, FontList, CATEGORY_LABELS } from "./FontPickerDropdown";

export default TypographySection;
