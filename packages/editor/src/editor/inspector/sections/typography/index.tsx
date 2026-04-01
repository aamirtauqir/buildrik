/**
 * Typography Section - Font, Size, Weight, Color, Alignment
 * AQUI-032: Google Fonts Integration
 *
 * Refactored from TypographySection.tsx into modular sub-components:
 * - FontPicker: Font family dropdown with Google Fonts
 * - FontControls: Weight, style, decoration, spacing
 * - TypographyControls: Alignment, transform, color, white-space
 *
 * @module components/Panels/ProInspector/sections/typography
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, MoreSettingsToggle } from "../../shared/controls";
import { FontControls } from "./FontControls";
import { FontPicker } from "./FontPicker";
import { TypographyControls } from "./TypographyControls";

// ============================================================================
// TYPES
// ============================================================================

interface TypographySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Whether advanced settings (color, align, transform, white-space, word-break) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TypographySection: React.FC<TypographySectionProps> = ({
  styles,
  onChange,
  isOpen,
  advancedExpanded = false,
  onAdvancedToggle,
}) => {
  // Handle font-family changes from FontPicker
  const handleFontChange = React.useCallback(
    (value: string) => {
      onChange("font-family", value);
    },
    [onChange]
  );

  return (
    <Section title="Typography" icon="Type" isOpen={isOpen} id="inspector-section-typography">
      {/* Font Family Picker - AQUI-032 */}
      <FontPicker value={styles["font-family"] || ""} onChange={handleFontChange} />

      {/* Font Size, Weight, Line Height, Letter Spacing, Decoration, Style */}
      <FontControls styles={styles} onChange={onChange} />

      {/* ─── Advanced: Color, Alignment, Transform, White Space, Word Break ─── */}
      {advancedExpanded && <TypographyControls styles={styles} onChange={onChange} />}

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
