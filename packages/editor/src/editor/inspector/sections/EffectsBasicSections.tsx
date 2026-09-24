/**
 * Effects tab, board 4428:142686: OPACITY, SHADOW and BLUR each get their own
 * section, drawn open with one control apiece. Everything else that paints is
 * "More effects" (EffectsSection.tsx, advanced).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, SelectRow, SliderInput, MixedValueIndicator } from "../shared/controls";
import {
  composeFilter,
  extractInnerShadow,
  extractOuterShadow,
  parseFilter,
  type EffectsSectionProps,
} from "./EffectsSection";

/* SHADOW, board 4428:142686: one select, each option named for its feel and
   its offsets ("Soft · 0 4 12 px"). */
const SHADOW_OPTIONS = [
  { label: "None", value: "none" },
  { label: "Subtle · 0 1 2 px", value: "0 1px 2px rgba(0,0,0,0.06)" },
  { label: "Soft · 0 4 12 px", value: "0 4px 12px rgba(0,0,0,0.08)" },
  { label: "Medium · 0 8 24 px", value: "0 8px 24px rgba(0,0,0,0.12)" },
  { label: "Large · 0 16 40 px", value: "0 16px 40px rgba(0,0,0,0.16)" },
  { label: "Glow · 0 0 20 px", value: "0 0 20px rgba(26,86,219,0.35)" },
];

type BasicEffectProps = Pick<EffectsSectionProps, "styles" | "onChange" | "isOpen" | "onToggle" | "tier" | "mixedKeys">;

export const OpacitySection: React.FC<BasicEffectProps> = ({ styles, onChange, isOpen, onToggle, tier = "tertiary", mixedKeys }) => {
  const opacity = styles.opacity ? Math.round(parseFloat(styles.opacity) * 100) : 100;
  return (
    <Section title="Opacity" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-opacity">
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="opacity" mixedKeys={mixedKeys} />
        <SliderInput
          label="Opacity"
          fieldLabel="Opacity value"
          value={opacity}
          onChange={(v) => onChange("opacity", String(v / 100))}
          min={0}
          max={100}
        />
      </div>
    </Section>
  );
};

export const ShadowSection: React.FC<BasicEffectProps> = ({ styles, onChange, isOpen, onToggle, tier = "tertiary", mixedKeys }) => {
  const outer = extractOuterShadow(styles["box-shadow"]) || "none";
  const inner = extractInnerShadow(styles["box-shadow"]);
  /* A shadow set elsewhere (the custom field, pasted CSS) stays selected as
     "Custom" — choosing among presets must not silently reset it. */
  const options = SHADOW_OPTIONS.some((o) => o.value === outer)
    ? SHADOW_OPTIONS
    : [...SHADOW_OPTIONS, { label: "Custom", value: outer }];
  return (
    <Section title="Shadow" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-shadow">
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="box-shadow" mixedKeys={mixedKeys} />
        <SelectRow
          label="Shadow"
          value={outer}
          options={options}
          onChange={(v) => {
            const next = v || "none";
            if (!inner) return onChange("box-shadow", next);
            onChange("box-shadow", next === "none" ? inner : `${next}, ${inner}`);
          }}
        />
      </div>
    </Section>
  );
};

export const BlurSection: React.FC<BasicEffectProps> = ({ styles, onChange, isOpen, onToggle, tier = "tertiary", mixedKeys }) => {
  const blur = parseFloat(parseFilter(styles.filter, "blur", "0px").replace("px", ""));
  return (
    <Section title="Blur" isOpen={isOpen} onToggle={onToggle} tier={tier} id="inspector-section-blur">
      <div style={{ position: "relative" }}>
        <MixedValueIndicator prop="filter" mixedKeys={mixedKeys} />
        <SliderInput
          label="Blur"
          fieldLabel="Blur value"
          value={blur}
          onChange={(v) => onChange("filter", composeFilter(styles.filter, "blur", `${v}px`))}
          min={0}
          max={20}
        />
      </div>
    </Section>
  );
};
