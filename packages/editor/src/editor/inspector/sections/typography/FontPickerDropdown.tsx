/**
 * FontPickerDropdown - Dropdown components for font selection
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/FontPickerDropdown
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Input } from "@/editor/ui";
import type { GoogleFont, FontCategory } from "../../../../services/GoogleFontsService";
import type { SystemFont } from "./FontPicker";
import { Button } from "flowbite-react";

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
    <Input
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
            color: "var(--bk-ink-muted)",
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
