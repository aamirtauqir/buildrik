/**
 * FontPickerDropdown - Dropdown components for font selection
 * Part of Typography section refactoring
 *
 * `FontPickerPanel` is the whole listbox body — search, category tabs, the
 * groups (Uploaded · System · Google Fonts) and the `Manage site fonts` foot.
 * Two hosts mount it: the Typography section's Family row (`FontPicker`) and
 * the Brand panel's font-family token (`design-system/…/FontFamilyPicker`).
 * They share the rows and never the state — Clone 3721:43423's QA note:
 * "Brand inspector uses a separate font-source variable".
 *
 * @module editor/inspector/sections/typography/FontPickerDropdown
 * @license BSD-3-Clause
 */

import * as React from "react";
import { twMerge } from "tailwind-merge";
import {
  GoogleFontsService,
  searchGoogleFonts,
  type GoogleFont,
  type FontCategory,
} from "../../../../services/GoogleFontsService";
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

/**
 * The family a value names — `'Inter Var', sans-serif` → `Inter Var`, and a
 * token's bare `Inter Var` → itself. The inspector holds the quoted stack and
 * the Brand token the bare family; one comparison reads both back.
 */
export const primaryFamily = (value: string): string =>
  (value.split(",")[0] ?? "").trim().replace(/^['"]|['"]$/g, "");

/** Whether a value names this preset — by its exact stack or by its family. */
export const namesFont = (value: string, font: SystemFont): boolean =>
  value === font.value || (value !== "" && primaryFamily(value) === font.label);

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

/* The rows are 32 high (density 32) on the ghost Button — name left, an
   optional source right in the Google rows' secondary slot. Selected = the
   accent tint, as every other picker row in the inspector. */
const GROUP = "tw:px-2 tw:py-1";
const GROUP_HEADER = "tw:py-1 tw:text-[12px] tw:uppercase tw:tracking-[0.5px] tw:text-[var(--bk-ink-muted)]";
const ROW =
  "tw:w-full tw:h-8 tw:px-2 tw:justify-between tw:rounded tw:text-[12px] tw:font-normal tw:text-left " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-100)]";
const ROW_SELECTED = "tw:bg-[var(--bk-accent-tint)] tw:enabled:hover:bg-[var(--bk-accent-tint)]";
const ROW_SOURCE = "tw:text-[12px] tw:uppercase tw:text-[var(--bk-ink-muted)]";

interface FontListProps {
  googleFonts: GoogleFont[];
  systemFonts: SystemFont[];
  /** The ADDED site fonts, as the FontManager registered them
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
  /** Named on every row, in the Google rows' secondary slot (3721:43084:
   *  `Inter Variable · Uploaded`). */
  source?: string;
  testId?: string;
  rowTestId?: string;
}> = ({ label, fonts, fontSearch, currentValue, onSelect, source, testId, rowTestId }) => (
  <div className={GROUP} data-testid={testId}>
    <div className={GROUP_HEADER}>{label}</div>
    {fonts
      .filter((f) => f.label.toLowerCase().includes(fontSearch.toLowerCase()))
      .map((font) => {
        const selected = namesFont(currentValue, font);
        return (
          <Button
            key={font.value}
            variant="ghost"
            size="xs"
            onClick={() => onSelect(font)}
            role="option"
            aria-selected={selected}
            data-testid={rowTestId}
            data-font-family={font.label}
            className={`${ROW} ${selected ? ROW_SELECTED : ""}`}
          >
            {/* The name in its own face; the source stays in the UI font. */}
            <span style={{ fontFamily: font.value }}>{font.label}</span>
            {source && <span className={ROW_SOURCE}>{source}</span>}
          </Button>
        );
      })}
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
}) => {
  const family = primaryFamily(currentValue);
  return (
    /* The one flex child that shrinks (`min-h-0`) — so the panel's cap lands
       on this list and the foot below it stays in view. A `max-h` here plus
       the panel's `overflow-hidden` would clip the foot instead. */
    <div className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto">
      {uploadedFonts.length > 0 && (selectedCategory === "all" || selectedCategory === "sans-serif") && (
        <PresetFontGroup
          label="Uploaded"
          source="Uploaded"
          fonts={uploadedFonts}
          fontSearch={fontSearch}
          currentValue={currentValue}
          onSelect={onSelect}
          testId="font-picker-group-uploaded"
          rowTestId="font-picker-uploaded-row"
        />
      )}
      {(selectedCategory === "all" || selectedCategory === "sans-serif") && (
        <PresetFontGroup label="System" fonts={systemFonts} fontSearch={fontSearch} currentValue={currentValue} onSelect={onSelect} />
      )}

      {/* Google Fonts */}
      <div className={GROUP}>
        <div className={GROUP_HEADER}>Google Fonts</div>
        {googleFonts.map((font) => {
          const selected = family !== "" && family === font.family;
          return (
            <Button
              key={font.family}
              variant="ghost"
              size="xs"
              onClick={() => onSelect(font)}
              role="option"
              aria-selected={selected}
              className={`${ROW} ${selected ? ROW_SELECTED : ""}`}
            >
              <span>{font.family}</span>
              <span className={ROW_SOURCE}>{font.category}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// PANEL — the listbox body both hosts mount
// ============================================================================

export interface FontPickerPanelProps {
  id: string;
  systemFonts: SystemFont[];
  uploadedFonts: SystemFont[];
  currentValue: string;
  onSelect: (font: GoogleFont | SystemFont) => void;
  /** `Manage site fonts` — the foot row (3721:43084 → 3686:42317). */
  onManage: () => void;
  /** Extra classes on the panel — a narrow host (the Brand token's 163px value
   *  column) hands over a floor width so the category tabs are not clipped. */
  className?: string;
}

export const FontPickerPanel: React.FC<FontPickerPanelProps> = ({
  id,
  systemFonts,
  uploadedFonts,
  currentValue,
  onSelect,
  onManage,
  className,
}) => {
  const [fontSearch, setFontSearch] = React.useState("");
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

  return (
    <div
      /* `top-full`: the host row is a centred flex box, so an absolutely
         positioned child with no `top` takes its STATIC position — centred on
         the 34px row — and a 360px panel opened 165px above the trigger, its
         head under the inspector's sticky header (measured live 2026-09-14). */
      className={twMerge(
        "tw:absolute tw:top-full tw:left-0 tw:right-0 tw:mt-1 tw:flex tw:flex-col tw:gap-0 tw:overflow-hidden tw:rounded-lg tw:border tw:border-[var(--bk-border-medium)] tw:bg-[var(--bk-bg-panel)] tw:z-[var(--bk-z-popover)] tw:max-h-90",
        className,
      )}
      id={id}
      role="listbox"
      aria-label="Font family selection"
    >
      <FontSearchInput value={fontSearch} onChange={setFontSearch} />
      <CategoryTabs selected={selectedCategory} onSelect={setSelectedCategory} />
      <div className="tw:px-2 tw:py-1.5 tw:text-[12px] tw:text-[var(--bk-ink-muted)] tw:border-b tw:border-[var(--bk-border)]">
        Showing {googleFonts.length} of {totalFonts} Google fonts
      </div>
      <FontList
        googleFonts={googleFonts}
        systemFonts={systemFonts}
        uploadedFonts={uploadedFonts}
        selectedCategory={selectedCategory}
        fontSearch={fontSearch}
        currentValue={currentValue}
        onSelect={onSelect}
      />
      {/* The foot — below every group, behind the dropdown's divider, and
          never filtered out: it is the one door to Site fonts from here. */}
      <div className="tw:border-t tw:border-[var(--bk-border)] tw:p-1">
        <Button
          variant="ghost"
          size="xs"
          onClick={onManage}
          data-testid="font-picker-manage-site-fonts"
          className="tw:w-full tw:h-8 tw:justify-start tw:px-2 tw:rounded tw:text-[12px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:enabled:hover:text-[var(--bk-accent-text)]"
        >
          Manage site fonts
        </Button>
      </div>
    </div>
  );
};
