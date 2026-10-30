/**
 * FontPicker - Font family dropdown with Google Fonts integration
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/FontPicker
 * @license BSD-3-Clause
 */

import { ChevronDown } from "lucide-react";
import * as React from "react";
import { loadGoogleFont, type GoogleFont } from "@/services/GoogleFontsService";
import { FontPickerPanel, namesFont, primaryFamily } from "./FontPickerDropdown";
import { Button } from "@/editor/chrome-ui";
import { fieldTestId, labelTestId, rowTestId } from "@/editor/inspector/shared/controls";
import { WIDE_BUTTON } from "@/editor/inspector/shared/controls/controlClasses";
import { FieldDot } from "@/editor/inspector/shared/controls/FieldDot";
import { useInspectorField, mixedName } from "@/editor/inspector/shared/controls/InspectorFieldContext";
import { EVENTS } from "@/shared/constants/events";
import type { Composer } from "@/engine";
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
  /** The family the element renders in when it sets none (Page panel, board
   *  21: "Inter"). Shown, never written. */
  inheritedValue?: string;
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

/** Whether a face of this family has finished loading in the document —
 *  re-read whenever the document finishes loading fonts. Null when there is
 *  no family to ask about (a system font) or no font set to ask. */
function useFamilyLoaded(family: string | null): boolean | null {
  const read = React.useCallback((): boolean | null => {
    if (!family || typeof document === "undefined" || typeof document.fonts?.forEach !== "function") return null;
    let loaded = false;
    document.fonts.forEach((f) => {
      if (f.family.replace(/["']/g, "") === family && f.status === "loaded") loaded = true;
    });
    return loaded;
  }, [family]);
  const [loaded, setLoaded] = React.useState(read);
  React.useEffect(() => {
    setLoaded(read());
    const fonts = typeof document === "undefined" ? undefined : document.fonts;
    if (!family || typeof fonts?.load !== "function" || typeof fonts.addEventListener !== "function") return;
    const refresh = () => setLoaded(read());
    fonts.load(`16px "${family}"`).then(refresh, refresh);
    fonts.addEventListener("loadingdone", refresh);
    return () => fonts.removeEventListener("loadingdone", refresh);
  }, [family, read]);
  return loaded;
}

/** The last family picked here, while the element still carries it (2L9 R08):
 *  the value written, where it came from, what it replaced, and an Undo bound
 *  to that one history step. */
interface Assignment {
  value: string;
  family: string;
  source: string;
  previous: string | null;
  undo: () => boolean;
}

export const FontPicker: React.FC<FontPickerProps> = ({ value: ownValue, onChange, composer, inheritedValue }) => {
  const field = useInspectorField("font-family");
  const value = ownValue || inheritedValue || "";
  const [showFontPicker, setShowFontPicker] = React.useState(false);
  const uploadedFonts = useUploadedFonts(composer);
  const [assignment, setAssignment] = React.useState<Assignment | null>(null);

  // Handle font selection
  const handleFontSelect = (font: GoogleFont | SystemFont) => {
    /* Read-only (DD-18): refused here, not by disabling the trigger. */
    if (field.readOnly) return;
    const fontValue = "family" in font ? `'${font.family}', ${font.category}` : font.value;
    setShowFontPicker(false);
    if (fontValue === ownValue) return;

    // Load Google Font if needed
    if ("family" in font) {
      loadGoogleFont(font.family);
    }

    /* One Undo step, the one the engine records for this write — bound only
       if a step was recorded, so the button never undoes an older edit. */
    let recorded = false;
    const onRecorded = () => {
      recorded = true;
    };
    composer?.on?.(EVENTS.HISTORY_RECORDED, onRecorded);
    try {
      field.discrete(() => onChange(fontValue));
    } finally {
      composer?.off?.(EVENTS.HISTORY_RECORDED, onRecorded);
    }
    const undo = recorded ? composer?.history?.captureUndo?.() : undefined;
    const isUploaded = uploadedFonts.some((f) => f.value === fontValue);
    setAssignment(
      undo && fontValue !== "inherit"
        ? {
            value: fontValue,
            family: "family" in font ? font.family : font.label,
            source: isUploaded ? "uploaded" : "family" in font ? "Google Fonts" : "system",
            previous: ownValue && ownValue !== "inherit" ? primaryFamily(ownValue) || ownValue : null,
            undo,
          }
        : null,
    );
  };
  /* Shown while the element still carries the family picked here — an undo,
     ⌘Z or another element's selection ends it. */
  const assigned = assignment && assignment.value === ownValue && !field.mixed ? assignment : null;
  const loaded = useFamilyLoaded(assigned && assigned.source !== "system" ? assigned.family : null);

  const handleManage = () => {
    setShowFontPicker(false);
    openSiteFonts(composer);
  };

  /* An uploaded family reads back as one: the trigger says so for the walk
     (`data-font-source`), the reopened dropdown by its selected `Uploaded` row. */
  const uploaded = uploadedFonts.some((f) => namesFont(value, f));

  // Get current font name for display
  const currentFontName = React.useMemo(() => {
    if (field.mixed) return "Mixed";
    if (!value) return "Select font...";

    // Check system + uploaded fonts
    const systemFont = [...uploadedFonts, ...SYSTEM_FONTS].find((f) => f.value === value);
    if (systemFont) return systemFont.label;

    /* Board 1 reads "Inter", not the stack "Inter, sans-serif". */
    return primaryFamily(value) || value;
  }, [value, uploadedFonts, field.mixed]);

  /* 2L9 R01: where the family comes from, beside its name ("Inter · System"),
     and the stack the element actually writes under the row. */
  const source =
    field.mixed || !value || value === "inherit" || /^var\(/.test(value)
      ? null
      : !ownValue && inheritedValue
        ? "inherited"
      : uploaded
        ? "Uploaded"
        : SYSTEM_FONTS.some((f) => f.value === value)
          ? "System"
          : "Google Fonts";
  const stack = ownValue && !field.mixed && ownValue.includes(",") ? ownValue.replace(/'/g, "") : null;

  return (
    /* Board 1 reads "Font  [Inter]" — one row, label left, the same column
       every other row uses. It used to stack a "Font Family"
       caption above a full-bleed button, the only row in the section that did. */
    /* `.bdi-ddn` — the SHARED control frame, not a fourth hand-rolled one.
       807:8352 draws Family's box exactly like every other control on the
       board: gray-50 on a gray-100 hairline, radius 4, 28 tall, 160 wide. This
       one was white on `--bk-border-medium` at radius 6, and carried a 12px
       bottom margin that broke the board's contiguous 34-row rhythm — the only
       row in the panel that did either. The one style left inline is the
       preview typeface, which is the field's value and cannot be a class. */
    <div className="bdi-row-ctrl tw:relative" data-testid={rowTestId("Font")}>
      <label className="bdi-lb" data-testid={labelTestId("Font")}>
        Font
        <FieldDot field={field} />
      </label>
      {/* Current Font Display / Toggle Button */}
      <Button
        onClick={() => {
          if (!field.readOnly) setShowFontPicker(!showFontPicker);
        }}
        aria-haspopup="listbox"
        aria-expanded={showFontPicker}
        aria-controls="font-picker-listbox"
        aria-label={field.mixed ? mixedName("Font family") : "Font family"}
        aria-disabled={field.readOnly || undefined}
        data-testid={fieldTestId("Font")}
        data-font-source={uploaded ? "uploaded" : undefined}
        className="bdi-ddn tw:justify-between tw:text-left"
        style={{ fontFamily: field.mixed ? "inherit" : value || "inherit" }}
      >
        <span className={"tw:min-w-0 tw:truncate" + (field.mixed ? " tw:text-[var(--bk-ink-muted)]" : "")}>
          {currentFontName}
          {source ? <span className="tw:text-[var(--bk-ink-muted)] tw:[font-family:var(--bk-font-ui)]" data-testid="font-source"> · {source}</span> : null}
        </span>
        {/* The field chevron every other select in the column draws. */}
        <ChevronDown size={12} aria-hidden="true" className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
      </Button>
      {stack && !assigned ? (
        <p className="tw:col-span-full tw:m-0 tw:pb-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="font-applied-stack">
          Applied stack: {stack}
        </p>
      ) : null}
      {assigned ? (
        <div className="tw:col-span-full tw:flex tw:flex-col tw:gap-2 tw:pb-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="font-assignment">
          {assigned.source === "system" ? null : (
            <p className="tw:m-0" data-testid="font-assignment-status">
              {loaded
                ? `${assigned.family} loaded · ${assigned.source} source ready.`
                : `Loading ${assigned.family} · ${assigned.source} source.`}
            </p>
          )}
          <Button
            color="light"
            size="xs"
            className={WIDE_BUTTON}
            onClick={() => {
              assigned.undo();
              setAssignment(null);
            }}
            data-testid="font-assignment-undo"
          >
            Undo font assignment
          </Button>
          <p className="tw:m-0">
            {assigned.previous
              ? `Undo restores the previous ${assigned.previous} stack`
              : "Undo restores the inherited font"}
            {assigned.source === "uploaded" ? " without deleting the uploaded font." : "."}
          </p>
        </div>
      ) : null}
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
