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
  type SectionTier,
} from "../shared/controls";
import { InputField } from "../../../shared/forms/InputField";
import { MixedValueBadge } from "../shared/MixedValueBadge";
import {
  parseTransform,
  serializeTransform,
  updateTransformFunction,
  isOpaqueTransform,
} from "@/shared/utils/parsers/transformParser";
import {
  parseFilter,
  serializeFilter,
  updateFilterFunction,
} from "@/shared/utils/parsers/filterParser";

export interface EffectsSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Controlled open state for auto-expand functionality */
  isOpen?: boolean;
  /** Called when the section header is toggled */
  onToggle?: (open: boolean) => void;
  /** Visual weight tier — threaded from the registry-driven renderer. */
  tier?: SectionTier;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
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

export const EffectsSection: React.FC<EffectsSectionProps> = ({ styles, onChange, isOpen, onToggle, tier = "tertiary", mixedKeys, isMultiSelect }) => {
  // Parse opacity
  const opacity = styles.opacity ? parseFloat(styles.opacity) * 100 : 100;

  // Parse transform values using shared parser
  const transformFns = parseTransform(styles.transform || "");
  const opaqueTransform = isOpaqueTransform(styles.transform || "");
  const scaleFn = transformFns.find((f) => f.name === "scale");
  const rotateFn = transformFns.find((f) => f.name === "rotate");
  const skewFn = transformFns.find((f) => f.name === "skew");
  const translateXFn = transformFns.find((f) => f.name === "translateX");
  const translateYFn = transformFns.find((f) => f.name === "translateY");

  const scaleValue = scaleFn ? parseFloat(String(scaleFn.args[0])) * 100 : 100;
  const rotateValue = rotateFn ? parseFloat(String(rotateFn.args[0]).replace("deg", "")) : 0;
  const skewValue = skewFn ? parseFloat(String(skewFn.args[0]).replace("deg", "")) : 0;
  const translateX = translateXFn ? String(translateXFn.args[0]) : "";
  const translateY = translateYFn ? String(translateYFn.args[0]) : "";

  // Parse filter values using shared parser
  const filterFns = parseFilter(styles.filter || "");
  const blurFn = filterFns.find((f) => f.name === "blur");
  const brightnessFn = filterFns.find((f) => f.name === "brightness");
  const contrastFn = filterFns.find((f) => f.name === "contrast");
  const grayscaleFn = filterFns.find((f) => f.name === "grayscale");

  const blurValue = blurFn ? parseFloat(String(blurFn.args[0]).replace("px", "")) : 0;
  const brightnessValue = brightnessFn ? parseFloat(String(brightnessFn.args[0]).replace("%", "")) : 100;
  const contrastValue = contrastFn ? parseFloat(String(contrastFn.args[0]).replace("%", "")) : 100;
  const grayscaleValue = grayscaleFn ? parseFloat(String(grayscaleFn.args[0]).replace("%", "")) : 0;

  // Build the collapsed preview — prioritize the most visually impactful effect.
  // Shows shadow count OR "blur 4px" OR opacity % OR "scaled/rotated" — whichever
  // is the dominant signal for this element. Only one badge, not all four, so it
  // stays scannable.
  const shadows = styles["box-shadow"] ? styles["box-shadow"].split("),").length : 0;
  const hasTransform = styles.transform && styles.transform !== "none";
  const previewParts: string[] = [];
  if (shadows > 0) previewParts.push(`${shadows} shadow${shadows !== 1 ? "s" : ""}`);
  if (blurValue > 0) previewParts.push(`blur ${blurValue}`);
  if (opacity < 100) previewParts.push(`${Math.round(opacity)}%`);
  if (hasTransform && !previewParts.length) previewParts.push("transform");
  const effectsPreview =
    previewParts.length > 0 ? (
      <span
        style={{
          fontSize: 11,
          color: "var(--buildrick-text-tertiary)",
          fontFamily: "var(--buildrick-font-family-mono)",
          whiteSpace: "nowrap",
        }}
      >
        {previewParts.slice(0, 2).join(" · ")}
      </span>
    ) : undefined;

  return (
    <Section
      title="Effects"
      icon="Sparkles"
      preview={effectsPreview}
      isOpen={isOpen}
      onToggle={onToggle}
      tier={tier}
      id="inspector-section-effects"
    >
      {/* Opacity */}
      <div style={{ position: "relative" }}>
        {mixedKeys?.has("opacity") && (
          <span style={{ position: "absolute", top: "50%", left: 56, transform: "translateY(-50%)", zIndex: 1 }}>
            <MixedValueBadge compact />
          </span>
        )}
        <SliderInput
          label="Opacity"
          value={opacity}
          onChange={(v) => onChange("opacity", String(v / 100))}
          min={0}
          max={100}
          unit="%"
        />
      </div>

      {/* Box Shadow */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>
          Box Shadow{mixedKeys?.has("box-shadow") && <MixedValueBadge compact />}
        </SectionLabel>

        <PresetButtonGrid
          presets={SHADOW_PRESETS}
          currentValue={styles["box-shadow"] || ""}
          onChange={(v) => onChange("box-shadow", v)}
        />

        {/* Custom Shadow */}
        <InputField
          type="text"
          value={styles["box-shadow"] || ""}
          onChange={(e) => onChange("box-shadow", e.target.value)}
          placeholder="0 4px 6px rgba(0,0,0,0.1)"
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
        <InputField
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
        />
      </div>

      {/* Transform */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>
          Transform{mixedKeys?.has("transform") && <MixedValueBadge compact />}
        </SectionLabel>

        <RangeSlider
          label="Scale"
          value={scaleValue}
          onChange={(v) => {
            const fns = parseTransform(styles.transform || "");
            const updated = updateTransformFunction(fns, "scale", [v / 100]);
            onChange("transform", serializeTransform(updated));
          }}
          min={0}
          max={200}
          unit="x"
          labelWidth={50}
          disabled={opaqueTransform}
        />

        <RangeSlider
          label="Rotate"
          value={rotateValue}
          onChange={(v) => {
            const fns = parseTransform(styles.transform || "");
            const updated = updateTransformFunction(fns, "rotate", [`${v}deg`]);
            onChange("transform", serializeTransform(updated));
          }}
          min={-180}
          max={180}
          unit="°"
          labelWidth={50}
          disabled={opaqueTransform}
        />

        <TextInputRow
          label="Move X"
          value={translateX}
          onChange={(v) => {
            const fns = parseTransform(styles.transform || "");
            const updated = updateTransformFunction(fns, "translateX", [v]);
            onChange("transform", serializeTransform(updated));
          }}
          placeholder="0px"
          disabled={opaqueTransform}
        />

        <TextInputRow
          label="Move Y"
          value={translateY}
          onChange={(v) => {
            const fns = parseTransform(styles.transform || "");
            const updated = updateTransformFunction(fns, "translateY", [v]);
            onChange("transform", serializeTransform(updated));
          }}
          placeholder="0px"
          disabled={opaqueTransform}
        />

        <RangeSlider
          label="Skew"
          value={skewValue}
          onChange={(v) => {
            const fns = parseTransform(styles.transform || "");
            const updated = updateTransformFunction(fns, "skew", [`${v}deg`]);
            onChange("transform", serializeTransform(updated));
          }}
          min={-45}
          max={45}
          unit="°"
          labelWidth={50}
          disabled={opaqueTransform}
        />
      </div>

      {/* Transition */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel>
          Transition{mixedKeys?.has("transition") && <MixedValueBadge compact />}
        </SectionLabel>

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
        <SectionLabel style={{ marginBottom: 12 }}>
          Filters{mixedKeys?.has("filter") && <MixedValueBadge compact />}
        </SectionLabel>

        <RangeSlider
          label="Blur"
          value={blurValue}
          onChange={(v) => {
            const fns = parseFilter(styles.filter || "");
            const updated = updateFilterFunction(fns, "blur", [`${v}px`]);
            onChange("filter", serializeFilter(updated));
          }}
          min={0}
          max={20}
          unit="px"
        />

        <RangeSlider
          label="Brightness"
          value={brightnessValue}
          onChange={(v) => {
            const fns = parseFilter(styles.filter || "");
            const updated = updateFilterFunction(fns, "brightness", [`${v}%`]);
            onChange("filter", serializeFilter(updated));
          }}
          min={0}
          max={200}
          unit="%"
        />

        <RangeSlider
          label="Contrast"
          value={contrastValue}
          onChange={(v) => {
            const fns = parseFilter(styles.filter || "");
            const updated = updateFilterFunction(fns, "contrast", [`${v}%`]);
            onChange("filter", serializeFilter(updated));
          }}
          min={0}
          max={200}
          unit="%"
        />

        <RangeSlider
          label="Grayscale"
          value={grayscaleValue}
          onChange={(v) => {
            const fns = parseFilter(styles.filter || "");
            const updated = updateFilterFunction(fns, "grayscale", [`${v}%`]);
            onChange("filter", serializeFilter(updated));
          }}
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
