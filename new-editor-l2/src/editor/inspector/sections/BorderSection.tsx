/**
 * Border Section - Border, Radius, Outline
 */

import * as React from "react";
import {
  Section,
  SelectRow,
  ColorInput,
  InputWithUnit,
  CornerRadiusInput,
} from "../shared/Controls";

interface BorderSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
}

export const BorderSection: React.FC<BorderSectionProps> = ({
  styles,
  onChange,
  // onBatchChange - reserved for batch border operations
}) => {
  const [radiusLinked, setRadiusLinked] = React.useState(true);

  // Parse border radius values
  const parseRadius = (): {
    tl: string;
    tr: string;
    br: string;
    bl: string;
  } => {
    const br = styles["border-radius"] || "";
    const parts = br.split(" ").filter(Boolean);
    if (parts.length === 1) {
      return { tl: parts[0], tr: parts[0], br: parts[0], bl: parts[0] };
    } else if (parts.length === 4) {
      return { tl: parts[0], tr: parts[1], br: parts[2], bl: parts[3] };
    }
    return {
      tl: styles["border-top-left-radius"] || "",
      tr: styles["border-top-right-radius"] || "",
      br: styles["border-bottom-right-radius"] || "",
      bl: styles["border-bottom-left-radius"] || "",
    };
  };

  const radiusValues = parseRadius();

  const handleRadiusChange = (corner: "tl" | "tr" | "br" | "bl", value: string) => {
    if (radiusLinked) {
      onChange("border-radius", value);
    } else {
      const map = {
        tl: "border-top-left-radius",
        tr: "border-top-right-radius",
        br: "border-bottom-right-radius",
        bl: "border-bottom-left-radius",
      };
      onChange(map[corner], value);
    }
  };

  return (
    <Section title="Border" icon="Square">
      {/* Border Width */}
      <InputWithUnit
        label="Width"
        value={styles["border-width"] || ""}
        onChange={(v) => onChange("border-width", v)}
        units={["px", "em", "rem"]}
      />

      {/* Border Style */}
      <SelectRow
        label="Style"
        value={styles["border-style"] || ""}
        onChange={(v) => onChange("border-style", v)}
        options={[
          { value: "none", label: "None" },
          { value: "solid", label: "Solid" },
          { value: "dashed", label: "Dashed" },
          { value: "dotted", label: "Dotted" },
          { value: "double", label: "Double" },
          { value: "groove", label: "Groove" },
          { value: "ridge", label: "Ridge" },
          { value: "inset", label: "Inset" },
          { value: "outset", label: "Outset" },
        ]}
      />

      {/* Border Color */}
      <ColorInput
        label="Color"
        value={styles["border-color"] || ""}
        onChange={(v) => onChange("border-color", v)}
      />

      {/* Border Radius */}
      <CornerRadiusInput
        values={radiusValues}
        onChange={handleRadiusChange}
        linked={radiusLinked}
        onLinkToggle={() => setRadiusLinked(!radiusLinked)}
      />

      {/* Individual Borders */}
      <div style={{ marginTop: 16 }}>
        <div
          style={{
            fontSize: 11,
            color: "#71717a",
            fontWeight: 500,
            marginBottom: 12,
          }}
        >
          Individual Borders
        </div>

        {(["top", "right", "bottom", "left"] as const).map((side) => (
          <div
            key={side}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#71717a",
                minWidth: 50,
                textTransform: "capitalize",
              }}
            >
              {side}
            </span>
            <input
              type="text"
              value={styles[`border-${side}`] || ""}
              onChange={(e) => onChange(`border-${side}`, e.target.value)}
              placeholder="1px solid #ccc"
              style={{
                flex: 1,
                padding: "6px 8px",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 4,
                color: "#e4e4e7",
                fontSize: 11,
                outline: "none",
              }}
            />
          </div>
        ))}
      </div>

      {/* Outline */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#71717a",
            fontWeight: 500,
            marginBottom: 12,
          }}
        >
          Outline
        </div>

        <InputWithUnit
          label="Width"
          value={styles["outline-width"] || ""}
          onChange={(v) => onChange("outline-width", v)}
          units={["px", "em"]}
        />

        <SelectRow
          label="Style"
          value={styles["outline-style"] || ""}
          onChange={(v) => onChange("outline-style", v)}
          options={[
            { value: "none", label: "None" },
            { value: "solid", label: "Solid" },
            { value: "dashed", label: "Dashed" },
            { value: "dotted", label: "Dotted" },
          ]}
        />

        <ColorInput
          label="Color"
          value={styles["outline-color"] || ""}
          onChange={(v) => onChange("outline-color", v)}
        />

        <InputWithUnit
          label="Offset"
          value={styles["outline-offset"] || ""}
          onChange={(v) => onChange("outline-offset", v)}
          units={["px", "em"]}
        />
      </div>
    </Section>
  );
};

export default BorderSection;
