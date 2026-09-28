/**
 * FontControls — the Typography section's face under Font (boards 1, 4):
 * Font size, Line height, Weight, Colour, Align. Each row names the CSS
 * property it edits, so read-only, override dots and "Mixed" come from the
 * field context (R-DD-14).
 *
 * The Page panel (board 21) shows only the text colour, as "Text colour".
 *
 * A font size bound to a Brand type style is bound from the type block's
 * "Text style" row (owner answer 4) — the one door for that binding; the
 * field here shows the size it resolves to, and typing a size unbinds it.
 *
 * @module editor/inspector/sections/typography/FontControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "../../../../engine";
import { SelectRow, ButtonGroup, ColorInput, InputWithUnit } from "../../shared/controls";

/** Board 1 reads the weight as its number ("600"). */
export const FONT_WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"].map((v) => ({ value: v, label: v }));

/** Board 1's Align: Left · Center · Right. */
const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

interface FontControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isMultiSelect?: boolean;
  /** Threaded so the colour's token chip can open Brand. */
  composer?: Composer | null;
  /** "page": the Page panel's subset — the text colour only. */
  variant?: "element" | "page";
}

export const FontControls: React.FC<FontControlsProps> = ({ styles, onChange, composer, variant = "element" }) => {
  const colour = (
    <div className="tw:relative">
      <ColorInput
        label={variant === "page" ? "Text colour" : "Colour"}
        value={styles.color || ""}
        onChange={(v) => onChange("color", v)}
        composer={composer}
        property="color"
      />
    </div>
  );
  if (variant === "page") return colour;

  return (
    <>
      <div className="tw:relative">
        <InputWithUnit
          label="Font size"
          value={styles["font-size"] || "16px"}
          onChange={(v) => onChange("font-size", v)}
          units={["px", "em", "rem", "%", "vw"]}
          property="font-size"
        />
      </div>

      <div className="tw:relative">
        <InputWithUnit
          label="Line height"
          value={styles["line-height"] || ""}
          onChange={(v) => onChange("line-height", v)}
          /* A bare number is a multiple of the size ("1.5"). */
          units={["px", "", "em", "%", "normal"]}
          placeholder="1.5"
          property="line-height"
        />
      </div>

      <div className="tw:relative">
        <SelectRow
          label="Weight"
          value={styles["font-weight"] || ""}
          onChange={(v) => onChange("font-weight", v)}
          options={FONT_WEIGHTS}
          property="font-weight"
        />
      </div>

      {colour}

      <div className="tw:relative">
        <ButtonGroup
          label="Align"
          value={styles["text-align"] || ""}
          onChange={(v) => onChange("text-align", v)}
          options={ALIGN_OPTIONS}
          property="text-align"
        />
      </div>
    </>
  );
};

export default FontControls;
