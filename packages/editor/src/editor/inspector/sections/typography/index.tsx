/**
 * Typography — Font, Font size, Line height, Weight, Colour, Align (boards 1,
 * 4), the rest behind More settings. The same body serves:
 *   - "Typography", open, on text types;
 *   - "Text inside", closed with a one-line summary, on containers, buttons,
 *     form fields and widgets (board 17, owner answer 1) — the registry names
 *     the section and draws the summary;
 *   - the Page panel's subset (board 21): Font and Text colour only.
 *
 * @module editor/inspector/sections/typography
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { Section, MoreSettingsToggle } from "../../shared/controls";
import { FontControls } from "./FontControls";
import { FontPicker } from "./FontPicker";
import { ADVANCED_TYPOGRAPHY_COUNT, TypographyControls } from "./TypographyControls";

// ============================================================================
// TYPES
// ============================================================================

export interface TypographySectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Controlled open state (standalone use; in the panel the frame decides). */
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  /** Whether the More settings rows are shown. */
  advancedExpanded?: boolean;
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Threaded so the colour's token chip can open Brand. */
  composer?: Composer | null;
  /** "page": the Page panel's subset (board 21). */
  variant?: "element" | "page";
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TypographySection: React.FC<TypographySectionProps> = ({
  styles,
  onChange,
  isOpen,
  onToggle,
  advancedExpanded = false,
  onAdvancedToggle,
  isMultiSelect,
  composer,
  variant = "element",
}) => {
  const handleFontChange = React.useCallback((value: string) => onChange("font-family", value), [onChange]);
  const isPage = variant === "page";

  return (
    <Section title="Typography" isOpen={isOpen} onToggle={onToggle} id="inspector-section-typography">
      <div className="tw:relative">
        <FontPicker value={styles["font-family"] || ""} onChange={handleFontChange} composer={composer} />
      </div>

      <FontControls
        styles={styles}
        onChange={onChange}
        isMultiSelect={isMultiSelect}
        composer={composer}
        variant={variant}
      />

      {!isPage && advancedExpanded && (
        <TypographyControls styles={styles} onChange={onChange} isMultiSelect={isMultiSelect} />
      )}

      {!isPage && onAdvancedToggle && (
        <MoreSettingsToggle isOpen={advancedExpanded} onToggle={() => onAdvancedToggle()} advancedCount={ADVANCED_TYPOGRAPHY_COUNT} />
      )}
    </Section>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export { FontPicker, SYSTEM_FONTS, useUploadedFonts, openSiteFonts, type SystemFont } from "./FontPicker";
export { FontControls, FONT_WEIGHTS } from "./FontControls";
export { TypographyControls, ADVANCED_TYPOGRAPHY_COUNT } from "./TypographyControls";
export {
  FontSearchInput,
  CategoryTabs,
  FontList,
  FontPickerPanel,
  primaryFamily,
  namesFont,
  CATEGORY_LABELS,
  type FontPickerPanelProps,
} from "./FontPickerDropdown";

export default TypographySection;