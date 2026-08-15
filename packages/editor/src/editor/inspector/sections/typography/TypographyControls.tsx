/**
 * TypographyControls — what "More settings" holds for text.
 *
 * Colour, Align, Transform and Word spacing used to live here; board 807:8342
 * draws all four on the section's face, so they moved up into FontControls.
 * What is left is what the board keeps out of the way — five rows, which is
 * what the More settings badge has always claimed.
 *
 * @module editor/inspector/sections/typography/TypographyControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, MixedValueIndicator, InputWithUnit } from "../../shared/controls";

interface TextControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const TypographyControls: React.FC<TextControlsProps> = ({ styles, onChange, mixedKeys }) => {
  return (
    <>
      {/* Font Style */}
      <div className="tw:relative">
        <MixedValueIndicator prop="font-style" mixedKeys={mixedKeys} />
        <ButtonGroup
          label="Style"
          value={styles["font-style"] || ""}
          onChange={(v) => onChange("font-style", v)}
          options={[
            { value: "normal", label: "Normal", icon: "N" },
            { value: "italic", label: "Italic", icon: "I" },
          ]}
        />
      </div>

      {/* White Space */}
      <SelectRow
        label="White Space"
        value={styles["white-space"] || ""}
        onChange={(v) => onChange("white-space", v)}
        options={[
          { value: "normal", label: "Normal" },
          { value: "nowrap", label: "No Wrap" },
          { value: "pre", label: "Pre" },
          { value: "pre-wrap", label: "Pre Wrap" },
          { value: "pre-line", label: "Pre Line" },
        ]}
      />

      {/* Word Break */}
      <SelectRow
        label="Word Break"
        value={styles["word-break"] || ""}
        onChange={(v) => onChange("word-break", v)}
        options={[
          { value: "normal", label: "Normal" },
          { value: "break-all", label: "Break All" },
          { value: "keep-all", label: "Keep All" },
          { value: "break-word", label: "Break Word" },
        ]}
      />

      {/* Text Indent */}
      <InputWithUnit
        label="Text Indent"
        value={styles["text-indent"] || ""}
        onChange={(v) => onChange("text-indent", v)}
      />

      {/* Vertical Align */}
      <SelectRow
        label="Vertical Align"
        value={styles["vertical-align"] || ""}
        onChange={(v) => onChange("vertical-align", v)}
        options={[
          { value: "baseline", label: "Baseline" },
          { value: "top", label: "Top" },
          { value: "middle", label: "Middle" },
          { value: "bottom", label: "Bottom" },
          { value: "sub", label: "Sub" },
          { value: "super", label: "Super" },
        ]}
      />
    </>
  );
};

export default TypographyControls;
