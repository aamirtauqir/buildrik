/**
 * Border Section — width, style, color and corner radius (G2-154: the
 * separate Corner radius section folded back in), + advanced (individual
 * sides + outline).
 */

import * as React from "react";
import type { Composer } from "../../../engine";
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
import { MixedValueIndicator } from "../shared/controls";
import { parseCssShorthand } from "../shared/utils/parseCssShorthand";

export interface BorderSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
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
  /** Threaded so binding chips can jump to the Design panel. */
  composer?: Composer | null;
}

export const BorderSection: React.FC<BorderSectionProps> = ({
  styles,
  onChange,
  isOpen,
  onToggle,
  tier = "secondary",
  advancedExpanded = false,
  onAdvancedToggle,
  mixedKeys,
  isMultiSelect,
  composer,
}) => {
  const [radiusLinked, setRadiusLinked] = React.useState(true);
  const { top: tl, right: tr, bottom: br, left: bl } = parseCssShorthand(styles["border-radius"] || "");
  const radii = {
    tl: tl || styles["border-top-left-radius"] || "",
    tr: tr || styles["border-top-right-radius"] || "",
    br: br || styles["border-bottom-right-radius"] || "",
    bl: bl || styles["border-bottom-left-radius"] || "",
  };
  const CORNER_PROP = {
    tl: "border-top-left-radius",
    tr: "border-top-right-radius",
    br: "border-bottom-right-radius",
    bl: "border-bottom-left-radius",
  } as const;
  const handleRadius = (corner: keyof typeof CORNER_PROP, value: string) =>
    onChange(radiusLinked ? "border-radius" : CORNER_PROP[corner], value);
  /* Corners that differ (or were unlinked) keep the per-corner box in view. */
  const radiusSplit = !radiusLinked || new Set([radii.tl, radii.tr, radii.br, radii.bl]).size > 1;
  const hasStroke = Boolean(
    (styles["border-width"] && parseFloat(styles["border-width"]) > 0) ||
      (styles["border-style"] && styles["border-style"] !== "none") ||
      styles["border"],
  );

  // Preview: width + style, shown as indicator pill
  const borderStyle = styles["border-style"] || (styles["border"] ? "set" : undefined);
  const borderWidth = styles["border-width"];
  const borderPreview = borderStyle ? (
    <span className="bdi-ind">
      {borderWidth ? `${borderWidth} ${borderStyle}` : (styles["border"] || borderStyle)}
    </span>
  ) : undefined;

  return (
    <Section title="Border" icon="Square" preview={borderPreview} isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-border">
      {/* Board 7056:79008: the open BORDER is one row, "Radius 8 px". The
          stroke (width · style · colour) and per-corner radii sit behind
          More settings until the element has a border or split corners. */}
      {radiusSplit ? (
        <div style={{ position: "relative" }}>
          <MixedValueIndicator prop="border-radius" mixedKeys={mixedKeys} offsetLeft={56} />
          <CornerRadiusInput
            values={radii}
            onChange={handleRadius}
            linked={radiusLinked}
            onLinkToggle={() => setRadiusLinked(!radiusLinked)}
          />
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          <MixedValueIndicator prop="border-radius" mixedKeys={mixedKeys} />
          <InputWithUnit
            label="Radius"
            value={radii.tl}
            onChange={(v) => onChange("border-radius", v)}
            units={["px", "%", "em", "rem"]}
          />
        </div>
      )}

      {(hasStroke || advancedExpanded) && (
        <>
      {/* Border Width */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="border-width" mixedKeys={mixedKeys} />
        <InputWithUnit
          label="Width"
          value={styles["border-width"] || ""}
          onChange={(v) => onChange("border-width", v)}
          units={["px", "em", "rem"]}
        />
      </div>

      {/* Border Style */}
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="border-style" mixedKeys={mixedKeys} />
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
        <MixedValueIndicator prop="border-color" mixedKeys={mixedKeys} />
        <ColorInput
          label="Color"
          value={styles["border-color"] || ""}
          onChange={(v) => onChange("border-color", v)}
          composer={composer}
        />
      </div>

        </>
      )}

      {advancedExpanded && !radiusSplit && (
        <div style={{ position: "relative" }}>
          <CornerRadiusInput
            values={radii}
            onChange={handleRadius}
            linked={radiusLinked}
            onLinkToggle={() => setRadiusLinked(!radiusLinked)}
          />
        </div>
      )}

      {/* ─── Advanced: Individual Borders + Outline (behind More settings) ─── */}
      {advancedExpanded && (
        <>
          {/* Individual Borders */}
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                fontSize: 12,
                color: "var(--bk-ink-muted)",
                fontWeight: 500,
                marginBottom: 12,
              }}
            >
              Individual Borders
            </div>

            {(["top", "right", "bottom", "left"] as const).map((side) => (
              <div key={side} style={{ position: "relative" }}>
                <MixedValueIndicator prop={`border-${side}`} mixedKeys={mixedKeys} />
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
              borderTop: "1px solid var(--bk-border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: "var(--bk-ink-muted)",
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
              composer={composer}
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
          advancedCount={hasStroke ? 8 : 11}
        />
      )}
    </Section>
  );
};

export default BorderSection;
