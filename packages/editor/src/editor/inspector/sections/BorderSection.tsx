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
  MoreSettingsToggle,
  type SectionTier,
} from "../shared/controls";
import { InputField } from "../../../shared/forms/InputField";
import { MixedValueBadge } from "../shared/MixedValueBadge";

export interface BorderSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  /** Whether advanced settings (individual borders + outline) are expanded */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
}

export const BorderSection: React.FC<BorderSectionProps> = ({
  styles,
  onChange,
  // onBatchChange - reserved for batch border operations
  isOpen,
  onToggle,
  tier = "secondary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
  isMultiSelect,
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

  // Compute border preview
  const borderStyle = styles["border-style"] || (styles["border"] ? "set" : undefined);
  const borderPreview = borderStyle ? (
    <span
      style={{
        fontSize: 12,
        color: "var(--buildrick-text-tertiary)",
        fontFamily: "var(--buildrick-font-family-mono)",
        whiteSpace: "nowrap" as const,
      }}
    >
      {styles["border"] || `${borderStyle}`}
    </span>
  ) : undefined;

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
    <Section title="Border" icon="Square" preview={borderPreview} isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-border">
      {/* Border Width */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("border-width") && (
          <span style={{ position: "absolute", top: "50%", left: 56, transform: "translateY(-50%)", zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <InputWithUnit
          label="Width"
          value={styles["border-width"] || ""}
          onChange={(v) => onChange("border-width", v)}
          units={["px", "em", "rem"]}
        />
      </div>

      {/* Border Style */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("border-style") && (
          <span style={{ position: "absolute", top: "50%", left: 56, transform: "translateY(-50%)", zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
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
      </div>

      {/* Border Color */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("border-color") && (
          <span style={{ position: "absolute", top: "50%", left: 56, transform: "translateY(-50%)", zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <ColorInput
          label="Color"
          value={styles["border-color"] || ""}
          onChange={(v) => onChange("border-color", v)}
        />
      </div>

      {/* Border Radius */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("border-radius") && (
          <span style={{ position: "absolute", top: 0, left: 56, zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <CornerRadiusInput
          values={radiusValues}
          onChange={handleRadiusChange}
          linked={radiusLinked}
          onLinkToggle={() => setRadiusLinked(!radiusLinked)}
        />
      </div>

      {/* ─── Advanced: Individual Borders + Outline (behind More settings) ─── */}
      {advancedExpanded && (
        <>
          {/* Individual Borders */}
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "#71717a",
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Individual Borders
            </div>

            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <div key={side} style={{ position: "relative" }}>
                {mixedKeys?.has(`border-${side}`) && (
                  <span style={{ position: "absolute", top: "50%", left: 56, transform: "translateY(-50%)", zIndex: 1 }}>
                    <MixedValueBadge compact />
                  </span>
                )}
                <InputField
                  label={side.charAt(0).toUpperCase() + side.slice(1)}
                  type="text"
                  value={styles[`border-${side}`] || ""}
                  onChange={(e) => onChange(`border-${side}`, e.target.value)}
                  placeholder="1px solid #ccc"
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
                fontSize: 12,
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
        </>
      )}

      {/* Progressive disclosure toggle */}
      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          advancedCount={8}
        />
      )}
    </Section>
  );
};

export default BorderSection;
