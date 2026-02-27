/**
 * FontPicker - Font family dropdown with Google Fonts integration
 * Part of Typography section refactoring
 *
 * @module components/Panels/ProInspector/sections/typography/FontPicker
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  getGoogleFontsService,
  loadGoogleFont,
  searchGoogleFonts,
  type GoogleFont,
  type FontCategory,
} from "../../../../services/GoogleFontsService";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import { FontSearchInput, CategoryTabs, FontList } from "./FontPickerDropdown";

// ============================================================================
// TYPES
// ============================================================================

export interface SystemFont {
  value: string;
  label: string;
  category: "system" | "sans-serif" | "serif" | "monospace";
}

// ============================================================================
// CONSTANTS
// ============================================================================

// System fonts (always available)
export const SYSTEM_FONTS: SystemFont[] = [
  { value: "inherit", label: "Inherit", category: "system" },
  { value: "-apple-system, BlinkMacSystemFont, sans-serif", label: "System", category: "system" },
  { value: "Arial, sans-serif", label: "Arial", category: "sans-serif" },
  { value: "Georgia, serif", label: "Georgia", category: "serif" },
  { value: "'Times New Roman', serif", label: "Times New Roman", category: "serif" },
  { value: "'Courier New', monospace", label: "Courier New", category: "monospace" },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange }) => {
  const [fontSearch, setFontSearch] = React.useState("");
  const [showFontPicker, setShowFontPicker] = React.useState(false);
  const [selectedCategory, setSelectedCategory] = React.useState<FontCategory | "all">("all");
  const fontsService = React.useMemo(() => getGoogleFontsService(), []);

  // Get filtered fonts
  const googleFonts = React.useMemo(() => {
    let fonts = searchGoogleFonts(fontSearch);
    if (selectedCategory !== "all") {
      fonts = fonts.filter((f) => f.category === selectedCategory);
    }
    return fonts.slice(0, 50); // Limit for performance
  }, [fontSearch, selectedCategory]);

  const totalFonts = React.useMemo(() => fontsService.getFonts().length, [fontsService]);

  // Handle font selection
  const handleFontSelect = (font: GoogleFont | SystemFont) => {
    const fontValue = "family" in font ? `'${font.family}', ${font.category}` : font.value;

    // Load Google Font if needed
    if ("family" in font) {
      loadGoogleFont(font.family);
    }

    onChange(fontValue);
    setShowFontPicker(false);
    setFontSearch("");
  };

  // Get current font name for display
  const currentFontName = React.useMemo(() => {
    if (!value) return "Select font...";

    // Check system fonts
    const systemFont = SYSTEM_FONTS.find((f) => f.value === value);
    if (systemFont) return systemFont.label;

    // Extract font name from value
    const match = value.match(/'([^']+)'/);
    return match ? match[1] : value;
  }, [value]);

  return (
    <div style={{ marginBottom: 12 }}>
      <label
        style={{
          fontSize: 11,
          color: INSPECTOR_TOKENS.textTertiary,
          fontWeight: 500,
          display: "block",
          marginBottom: 6,
        }}
      >
        Font Family
      </label>

      {/* Current Font Display / Toggle Button */}
      <button
        onClick={() => setShowFontPicker(!showFontPicker)}
        aria-haspopup="listbox"
        aria-expanded={showFontPicker}
        aria-controls="font-picker-listbox"
        style={{
          width: "100%",
          padding: "10px 12px",
          background: INSPECTOR_TOKENS.surfaceInput,
          border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
          borderRadius: 6,
          color: INSPECTOR_TOKENS.textPrimary,
          fontSize: 12,
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: value || "inherit",
        }}
      >
        <span>{currentFontName}</span>
        <span style={{ fontSize: 10, color: INSPECTOR_TOKENS.textTertiary }}>
          {showFontPicker ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {/* Font Picker Dropdown */}
      {showFontPicker && (
        <div
          id="font-picker-listbox"
          role="listbox"
          aria-label="Font family selection"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            marginTop: 4,
            background: INSPECTOR_TOKENS.surfaceOverlay,
            border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
            borderRadius: 8,
            zIndex: 100,
            maxHeight: 300,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <FontSearchInput value={fontSearch} onChange={setFontSearch} />
          <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} />
          <div
            style={{
              padding: "6px 8px",
              fontSize: 10,
              color: INSPECTOR_TOKENS.textTertiary,
              borderBottom: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
            }}
          >
            Showing {googleFonts.length} of {totalFonts} Google fonts
          </div>
          <FontList
            googleFonts={googleFonts}
            systemFonts={SYSTEM_FONTS}
            selectedCategory={selectedCategory}
            fontSearch={fontSearch}
            currentValue={value}
            onSelect={handleFontSelect}
          />
        </div>
      )}
    </div>
  );
};

export default FontPicker;
