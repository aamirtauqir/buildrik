/**
 * FontPicker - Font family dropdown with Google Fonts integration
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/FontPicker
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { loadGoogleFont, type GoogleFont } from "../../../../services/GoogleFontsService";
import { FontPickerPanel, namesFont } from "./FontPickerDropdown";
import { Button } from "@/editor/chrome-ui";
import { fieldTestId, labelTestId, rowTestId } from "../../shared/controls";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "../../../../engine";
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

/** The door every picker carries — Site fonts (3686:42317) listens in StudioPanels. */
export const openSiteFonts = (composer: Composer | null | undefined): void => {
  composer?.emit("ui:site-fonts", {});
};

// ============================================================================
// COMPONENT
// ============================================================================

interface FontPickerProps {
  value: string;
  onChange: (value: string) => void;
  /** Source of the UPLOADED group — the FontManager's custom fonts, which the
   *  Composer registers from the media library's ADDED site fonts. */
  composer?: Composer | null;
}

/* Clone 3721:43423 — an uploaded font is "a separate uploaded source; it does
   not replace the built-in family". Read on mount and on every font event, so
   a font added in Site fonts shows up here without a reopen. Both pickers
   (Typography's Family row, the Brand font token) read through this one hook. */
export function useUploadedFonts(composer: Composer | null | undefined): SystemFont[] {
  const fontManager = composer?.fonts;
  const read = React.useCallback(
    (): SystemFont[] =>
      (fontManager?.getAllFonts({ source: "custom" }) ?? []).map((f) => ({
        value: `'${f.family}', sans-serif`,
        label: f.family,
        category: "sans-serif",
      })),
    [fontManager],
  );
  const [fonts, setFonts] = React.useState<SystemFont[]>(read);
  React.useEffect(() => {
    setFonts(read());
    if (!fontManager) return;
    const refresh = () => setFonts(read());
    const events = [EVENTS.FONT_UPLOADED, EVENTS.FONT_LOADED, EVENTS.FONT_DELETED];
    for (const ev of events) fontManager.on(ev, refresh);
    return () => {
      for (const ev of events) fontManager.off(ev, refresh);
    };
  }, [fontManager, read]);
  return fonts;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value, onChange, composer }) => {
  const [showFontPicker, setShowFontPicker] = React.useState(false);
  const uploadedFonts = useUploadedFonts(composer);

  // Handle font selection
  const handleFontSelect = (font: GoogleFont | SystemFont) => {
    const fontValue = "family" in font ? `'${font.family}', ${font.category}` : font.value;

    // Load Google Font if needed
    if ("family" in font) {
      loadGoogleFont(font.family);
    }

    onChange(fontValue);
    setShowFontPicker(false);
  };

  const handleManage = () => {
    setShowFontPicker(false);
    openSiteFonts(composer);
  };

  /* An uploaded family reads back as one: the trigger says so for the walk
     (`data-font-source`), the reopened dropdown by its selected `Uploaded` row. */
  const uploaded = uploadedFonts.some((f) => namesFont(value, f));

  // Get current font name for display
  const currentFontName = React.useMemo(() => {
    if (!value) return "Select font...";

    // Check system + uploaded fonts
    const systemFont = [...uploadedFonts, ...SYSTEM_FONTS].find((f) => f.value === value);
    if (systemFont) return systemFont.label;

    // Extract font name from value
    const match = value.match(/'([^']+)'/);
    return match ? match[1] : value;
  }, [value, uploadedFonts]);

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
    <div className="bdi-row-ctrl tw:relative" data-testid={rowTestId("Family")}>
      <label className="bdi-lb" data-testid={labelTestId("Family")}>Family</label>
      {/* Current Font Display / Toggle Button */}
      <Button
        onClick={() => setShowFontPicker(!showFontPicker)}
        aria-haspopup="listbox"
        aria-expanded={showFontPicker}
        aria-controls="font-picker-listbox"
        aria-label="Font family"
        data-testid={fieldTestId("Family")}
        data-font-source={uploaded ? "uploaded" : undefined}
        className="bdi-ddn tw:justify-between tw:text-left"
        style={{ fontFamily: value || "inherit" }}
      >
        <span>{currentFontName}</span>
        {/* The field chevron every other select in the column draws. */}
        <ChevronDown size={12} aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
      </Button>
      {/* Font Picker Dropdown */}
      {showFontPicker && (
        <FontPickerPanel
          id="font-picker-listbox"
          systemFonts={SYSTEM_FONTS}
          uploadedFonts={uploadedFonts}
          currentValue={value}
          onSelect={handleFontSelect}
          onManage={handleManage}
        />
      )}
    </div>
  );
};

export default FontPicker;
