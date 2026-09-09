/**
 * FontPicker - Font family dropdown with Google Fonts integration
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/FontPicker
 * @license BSD-3-Clause
 */

import * as React from "react";
import {
  GoogleFontsService,
  loadGoogleFont,
  searchGoogleFonts,
  type GoogleFont,
  type FontCategory,
} from "../../../../services/GoogleFontsService";
import { FontSearchInput, CategoryTabs, FontList } from "./FontPickerDropdown";
import { Button } from "@/editor/chrome-ui";
import { fieldTestId, labelTestId, rowTestId } from "../../shared/controls";
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
  const fontsService = React.useMemo(() => GoogleFontsService.getInstance(), []);

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
    /* Board 807:8342 reads "Family  [Inter Tight]" — one row, label left, the
       same 88px column every other row uses. It used to stack a "Font Family"
       caption above a full-bleed button, the only row in the section that did. */
    /* `.bdi-ddn` — the SHARED control frame, not a fourth hand-rolled one.
       807:8352 draws Family's box exactly like every other control on the
       board: gray-50 on a gray-100 hairline, radius 4, 28 tall, 160 wide. This
       one was white on `--bk-border-medium` at radius 6, and carried a 12px
       bottom margin that broke the board's contiguous 34-row rhythm — the only
       row in the panel that did either. The one style left inline is the
       preview typeface, which is the field's value and cannot be a class. */
    <div className="bdi-row-ctrl" data-testid={rowTestId("Family")} style={{ position: "relative" }}>
      <label className="bdi-lb" data-testid={labelTestId("Family")}>Family</label>
      {/* Current Font Display / Toggle Button */}
      <Button
        onClick={() => setShowFontPicker(!showFontPicker)}
        aria-haspopup="listbox"
        aria-expanded={showFontPicker}
        aria-controls="font-picker-listbox"
        aria-label="Font family"
        data-testid={fieldTestId("Family")}
        className="bdi-ddn tw:justify-between tw:text-left"
        style={{ fontFamily: value || "inherit" }}
      >
        <span>{currentFontName}</span>
        <span style={{ fontSize: 12, color: "var(--bk-ink-muted)" }}>
          {showFontPicker ? "\u25B2" : "\u25BC"}
        </span>
      </Button>
      {/* Font Picker Dropdown */}
      {showFontPicker && (
        <div
          className="tw:flex tw:flex-col tw:gap-0"
          id="font-picker-listbox"
          role="listbox"
          aria-label="Font family selection"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "var(--bk-bg-panel)",
            border: `1px solid ${"var(--bk-border-medium)"}`,
            borderRadius: 8,
            zIndex: 100,
            maxHeight: 300,
            overflow: "hidden",
          }}
        >
          <FontSearchInput value={fontSearch} onChange={setFontSearch} />
          <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} />
          <div
            style={{
              padding: "6px 8px",
              fontSize: 12,
              color: "var(--bk-ink-muted)",
              borderBottom: `1px solid ${"var(--bk-border)"}`,
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
