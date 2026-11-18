/**
 * TypographyControls — the rows past Typography's face: Align, then 2L9
 * 247:23404's Letter spacing · Word spacing · Transform · Decoration · Font
 * style · White-space · Word break · Text indent · Vertical align, each a
 * plain row showing CSS's default when unset. Typography keeps them behind
 * More settings (`ADVANCED_TYPOGRAPHY_COUNT` is its badge); Text inside
 * draws them on its face.
 *
 * @module editor/inspector/sections/typography/TypographyControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, InputWithUnit } from "@/editor/inspector/shared/controls";

interface TextControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  isMultiSelect?: boolean;
}

export const ADVANCED_TYPOGRAPHY_COUNT = 10;

/* 2L9 161:8940 draws no Align in the face; it heads More settings. */
const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

const TRANSFORM_OPTIONS = [
  { value: "none", label: "None" },
  { value: "uppercase", label: "Uppercase" },
  { value: "lowercase", label: "Lowercase" },
  { value: "capitalize", label: "Capitalize" },
];
const DECORATION_OPTIONS = [
  { value: "none", label: "None" },
  { value: "underline", label: "Underline" },
  { value: "line-through", label: "Strikethrough" },
  { value: "overline", label: "Overline" },
];
const FONT_STYLE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "italic", label: "Italic" },
];
const WHITE_SPACE_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "nowrap", label: "No wrap" },
  { value: "pre", label: "Pre" },
  { value: "pre-wrap", label: "Pre wrap" },
  { value: "pre-line", label: "Pre line" },
];
const WORD_BREAK_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "break-all", label: "Break all" },
  { value: "keep-all", label: "Keep all" },
  { value: "break-word", label: "Break word" },
];
const VERTICAL_ALIGN_OPTIONS = [
  { value: "baseline", label: "Baseline" },
  { value: "top", label: "Top" },
  { value: "middle", label: "Middle" },
  { value: "bottom", label: "Bottom" },
  { value: "sub", label: "Sub" },
  { value: "super", label: "Super" },
];

export const TypographyControls: React.FC<TextControlsProps> = ({ styles, onChange }) => {
  const select = (label: string, property: string, options: ReadonlyArray<{ value: string; label: string }>) => (
    <SelectRow
      label={label}
      property={property}
      value={styles[property] || options[0].value}
      onChange={(v) => onChange(property, v)}
      options={[...options]}
    />
  );
  return (
    <>
      <ButtonGroup
        label="Align"
        value={styles["text-align"] || ""}
        onChange={(v) => onChange("text-align", v)}
        options={ALIGN_OPTIONS}
        property="text-align"
      />
      <InputWithUnit
        label="Letter spacing"
        value={styles["letter-spacing"] || ""}
        onChange={(v) => onChange("letter-spacing", v)}
        units={["px", "em", "normal"]}
        property="letter-spacing"
      />
      <InputWithUnit
        label="Word spacing"
        value={styles["word-spacing"] || ""}
        onChange={(v) => onChange("word-spacing", v)}
        units={["px", "em", "normal"]}
        property="word-spacing"
      />
      {select("Transform", "text-transform", TRANSFORM_OPTIONS)}
      {select("Decoration", "text-decoration", DECORATION_OPTIONS)}
      {select("Font style", "font-style", FONT_STYLE_OPTIONS)}
      {select("White-space", "white-space", WHITE_SPACE_OPTIONS)}
      {select("Word break", "word-break", WORD_BREAK_OPTIONS)}
      <InputWithUnit
        label="Text indent"
        value={styles["text-indent"] || ""}
        onChange={(v) => onChange("text-indent", v)}
        property="text-indent"
      />
      {select("Vertical align", "vertical-align", VERTICAL_ALIGN_OPTIONS)}
    </>
  );
};

export default TypographyControls;
