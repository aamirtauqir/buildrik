/**
 * FontPickerDropdown - Dropdown components for font selection
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/FontPickerDropdown
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { GoogleFont, FontCategory } from "../../../../services/GoogleFontsService";
import type { SystemFont } from "./FontPicker";
import { Button, TextInput } from "@/editor/chrome-ui";
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
  <div style={{ padding: 8, borderBottom: `1px solid ${"var(--bk-border)"}` }}>
    <TextInput
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search fonts..."
      style={{
        width: "100%",
        padding: "8px 10px",
        background: "var(--bk-bg-card)",
        border: `1px solid ${"var(--bk-border-medium)"}`,
        borderRadius: 6,
        color: "var(--bk-ink)",
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
      borderBottom: `1px solid ${"var(--bk-border)"}`,
      overflowX: "auto",
    }}
  >
    {(["all", "sans-serif", "serif", "display", "monospace"] as const).map((cat) => (
      <Button
        key={cat}
        onClick={() => onSelect(cat)}
        style={{
          padding: "4px 8px",
          background: selected === cat ? "var(--bk-accent-tint)" : "transparent",
          border: "none",
          borderRadius: 4,
          color: selected === cat ? "var(--bk-accent)" : "var(--bk-ink-muted)",
          fontSize: 12,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
      </Button>
    ))}
  </div>
);

// ============================================================================
// FONT LIST
// ============================================================================

interface FontListProps {
  googleFonts: GoogleFont[];
  systemFonts: SystemFont[];
  /** The media library's font files, as the FontManager registered them
   *  (Clone 3721:43423 — "a separate uploaded source"). Empty = no group. */
  uploadedFonts: SystemFont[];
  selectedCategory: FontCategory | "all";
  fontSearch: string;
  currentValue: string;
  onSelect: (font: GoogleFont | SystemFont) => void;
}

/** One labelled group of preset fonts — System and Uploaded share it. */
const PresetFontGroup: React.FC<{
  label: string;
  fonts: SystemFont[];
  fontSearch: string;
  currentValue: string;
  onSelect: (font: SystemFont) => void;
}> = ({ label, fonts, fontSearch, currentValue, onSelect }) => (
  <div style={{ padding: "4px 8px" }}>
    <div
      style={{
        fontSize: 12,
        color: "var(--bk-ink-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        padding: "4px 0",
      }}
    >
      {label}
    </div>
    {fonts
      .filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase()))
      .map((font) => (
        <Button
          key={font.value}
          onClick={() => onSelect(font)}
          role="option"
          aria-selected={currentValue === font.value}
          style={{
            width: "100%",
            padding: "8px",
            background:
              currentValue === font.value ? "var(--bk-accent-tint)" : "transparent",
            border: "none",
            borderRadius: 4,
            color: "var(--bk-ink)",
            fontSize: 12,
            textAlign: "left",
            cursor: "pointer",
            fontFamily: font.value,
          }}
        >
          {font.label}
        </Button>
      ))}
  </div>
);

export const FontList: React.FC<FontListProps> = ({
  googleFonts,
  systemFonts,
  uploadedFonts,
  selectedCategory,
  fontSearch,
  currentValue,
  onSelect,
}) => (
  <div style={{ flex: 1, overflowY: "auto", maxHeight: 200 }}>
    {uploadedFonts.length > 0 && (selectedCategory === "all" || selectedCategory === "sans-serif") && (
      <PresetFontGroup label="Uploaded" fonts={uploadedFonts} fontSearch={fontSearch} currentValue={currentValue} onSelect={onSelect} />
    )}
    {(selectedCategory === "all" || selectedCategory === "sans-serif") && (
      <PresetFontGroup label="System" fonts={systemFonts} fontSearch={fontSearch} currentValue={currentValue} onSelect={onSelect} />
    )}

    {/* Google Fonts */}
    <div style={{ padding: "4px 8px" }}>
      <div
        style={{
          fontSize: 12,
          color: "var(--bk-ink-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          padding: "4px 0",
        }}
      >
        Google Fonts
      </div>
      {googleFonts.map((font) => (
        <Button
          key={font.family}
          onClick={() => onSelect(font)}
          role="option"
          aria-selected={currentValue?.includes(font.family) ?? false}
          style={{
            width: "100%",
            padding: "8px",
            background: currentValue?.includes(font.family)
              ? "var(--bk-accent-tint)"
              : "transparent",
            border: "none",
            borderRadius: 4,
            color: "var(--bk-ink)",
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
            style={{ fontSize: 12, color: "var(--bk-ink-muted)", textTransform: "uppercase" }}
          >
            {font.category}
          </span>
        </Button>
      ))}
    </div>
  </div>
);
