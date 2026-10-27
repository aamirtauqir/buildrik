/**
 * Border Section — 2L9 247:24493: Width · Style · Color, then the corners
 * (one "Radius" row while they agree, else Top left · Top right · Bottom
 * right · Bottom left), then "Outline" (Width · Style · Color · Offset) once
 * the element has one. More settings: the per-corner rows, the outline and
 * the individual sides (border-top …), which the board does not draw but
 * which have no other writer.
 */

import * as React from "react";
import type { Composer } from "@/engine";
import {
  Section,
  SelectRow,
  ColorInput,
  InputWithUnit,
  InputRow,
  MoreSettingsToggle,
  type SectionTier,
} from "../shared/controls";
import { GROUP_TITLE } from "../shared/controls/controlClasses";
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
  /** Whether More settings (corners, outline, individual sides) is open */
  advancedExpanded?: boolean;
  /** Called when the More settings toggle is clicked */
  onAdvancedToggle?: () => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Threaded so binding chips can jump to the Design panel. */
  composer?: Composer | null;
}

const CORNERS = [
  { key: "tl", label: "Top left", property: "border-top-left-radius" },
  { key: "tr", label: "Top right", property: "border-top-right-radius" },
  { key: "br", label: "Bottom right", property: "border-bottom-right-radius" },
  { key: "bl", label: "Bottom left", property: "border-bottom-left-radius" },
] as const;

const BORDER_STYLES = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
  { value: "double", label: "Double" },
  { value: "groove", label: "Groove" },
  { value: "ridge", label: "Ridge" },
  { value: "inset", label: "Inset" },
  { value: "outset", label: "Outset" },
];

const OUTLINE_STYLES = [
  { value: "none", label: "None" },
  { value: "solid", label: "Solid" },
  { value: "dashed", label: "Dashed" },
  { value: "dotted", label: "Dotted" },
];

const RADIUS_UNITS = ["px", "%", "em", "rem"];
const OUTLINE_KEYS = ["outline-width", "outline-style", "outline-color", "outline-offset"];

export const BorderSection: React.FC<BorderSectionProps> = ({
  styles,
  onChange,
  isOpen,
  onToggle,
  tier = "secondary",
  advancedExpanded = false,
  onAdvancedToggle,
  composer,
}) => {
  const short = parseCssShorthand(styles["border-radius"] || "");
  const radii = {
    tl: styles["border-top-left-radius"] || short.top || "",
    tr: styles["border-top-right-radius"] || short.right || "",
    br: styles["border-bottom-right-radius"] || short.bottom || "",
    bl: styles["border-bottom-left-radius"] || short.left || "",
  };
  /* Corners that differ keep their four rows in view (the board's state). */
  const split = new Set(Object.values(radii)).size > 1;
  const corners = split || advancedExpanded;
  const hasOutline = OUTLINE_KEYS.some((k) => styles[k] && styles[k] !== "none");
  const outline = hasOutline || advancedExpanded;

  return (
    <Section title="Border" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-border">
      <InputWithUnit
        property="border-width"
        label="Width"
        value={styles["border-width"] || ""}
        onChange={(v) => onChange("border-width", v)}
        units={["px", "em", "rem"]}
      />
      <SelectRow
        property="border-style"
        label="Style"
        value={styles["border-style"] || ""}
        onChange={(v) => onChange("border-style", v)}
        options={BORDER_STYLES}
      />
      <ColorInput
        property="border-color"
        label="Color"
        value={styles["border-color"] || ""}
        onChange={(v) => onChange("border-color", v)}
        composer={composer}
      />

      {corners ? (
        CORNERS.map((c) => (
          <InputWithUnit
            key={c.key}
            property={c.property}
            label={c.label}
            value={radii[c.key]}
            onChange={(v) => onChange(c.property, v)}
            units={RADIUS_UNITS}
          />
        ))
      ) : (
        <InputWithUnit
          property="border-radius"
          label="Radius"
          value={radii.tl}
          onChange={(v) => onChange("border-radius", v)}
          units={RADIUS_UNITS}
        />
      )}

      {outline && (
        <>
          <div className={GROUP_TITLE}>Outline</div>
          <InputWithUnit
            property="outline-width"
            label="Width"
            value={styles["outline-width"] || ""}
            onChange={(v) => onChange("outline-width", v)}
            units={["px", "em"]}
          />
          <SelectRow
            property="outline-style"
            label="Style"
            value={styles["outline-style"] || ""}
            onChange={(v) => onChange("outline-style", v)}
            options={OUTLINE_STYLES}
          />
          <ColorInput
            property="outline-color"
            label="Color"
            value={styles["outline-color"] || ""}
            onChange={(v) => onChange("outline-color", v)}
            composer={composer}
          />
          <InputWithUnit
            property="outline-offset"
            label="Offset"
            value={styles["outline-offset"] || ""}
            onChange={(v) => onChange("outline-offset", v)}
            units={["px", "em"]}
          />
        </>
      )}

      {advancedExpanded && (
        <>
          <div className={GROUP_TITLE}>Individual sides</div>
          {(["top", "right", "bottom", "left"] as const).map((side) => (
            <InputRow
              key={side}
              label={side.charAt(0).toUpperCase() + side.slice(1)}
              property={`border-${side}`}
              value={styles[`border-${side}`] || ""}
              onChange={(v) => onChange(`border-${side}`, v)}
              placeholder="1px solid #ccc"
            />
          ))}
        </>
      )}

      {onAdvancedToggle && (
        <MoreSettingsToggle
          isOpen={advancedExpanded}
          onToggle={() => onAdvancedToggle()}
          advancedCount={(split ? 0 : 4) + (hasOutline ? 0 : 4) + 4}
        />
      )}
    </Section>
  );
};

export default BorderSection;
