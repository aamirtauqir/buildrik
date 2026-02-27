/**
 * Effects Section - Shadow, Opacity, Transform, Transition, Cursor
 */

import * as React from "react";
import {
  Section,
  SelectRow,
  SliderInput,
  SectionLabel,
  RangeSlider,
  TextInputRow,
  PresetButtonGrid,
} from "../shared/Controls";

interface EffectsSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
}

// Shadow presets
const SHADOW_PRESETS = [
  { label: "None", value: "none" },
  { label: "SM", value: "0 1px 2px rgba(0,0,0,0.1)" },
  { label: "MD", value: "0 4px 6px rgba(0,0,0,0.1)" },
  { label: "LG", value: "0 10px 15px rgba(0,0,0,0.1)" },
  { label: "XL", value: "0 20px 25px rgba(0,0,0,0.15)" },
  { label: "2XL", value: "0 25px 50px rgba(0,0,0,0.25)" },
  { label: "Glow", value: "0 0 20px rgba(0,115,230,0.5)" },
];

// Inner Shadow presets (L1 → L2 upgrade per plan Part 10, Feature #160)
const INNER_SHADOW_PRESETS = [
  { label: "None", value: "none" },
  { label: "Soft", value: "inset 0 2px 4px rgba(0,0,0,0.06)" },
  { label: "SM", value: "inset 0 2px 4px rgba(0,0,0,0.1)" },
  { label: "MD", value: "inset 0 4px 6px rgba(0,0,0,0.15)" },
  { label: "Deep", value: "inset 0 6px 12px rgba(0,0,0,0.2)" },
  { label: "Top", value: "inset 0 4px 8px -2px rgba(0,0,0,0.2)" },
  { label: "All", value: "inset 0 0 10px rgba(0,0,0,0.15)" },
];

// Parse transform values
const parseTransform = (
  transform: string | undefined,
  type: string,
  defaultValue: string
): string => {
  if (!transform) return defaultValue;
  const match = transform.match(new RegExp(`${type}\\(([^)]+)\\)`));
  return match?.[1] || defaultValue;
};

// Extract inner shadow (inset) from combined box-shadow value
const extractInnerShadow = (boxShadow: string | undefined): string => {
  if (!boxShadow || boxShadow === "none") return "";
  const shadows = boxShadow.split(/,(?![^(]*\))/); // Split on commas not inside parens
  const insetShadow = shadows.find((s) => s.trim().startsWith("inset"));
  return insetShadow?.trim() || "";
};

// Extract outer shadow (non-inset) from combined box-shadow value
const extractOuterShadow = (boxShadow: string | undefined): string => {
  if (!boxShadow || boxShadow === "none") return "";
  const shadows = boxShadow.split(/,(?![^(]*\))/); // Split on commas not inside parens
  const outerShadows = shadows.filter((s) => !s.trim().startsWith("inset"));
  return outerShadows.map((s) => s.trim()).join(", ");
};

// Parse filter values
const parseFilter = (filter: string | undefined, type: string, defaultValue: string): string => {
  if (!filter) return defaultValue;
  const match = filter.match(new RegExp(`${type}\\(([^)]+)\\)`));
  return match?.[1] || defaultValue;
};

export const EffectsSection: React.FC<EffectsSectionProps> = ({ styles, onChange }) => {
  // Parse opacity
  const opacity = styles.opacity ? parseFloat(styles.opacity) * 100 : 100;

  // Parse transform values
  const scaleValue = parseFloat(parseTransform(styles.transform, "scale", "1")) * 100;
  const rotateValue = parseFloat(
    parseTransform(styles.transform, "rotate", "0deg").replace("deg", "")
  );
  const skewValue = parseFloat(parseTransform(styles.transform, "skew", "0deg").replace("deg", ""));
  const translateX = parseTransform(styles.transform, "translateX", "");
  const translateY = parseTransform(styles.transform, "translateY", "");

  // Parse filter values
  const blurValue = parseFloat(parseFilter(styles.filter, "blur", "0px").replace("px", ""));
  const brightnessValue = parseFloat(
    parseFilter(styles.filter, "brightness", "100%").replace("%", "")
  );
  const contrastValue = parseFloat(parseFilter(styles.filter, "contrast", "100%").replace("%", ""));
  const grayscaleValue = parseFloat(parseFilter(styles.filter, "grayscale", "0%").replace("%", ""));

  return (
    <Section title="Effects" icon="Sparkles">
      {/* Opacity */}
      <SliderInput
        label="Opacity"
        value={opacity}
        onChange={(v) => onChange("opacity", String(v / 100))}
        min={0}
        max={100}
        unit="%"
      />

      {/* Box Shadow */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Box Shadow</SectionLabel>

        <PresetButtonGrid
          presets={SHADOW_PRESETS}
          currentValue={styles["box-shadow"] || ""}
          onChange={(v) => onChange("box-shadow", v)}
        />

        {/* Custom Shadow */}
        <input
          type="text"
          value={styles["box-shadow"] || ""}
          onChange={(e) => onChange("box-shadow", e.target.value)}
          placeholder="0 4px 6px rgba(0,0,0,0.1)"
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#e4e4e7",
            fontSize: 12,
            outline: "none",
          }}
        />
      </div>

      {/* Inner Shadow (L1 → L2 upgrade per plan Part 10, Feature #160) */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Inner Shadow</SectionLabel>

        <PresetButtonGrid
          presets={INNER_SHADOW_PRESETS}
          currentValue={extractInnerShadow(styles["box-shadow"])}
          onChange={(v) => {
            // Combine with existing outer shadow if any
            const current = styles["box-shadow"] || "";
            const outerShadow = extractOuterShadow(current);
            if (v === "none") {
              onChange("box-shadow", outerShadow || "none");
            } else {
              onChange("box-shadow", outerShadow ? `${outerShadow}, ${v}` : v);
            }
          }}
        />

        {/* Custom Inner Shadow */}
        <input
          type="text"
          value={extractInnerShadow(styles["box-shadow"])}
          onChange={(e) => {
            const current = styles["box-shadow"] || "";
            const outerShadow = extractOuterShadow(current);
            const insetValue = e.target.value;
            if (!insetValue || insetValue === "none") {
              onChange("box-shadow", outerShadow || "none");
            } else {
              const inset = insetValue.startsWith("inset") ? insetValue : `inset ${insetValue}`;
              onChange("box-shadow", outerShadow ? `${outerShadow}, ${inset}` : inset);
            }
          }}
          placeholder="inset 0 2px 4px rgba(0,0,0,0.1)"
          style={{
            width: "100%",
            padding: "8px 10px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6,
            color: "#e4e4e7",
            fontSize: 12,
            outline: "none",
          }}
        />
      </div>

      {/* Transform */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Transform</SectionLabel>

        <RangeSlider
          label="Scale"
          value={scaleValue}
          onChange={(v) => onChange("transform", `scale(${v / 100})`)}
          min={0}
          max={200}
          unit="x"
          labelWidth={50}
        />

        <RangeSlider
          label="Rotate"
          value={rotateValue}
          onChange={(v) => onChange("transform", `rotate(${v}deg)`)}
          min={-180}
          max={180}
          unit="°"
          labelWidth={50}
        />

        <TextInputRow
          label="Move X"
          value={translateX}
          onChange={(v) => onChange("transform", `translateX(${v})`)}
          placeholder="0px"
        />

        <TextInputRow
          label="Move Y"
          value={translateY}
          onChange={(v) => onChange("transform", `translateY(${v})`)}
          placeholder="0px"
        />

        <RangeSlider
          label="Skew"
          value={skewValue}
          onChange={(v) => onChange("transform", `skew(${v}deg)`)}
          min={-45}
          max={45}
          unit="°"
          labelWidth={50}
        />
      </div>

      {/* Transition */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>Transition</SectionLabel>

        <SelectRow
          label="Property"
          value={styles["transition-property"] || ""}
          onChange={(v) => onChange("transition-property", v)}
          options={[
            { value: "all", label: "All" },
            { value: "none", label: "None" },
            { value: "transform", label: "Transform" },
            { value: "opacity", label: "Opacity" },
            { value: "background", label: "Background" },
            { value: "color", label: "Color" },
            { value: "box-shadow", label: "Box Shadow" },
          ]}
        />

        <TextInputRow
          label="Duration"
          value={styles["transition-duration"] || ""}
          onChange={(v) => onChange("transition-duration", v)}
          placeholder="0.3s"
          labelWidth={70}
        />

        <SelectRow
          label="Easing"
          value={styles["transition-timing-function"] || ""}
          onChange={(v) => onChange("transition-timing-function", v)}
          options={[
            { value: "ease", label: "Ease" },
            { value: "ease-in", label: "Ease In" },
            { value: "ease-out", label: "Ease Out" },
            { value: "ease-in-out", label: "Ease In Out" },
            { value: "linear", label: "Linear" },
            { value: "cubic-bezier(0.4, 0, 0.2, 1)", label: "Smooth" },
          ]}
        />
      </div>

      {/* Cursor */}
      <SelectRow
        label="Cursor"
        value={styles.cursor || ""}
        onChange={(v) => onChange("cursor", v)}
        options={[
          { value: "auto", label: "Auto" },
          { value: "default", label: "Default" },
          { value: "pointer", label: "Pointer (Hand)" },
          { value: "move", label: "Move" },
          { value: "text", label: "Text" },
          { value: "wait", label: "Wait" },
          { value: "help", label: "Help" },
          { value: "not-allowed", label: "Not Allowed" },
          { value: "crosshair", label: "Crosshair" },
          { value: "grab", label: "Grab" },
          { value: "grabbing", label: "Grabbing" },
          { value: "zoom-in", label: "Zoom In" },
          { value: "zoom-out", label: "Zoom Out" },
        ]}
      />

      {/* Filter */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <SectionLabel style={{ marginBottom: 12 }}>Filters</SectionLabel>

        <RangeSlider
          label="Blur"
          value={blurValue}
          onChange={(v) => onChange("filter", `blur(${v}px)`)}
          min={0}
          max={20}
          unit="px"
        />

        <RangeSlider
          label="Brightness"
          value={brightnessValue}
          onChange={(v) => onChange("filter", `brightness(${v}%)`)}
          min={0}
          max={200}
          unit="%"
        />

        <RangeSlider
          label="Contrast"
          value={contrastValue}
          onChange={(v) => onChange("filter", `contrast(${v}%)`)}
          min={0}
          max={200}
          unit="%"
        />

        <RangeSlider
          label="Grayscale"
          value={grayscaleValue}
          onChange={(v) => onChange("filter", `grayscale(${v}%)`)}
          min={0}
          max={100}
          unit="%"
        />
      </div>

      {/* Mix Blend Mode */}
      <SelectRow
        label="Blend Mode"
        value={styles["mix-blend-mode"] || ""}
        onChange={(v) => onChange("mix-blend-mode", v)}
        options={[
          { value: "normal", label: "Normal" },
          { value: "multiply", label: "Multiply" },
          { value: "screen", label: "Screen" },
          { value: "overlay", label: "Overlay" },
          { value: "darken", label: "Darken" },
          { value: "lighten", label: "Lighten" },
          { value: "color-dodge", label: "Color Dodge" },
          { value: "color-burn", label: "Color Burn" },
          { value: "difference", label: "Difference" },
          { value: "exclusion", label: "Exclusion" },
        ]}
      />
    </Section>
  );
};

export default EffectsSection;
