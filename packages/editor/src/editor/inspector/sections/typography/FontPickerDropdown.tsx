/**
 * FontPickerDropdown - Dropdown components for font selection
 * Part of Typography section refactoring
 *
 * @module components/Panels/ProInspector/sections/typography/FontPickerDropdown
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { GoogleFont, FontCategory } from "../../../../services/GoogleFontsService";
import { INSPECTOR_TOKENS } from "../../shared/controls/controlStyles";
import type { SystemFont } from "./FontPicker";

// Category labels for display
export const CATEGORY_LABELS: Record<FontCategory | "system", string> = {
  "sans-serif": "Sans Serif",
  serif: "Serif",
  display: "Display",
  handwriting: "Handwriting",
  monospace: "Monospace",
  system: "System",
};

// ============================================================================
// FONT SEARCH INPUT
// ============================================================================

interface FontSearchInputProps {
  value: string;
  onChange: (v: string) => void;
}

export const FontSearchInput: React.FC<FontSearchInputProps> = ({ value, onChange }) => (
  <div style={{ padding: 8, borderBottom: `1px solid ${INSPECTOR_TOKENS.borderSubtle}` }}>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search fonts..."
      style={{
        width: "100%",
        padding: "8px 10px",
        background: INSPECTOR_TOKENS.surfaceInput,
        border: `1px solid ${INSPECTOR_TOKENS.borderInput}`,
        borderRadius: 6,
        color: INSPECTOR_TOKENS.textPrimary,
        fontSize: 12,
        outline: "none",
      }}
      autoFocus
    />
  </div>
);

// ============================================================================
// CATEGORY TABS
// ============================================================================

interface CategoryTabsProps {
  selected: FontCategory | "all";
  onSelect: (cat: FontCategory | "all") => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ selected, onSelect }) => (
  <div
    style={{
      display: "flex",
      gap: 2,
      padding: "6px 8px",
      borderBottom: `1px solid ${INSPECTOR_TOKENS.borderSubtle}`,
      overflowX: "auto",
    }}
  >
    {(["all", "sans-serif", "serif", "display", "monospace"] as const).map((cat) => (
      <button
        key={cat}
        onClick={() => onSelect(cat)}
        style={{
          padding: "4px 8px",
          background: selected === cat ? INSPECTOR_TOKENS.accentAlpha20 : "transparent",
          border: "none",
          borderRadius: 4,
          color: selected === cat ? INSPECTOR_TOKENS.accent : INSPECTOR_TOKENS.textTertiary,
          fontSize: 12,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
      </button>
    ))}
  </div>
);

// ============================================================================
// FONT LIST
// ============================================================================

interface FontListProps {
  googleFonts: GoogleFont[];
  systemFonts: SystemFont[];
  selectedCategory: FontCategory | "all";
  fontSearch: string;
  currentValue: string;
  onSelect: (font: GoogleFont | SystemFont) => void;
}

export const FontList: React.FC<FontListProps> = ({
  googleFonts,
  systemFonts,
  selectedCategory,
  fontSearch,
  currentValue,
  onSelect,
}) => (
  <div style={{ flex: 1, overflowY: "auto", maxHeight: 200 }}>
    {/* System Fonts */}
    {(selectedCategory === "all" || selectedCategory === "sans-serif") && (
      <div style={{ padding: "4px 8px" }}>
        <div
          style={{
            fontSize: 12,
            color: INSPECTOR_TOKENS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "4px 0",
          }}
        >
          System
        </div>
        {systemFonts
          .filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase()))
          .map((font) => (
            <button
              key={font.value}
              onClick={() => onSelect(font)}
              role="option"
              aria-selected={currentValue === font.value}
              style={{
                width: "100%",
                padding: "8px",
                background:
                  currentValue === font.value ? INSPECTOR_TOKENS.accentAlpha20 : "transparent",
                border: "none",
                borderRadius: 4,
                color: INSPECTOR_TOKENS.textPrimary,
                fontSize: 12,
                textAlign: "left",
                cursor: "pointer",
                fontFamily: font.value,
              }}
            >
              {font.label}
            </button>
          ))}
      </div>
    )}

    {/* Google Fonts */}
    <div style={{ padding: "4px 8px" }}>
      <div
        style={{
          fontSize: 12,
          color: INSPECTOR_TOKENS.textMuted,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "4px 0",
        }}
      >
        Google Fonts
      </div>
      {googleFonts.map((font) => (
        <button
          key={font.family}
          onClick={() => onSelect(font)}
          role="option"
          aria-selected={currentValue?.includes(font.family) ?? false}
          style={{
            width: "100%",
            padding: "8px",
            background: currentValue?.includes(font.family)
              ? INSPECTOR_TOKENS.accentAlpha20
              : "transparent",
            border: "none",
            borderRadius: 4,
            color: INSPECTOR_TOKENS.textPrimary,
            fontSize: 12,
            textAlign: "left",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{font.family}</span>
          <span
            style={{ fontSize: 12, color: INSPECTOR_TOKENS.textMuted, textTransform: "uppercase" }}
          >
            {font.category}
          </span>
        </button>
      ))}
    </div>
  </div>
);
