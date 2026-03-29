/**
 * Typography Section - Font, Size, Weight, Color, Alignment
 * AQUI-032: Google Fonts Integration
 *
 * Refactored from TypographySection.tsx into modular sub-components:
 * - FontPicker: Font family dropdown with Google Fonts
 * - FontControls: Weight, style, decoration, spacing
 * - TextControls: Alignment, transform, color, white-space
 *
 * @module components/Panels/ProInspector/sections/typography
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "../../shared/Controls";
import { FontControls } from "./FontControls";
import { FontPicker } from "./FontPicker";
import { TextControls } from "./TextControls";

// ============================================================================
// TYPES
// ============================================================================

interface TypographySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TypographySection: React.FC<TypographySectionProps> = ({
  styles,
  onChange,
  isOpen,
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

      {/* Color, Alignment, Transform, White Space, Word Break */}
      <TextControls styles={styles} onChange={onChange} />
    </Section>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { FontPicker, SYSTEM_FONTS, type SystemFont } from "./FontPicker";
export { FontControls, FONT_WEIGHTS } from "./FontControls";
export { TextControls } from "./TextControls";
export { FontSearchInput, CategoryTabs, FontList, CATEGORY_LABELS } from "./FontPickerDropdown";

export default TypographySection;
