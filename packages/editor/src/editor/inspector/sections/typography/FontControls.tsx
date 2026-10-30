/**
 * FontControls — the Typography section's face under Font (2L9 161:8940):
 * Font size, Weight, Line height, Text color. Align and the Brand Text style
 * are in More settings (TypographyControls). Each row names the CSS
 * property it edits, so read-only, override dots and "Mixed" come from the
 * field context (R-DD-14).
 *
 * The Page panel (board 21 / S06) shows only the text colour, "Text color".
 *
 * A font size bound to a Brand type style is bound from the section's
 * "Text style" row (owner answer 4) — the one door for that binding; the
 * field here shows the size it resolves to, and typing a size unbinds it.
 *
 * @module editor/inspector/sections/typography/FontControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { SelectRow, ColorInput, InputWithUnit } from "@/editor/inspector/shared/controls";

/** 2L9 161:8940 reads the weight by name ("Regular"). */
export const FONT_WEIGHTS = [
  ["100", "Thin"],
  ["200", "Extra light"],
  ["300", "Light"],
  ["400", "Regular"],
  ["500", "Medium"],
  ["600", "Semibold"],
  ["700", "Bold"],
  ["800", "Extra bold"],
  ["900", "Black"],
].map(([value, label]) => ({ value, label }));


interface FontControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isMultiSelect?: boolean;
  /** Threaded so the colour's token chip can open Brand. */
  composer?: Composer | null;
  /** "page": the Page panel's subset — the text colour only. */
  variant?: "element" | "page";
  /** What the element renders as where it sets nothing (the Page panel's text colour). */
  inherited?: Readonly<Record<string, string>>;
}

/** "32px" → "32 px". */
const spaced = (v: string) => v.replace(/^(-?[\d.]+)([a-z%]+)$/, "$1 $2");

/** A computed line height in px against the computed size: "1.2 ×". */
function lineHeightShown(lh: string | undefined, size: string | undefined): string | undefined {
  if (!lh) return undefined;
  const l = parseFloat(lh);
  const f = parseFloat(size ?? "");
  if (lh.endsWith("px") && f > 0) return `${Math.round((l / f) * 100) / 100} ×`;
  return spaced(lh);
}

export const FontControls: React.FC<FontControlsProps> = ({ styles, onChange, composer, variant = "element", inherited }) => {
  /* 2L9 S21: an unset row shows what the cascade resolves, "· inherited". */
  const fromCascade = (v: string | undefined) => (v ? `${v} · inherited` : undefined);
  /* An own value. A key the cascade answered for is not one (`styles` also
     carries computed fallbacks), nor is "inherit" written as a value. */
  const own = (k: string) => (inherited?.[k] || styles[k] === "inherit" ? "" : (styles[k] ?? ""));
  const colour = (
    <div className="tw:relative">
      <ColorInput
        label="Text color"
        value={own("color")}
        onChange={(v) => onChange("color", v)}
        composer={composer}
        property="color"
        inheritedValue={inherited?.color}
      />
    </div>
  );
  if (variant === "page") return colour;

  return (
    <>
      <div className="tw:relative">
        <InputWithUnit
          label="Font size"
          value={own("font-size")}
          inherited={inherited?.["font-size"] && spaced(inherited["font-size"])}
          onChange={(v) => onChange("font-size", v)}
          units={["px", "em", "rem", "%", "vw"]}
          property="font-size"
        />
      </div>

      <div className="tw:relative">
        <SelectRow
          label="Weight"
          value={own("font-weight")}
          placeholder={fromCascade(inherited?.["font-weight"]) ?? "Default"}
          onChange={(v) => onChange("font-weight", v)}
          options={FONT_WEIGHTS}
          property="font-weight"
        />
      </div>

      <div className="tw:relative">
        <InputWithUnit
          label="Line height"
          value={own("line-height")}
          onChange={(v) => onChange("line-height", v)}
          /* A bare number is a multiple of the size ("1.5"). */
          units={["px", "", "em", "%", "normal"]}
          inherited={lineHeightShown(inherited?.["line-height"], inherited?.["font-size"] ?? styles["font-size"])}
          placeholder="1.5"
          property="line-height"
        />
      </div>

      {colour}

    </>
  );
};

export default FontControls;
