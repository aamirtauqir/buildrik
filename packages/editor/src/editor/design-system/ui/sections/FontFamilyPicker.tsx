/**
 * FontFamilyPicker — the Brand panel's family picker for a `font-family`
 * token (Clone 3721:44821 · Brand inspector font).
 *
 * The token-shaped host of the Typography section's dropdown: the same
 * `FontPickerPanel` (presets · the ADDED site fonts under `Uploaded` ·
 * `Manage site fonts`), a full-width 32px trigger in place of the inspector's
 * label+control row, and the token's value form on the way out. Font tokens
 * hold a bare family (`Inter`, `Geist Mono` — `design-system/constants.ts`),
 * not the inspector's quoted stack, so a pick writes `<Family>`.
 *
 * Its selection is the token's value and nothing else — the Typography picker
 * keeps its own (the QA note on 3721:43423: "a separate font-source variable").
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine/Composer";
import type { GoogleFont } from "../../../../services/GoogleFontsService";
import {
  FontPickerPanel,
  SYSTEM_FONTS,
  namesFont,
  openSiteFonts,
  primaryFamily,
  useUploadedFonts,
  type SystemFont,
} from "@/editor/inspector/sections/typography";
import { Button } from "@/editor/chrome-ui";

export interface FontFamilyPickerProps {
  /** The token's current value — a bare family, or whatever stack was typed. */
  value: string;
  onChange: (family: string) => void;
  composer: Composer | null | undefined;
}

/**
 * A token holds a family, not a stack. A preset row carries both a label
 * and the inspector's stack; the family is the label when the stack leads
 * with it (`Arial, sans-serif` → `Arial`, `'Inter Var', sans-serif` →
 * `Inter Var`). `Inherit` and `System` have no single family — their value
 * stands as typed.
 */
const tokenValueOf = (font: GoogleFont | SystemFont): string => {
  if ("family" in font) return font.family;
  return primaryFamily(font.value) === font.label ? font.label : font.value;
};

export const FontFamilyPicker: React.FC<FontFamilyPickerProps> = ({ value, onChange, composer }) => {
  const [open, setOpen] = React.useState(false);
  const uploadedFonts = useUploadedFonts(composer);
  const family = primaryFamily(value);
  const uploaded = uploadedFonts.some((f) => namesFont(value, f));

  const handleSelect = (font: GoogleFont | SystemFont) => {
    onChange(tokenValueOf(font));
    setOpen(false);
  };

  const handleManage = () => {
    setOpen(false);
    openSiteFonts(composer);
  };

  return (
    <div className="tw:relative tw:w-full">
      <Button
        variant="secondary"
        size="xs"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="brand-token-font-listbox"
        aria-label="Choose font family"
        data-testid="brand-token-font-picker"
        data-font-source={uploaded ? "uploaded" : undefined}
        className="tw:w-full tw:h-8 tw:justify-between tw:px-2 tw:rounded tw:text-[12px] tw:font-normal tw:text-left tw:text-[var(--bk-ink)]"
      >
        {/* The name in its own face — the field's value, not a class. */}
        <span className="tw:truncate" style={{ fontFamily: value || "inherit" }}>
          {family || "Select font..."}
        </span>
        <span aria-hidden="true" className="tw:text-[12px] tw:text-[var(--bk-ink-muted)]">
          {open ? "\u25B2" : "\u25BC"}
        </span>
      </Button>
      {open && (
        <FontPickerPanel
          id="brand-token-font-listbox"
          systemFonts={SYSTEM_FONTS}
          uploadedFonts={uploadedFonts}
          currentValue={value}
          onSelect={handleSelect}
          onManage={handleManage}
        />
      )}
    </div>
  );
};
