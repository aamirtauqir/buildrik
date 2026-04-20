/**
 * TextControls - Text alignment, transform, and spacing controls
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/TypographyControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, ColorInput, MixedValueIndicator } from "../../shared/controls";

interface TextControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const TypographyControls: React.FC<TextControlsProps> = ({ styles, onChange, mixedKeys }) => {
  return (
    <>
      {/* Text Color */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="color" mixedKeys={mixedKeys} />
        <ColorInput label="Color" value={styles.color || ""} onChange={(v) => onChange("color", v)} />
      </div>

      {/* Text Align */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="text-align" mixedKeys={mixedKeys} />
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
      </div>

      {/* Text Transform */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="text-transform" mixedKeys={mixedKeys} />
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
    </>
  );
};

export default TypographyControls;