/**
 * Transform & motion — scale, rotate, move, skew and the transition that
 * animates them (board 3's fourth "+" row; the transform and transition rows
 * of the old "More effects"). The one writer of `transform` and the
 * `transition-*` longhands.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { MixedValueIndicator, RangeSlider, Section, SelectRow, SubSectionTitle, TextInputRow } from "../../shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { composeTransform, parseFunction } from "./effectValues";

const TRANSITION_PROPERTIES = [
  { value: "all", label: "All" },
  { value: "none", label: "None" },
  { value: "transform", label: "Transform" },
  { value: "opacity", label: "Opacity" },
  { value: "background", label: "Background" },
  { value: "color", label: "Colour" },
  { value: "box-shadow", label: "Shadow" },
];

const EASINGS = [
  { value: "ease", label: "Ease" },
  { value: "ease-in", label: "Ease in" },
  { value: "ease-out", label: "Ease out" },
  { value: "ease-in-out", label: "Ease in out" },
  { value: "linear", label: "Linear" },
  { value: "cubic-bezier(0.4, 0, 0.2, 1)", label: "Smooth" },
];

export const TransformMotionSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle, mixedKeys }) => {
  const t = styles.transform;
  const setT = (fn: string, arg: string) => onChange("transform", composeTransform(t, fn, arg));
  return (
    <Section title="Transform & motion" isOpen={isOpen} onToggle={onToggle} id="inspector-section-transform-motion">
      <div className="tw:relative">
        <MixedValueIndicator prop="transform" mixedKeys={mixedKeys} />
        <RangeSlider label="Scale" unit="%" min={0} max={200} value={parseFloat(parseFunction(t, "scale", "1")) * 100} onChange={(v) => setT("scale", `${v / 100}`)} />
      </div>
      <RangeSlider label="Rotate" unit="°" min={-180} max={180} value={parseFloat(parseFunction(t, "rotate", "0deg"))} onChange={(v) => setT("rotate", `${v}deg`)} />
      <TextInputRow label="Move X" placeholder="0px" value={parseFunction(t, "translateX", "")} onChange={(v) => setT("translateX", v)} />
      <TextInputRow label="Move Y" placeholder="0px" value={parseFunction(t, "translateY", "")} onChange={(v) => setT("translateY", v)} />
      <RangeSlider label="Skew" unit="°" min={-45} max={45} value={parseFloat(parseFunction(t, "skew", "0deg"))} onChange={(v) => setT("skew", `${v}deg`)} />

      <SubSectionTitle>Transition</SubSectionTitle>
      <SelectRow label="Animate" property="transition-property" value={styles["transition-property"] || ""} options={TRANSITION_PROPERTIES} onChange={(v) => onChange("transition-property", v)} />
      <TextInputRow label="Duration" placeholder="0.3s" value={styles["transition-duration"] || ""} onChange={(v) => onChange("transition-duration", v)} />
      <TextInputRow label="Delay" placeholder="0s" value={styles["transition-delay"] || ""} onChange={(v) => onChange("transition-delay", v)} />
      <SelectRow label="Easing" property="transition-timing-function" value={styles["transition-timing-function"] || ""} options={EASINGS} onChange={(v) => onChange("transition-timing-function", v)} />
    </Section>
  );
};
