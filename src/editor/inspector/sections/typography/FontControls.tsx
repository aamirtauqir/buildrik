/**
 * FontControls - Font weight, style, and decoration controls
 * Part of Typography section refactoring
 *
 * @module components/Panels/ProInspector/sections/typography/FontControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, InputWithUnit } from "../../shared/Controls";

// Font weight options
export const FONT_WEIGHTS = [
  { value: "100", label: "Thin (100)" },
  { value: "200", label: "Extra Light (200)" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Regular (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "900", label: "Black (900)" },
];

interface FontControlsProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

export const FontControls: React.FC<FontControlsProps> = ({ styles, onChange }) => {
  return (
    <>
      {/* Font Size - BUG-007 FIX: Show default 16px when not explicitly set */}
      <InputWithUnit
        label="Size"
        value={styles["font-size"] || "16px"}
        onChange={(v) => onChange("font-size", v)}
        units={["px", "em", "rem", "%", "vw"]}
      />

      {/* Font Weight */}
      <SelectRow
        label="Weight"
        value={styles["font-weight"] || ""}
        onChange={(v) => onChange("font-weight", v)}
        options={FONT_WEIGHTS}
      />

      {/* Line Height */}
      <InputWithUnit
        label="Line H"
        value={styles["line-height"] || ""}
        onChange={(v) => onChange("line-height", v)}
        units={["px", "em", "%", "normal"]}
      />

      {/* Letter Spacing */}
      <InputWithUnit
        label="Letter Sp"
        value={styles["letter-spacing"] || ""}
        onChange={(v) => onChange("letter-spacing", v)}
        units={["px", "em", "normal"]}
      />

      {/* Text Decoration */}
      <ButtonGroup
        label="Decoration"
        value={styles["text-decoration"] || ""}
        onChange={(v) => onChange("text-decoration", v)}
        options={[
          { value: "none", label: "None", icon: "\u2014" },
          { value: "underline", label: "Under", icon: "U\u0332" },
          { value: "line-through", label: "Strike", icon: "S\u0336" },
          { value: "overline", label: "Over", icon: "O\u0305" },
        ]}
      />

      {/* Font Style */}
      <ButtonGroup
        label="Style"
        value={styles["font-style"] || ""}
        onChange={(v) => onChange("font-style", v)}
        options={[
          { value: "normal", label: "Normal", icon: "N" },
          { value: "italic", label: "Italic", icon: "I" },
        ]}
      />
    </>
  );
};

export default FontControls;
