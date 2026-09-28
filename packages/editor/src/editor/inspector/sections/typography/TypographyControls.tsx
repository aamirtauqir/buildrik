/**
 * TypographyControls — what "More settings" holds for text: everything the
 * section can set that boards 1 and 4 keep off its face (Font, Font size,
 * Line height, Weight, Colour, Align). Nine rows — `ADVANCED_TYPOGRAPHY_COUNT`
 * is the badge the toggle shows.
 *
 * @module editor/inspector/sections/typography/TypographyControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, InputWithUnit } from "../../shared/controls";

interface TextControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isMultiSelect?: boolean;
}

export const ADVANCED_TYPOGRAPHY_COUNT = 9;

export const TypographyControls: React.FC<TextControlsProps> = ({ styles, onChange }) => {
  return (
    <>
      <div className="tw:relative">
        <ButtonGroup
          label="Transform"
          value={styles["text-transform"] || ""}
          onChange={(v) => onChange("text-transform", v)}
          property="text-transform"
          options={[
            { value: "none", label: "None", icon: "Aa" },
            { value: "uppercase", label: "Upper", icon: "AA" },
            { value: "lowercase", label: "Lower", icon: "aa" },
            { value: "capitalize", label: "Cap", icon: "Aa" },
          ]}
        />
      </div>

      <div className="tw:relative">
        <ButtonGroup
          label="Decoration"
          value={styles["text-decoration"] || ""}
          onChange={(v) => onChange("text-decoration", v)}
          property="text-decoration"
          options={[
            { value: "none", label: "None", icon: "\u2014" },
            { value: "underline", label: "Under", icon: "U\u0332" },
            { value: "line-through", label: "Strike", icon: "S\u0336" },
            { value: "overline", label: "Over", icon: "O\u0305" },
          ]}
        />
      </div>

      <div className="tw:relative">
        <InputWithUnit
          label="Letter"
          value={styles["letter-spacing"] || ""}
          onChange={(v) => onChange("letter-spacing", v)}
          units={["px", "em", "normal"]}
          property="letter-spacing"
        />
      </div>

      <div className="tw:relative">
        <InputWithUnit
          label="Word"
          value={styles["word-spacing"] || ""}
          onChange={(v) => onChange("word-spacing", v)}
          units={["px", "em", "normal"]}
          property="word-spacing"
        />
      </div>

      {/* Font Style */}
      <div className="tw:relative">
        <ButtonGroup
          label="Style"
          value={styles["font-style"] || ""}
          onChange={(v) => onChange("font-style", v)}
          property="font-style"
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
        property="white-space"
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
        property="word-break"
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
        property="text-indent"
      />

      {/* Vertical Align */}
      <SelectRow
        label="Vertical Align"
        value={styles["vertical-align"] || ""}
        onChange={(v) => onChange("vertical-align", v)}
        property="vertical-align"
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
