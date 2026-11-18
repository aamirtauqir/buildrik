/**
 * Transform & motion — scale, rotate, move, skew and the transition that
 * animates them (board 3's fourth "+" row; the transform and transition rows
 * of the old "More effects"). The one writer of `transform` and the
 * `transition-*` longhands.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputWithUnit, Section, SelectRow, SubSectionTitle, TextInputRow } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { composeTransform, parseFunction } from "./effectValues";

const MOVE_UNITS = ["px", "%", "rem", "em"];
const TIME_UNITS = ["ms", "s"];

const EASINGS = [
  { value: "ease", label: "ease" },
  { value: "ease-in", label: "ease-in" },
  { value: "ease-out", label: "ease-out" },
  { value: "ease-in-out", label: "ease-in-out" },
  { value: "linear", label: "linear" },
  { value: "cubic-bezier(0.4, 0, 0.2, 1)", label: "Smooth" },
];

/** "102%" → "1.02"; "" clears. */
const scaleFrom = (v: string): string | null => {
  if (v === "") return "";
  const n = parseFloat(v);
  return Number.isFinite(n) ? String(Math.round(n * 100) / 10000) : null;
};

/* 2L9 A08 247:25026: Transform reads as fields — Scale 102%, Rotate 0 deg,
   Move X / Y with their unit, Skew 0 deg — and Transition as Property ·
   Duration · Delay · Easing. Unset fields read empty (DD-12 — no
   value-shaped placeholders). */
export const TransformMotionSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => {
  const t = styles.transform;
  const setT = (fn: string, arg: string) => onChange("transform", composeTransform(t, fn, arg));
  const scale = parseFunction(t, "scale", "");
  const angle = (fn: string) => {
    const v = parseFunction(t, fn, "");
    return v ? `${parseFloat(v)}deg` : "";
  };
  return (
    <Section title="Transform and transition" isOpen={isOpen} onToggle={onToggle} id="inspector-section-transform-motion">
      <InputWithUnit
        label="Scale"
        property="transform"
        units={["%"]}
        placeholder=""
        value={scale ? `${Math.round(parseFloat(scale) * 10000) / 100}%` : ""}
        onChange={(v) => {
          const next = scaleFrom(v);
          if (next !== null) setT("scale", next);
        }}
      />
      <InputWithUnit label="Rotate" property="transform" units={["deg"]} placeholder="" value={angle("rotate")} onChange={(v) => setT("rotate", v)} />
      <InputWithUnit label="Move X" property="transform" units={MOVE_UNITS} placeholder="" value={parseFunction(t, "translateX", "")} onChange={(v) => setT("translateX", v)} />
      <InputWithUnit label="Move Y" property="transform" units={MOVE_UNITS} placeholder="" value={parseFunction(t, "translateY", "")} onChange={(v) => setT("translateY", v)} />
      <InputWithUnit label="Skew" property="transform" units={["deg"]} placeholder="" value={angle("skew")} onChange={(v) => setT("skew", v)} />

      <SubSectionTitle>Transition</SubSectionTitle>
      <TextInputRow label="Property" property="transition-property" placeholder="" value={styles["transition-property"] || ""} onChange={(v) => onChange("transition-property", v)} />
      <InputWithUnit label="Duration" property="transition-duration" units={TIME_UNITS} placeholder="" value={styles["transition-duration"] || ""} onChange={(v) => onChange("transition-duration", v)} />
      <InputWithUnit label="Delay" property="transition-delay" units={TIME_UNITS} placeholder="" value={styles["transition-delay"] || ""} onChange={(v) => onChange("transition-delay", v)} />
      <SelectRow label="Easing" property="transition-timing-function" value={styles["transition-timing-function"] || ""} options={EASINGS} onChange={(v) => onChange("transition-timing-function", v)} />
    </Section>
  );
};
