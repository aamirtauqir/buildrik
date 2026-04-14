/**
 * FontControls - Font weight, style, and decoration controls
 * Part of Typography section refactoring
 *
 * @module editor/inspector/sections/typography/FontControls
 * @license BSD-3-Clause
 */

import * as React from "react";
import { SelectRow, ButtonGroup, InputWithUnit } from "../../shared/controls";
import { MixedValueBadge } from "../../shared/MixedValueBadge";

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
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const FontControls: React.FC<FontControlsProps> = ({ styles, onChange, mixedKeys }) => {
  return (
    <>
      {/* Font Size - BUG-007 FIX: Show default 16px when not explicitly set */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("font-size") && (
          <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <InputWithUnit
          label="Size"
          value={styles["font-size"] || "16px"}
          onChange={(v) => onChange("font-size", v)}
          units={["px", "em", "rem", "%", "vw"]}
        />
      </div>

      {/* Font Weight */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("font-weight") && (
          <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <SelectRow
          label="Weight"
          value={styles["font-weight"] || ""}
          onChange={(v) => onChange("font-weight", v)}
          options={FONT_WEIGHTS}
        />
      </div>

      {/* Line Height */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("line-height") && (
          <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <InputWithUnit
          label="Line H"
          value={styles["line-height"] || ""}
          onChange={(v) => onChange("line-height", v)}
          units={["px", "em", "%", "normal"]}
        />
      </div>

      {/* Letter Spacing */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("letter-spacing") && (
          <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <InputWithUnit
          label="Letter Sp"
          value={styles["letter-spacing"] || ""}
          onChange={(v) => onChange("letter-spacing", v)}
          units={["px", "em", "normal"]}
        />
      </div>

      {/* Text Decoration */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("text-decoration") && (
          <span style={{ position: "absolute", left: 56, top: "50%", transform: "translateY(-50%)", zIndex: 1, lineHeight: 0 }}>
            <MixedValueBadge compact />
          </span>
        )}
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
      </div>

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
