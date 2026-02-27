/**
 * TextControls - Text alignment, transform, and spacing controls
 * Part of Typography section refactoring
 *
 * @module components/Panels/ProInspector/sections/typography/TextControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, ColorInput } from "../../shared/Controls";

interface TextControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

export const TextControls: React.FC<TextControlsProps> = ({ styles, onChange }) => {
  return (
    <>
      {/* Text Color */}
      <ColorInput label="Color" value={styles.color || ""} onChange={(v) => onChange("color", v)} />

      {/* Text Align */}
      <ButtonGroup
        label="Align"
        value={styles["text-align"] || ""}
        onChange={(v) => onChange("text-align", v)}
        options={[
          { value: "left", label: "Left", icon: "\u2B05" },
          { value: "center", label: "Center", icon: "\u2B0C" },
          { value: "right", label: "Right", icon: "\u27A1" },
          { value: "justify", label: "Justify", icon: "\u2630" },
        ]}
      />

      {/* Text Transform */}
      <ButtonGroup
        label="Transform"
        value={styles["text-transform"] || ""}
        onChange={(v) => onChange("text-transform", v)}
        options={[
          { value: "none", label: "None", icon: "Aa" },
          { value: "uppercase", label: "Upper", icon: "AA" },
          { value: "lowercase", label: "Lower", icon: "aa" },
          { value: "capitalize", label: "Cap", icon: "Aa" },
        ]}
      />

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
    </>
  );
};

export default TextControls;
