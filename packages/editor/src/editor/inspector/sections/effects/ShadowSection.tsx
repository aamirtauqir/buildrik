/**
 * Shadow — one section for every box-shadow (D-12): the outer preset select
 * ("Soft · 0 4 12 px"), the inner (inset) preset, and — behind More
 * settings — the raw CSS of each layer. Presets and custom used to live in
 * two sections that both wrote `box-shadow`; this is now its one writer.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputRow, MoreSettingsToggle, Section, SelectRow } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { composeShadow, extractInnerShadow, extractOuterShadow } from "./effectValues";

const OUTER_PRESETS = [
  { label: "Subtle · 0 1 2 px", value: "0 1px 2px rgba(0,0,0,0.06)" },
  { label: "Soft · 0 4 12 px", value: "0 4px 12px rgba(0,0,0,0.08)" },
  { label: "Medium · 0 8 24 px", value: "0 8px 24px rgba(0,0,0,0.12)" },
  { label: "Large · 0 16 40 px", value: "0 16px 40px rgba(0,0,0,0.16)" },
  { label: "Glow · 0 0 20 px", value: "0 0 20px rgba(26,86,219,0.35)" },
];

const INNER_PRESETS = [
  { label: "Soft", value: "inset 0 2px 4px rgba(0,0,0,0.06)" },
  { label: "Small", value: "inset 0 2px 4px rgba(0,0,0,0.1)" },
  { label: "Medium", value: "inset 0 4px 6px rgba(0,0,0,0.15)" },
  { label: "Deep", value: "inset 0 6px 12px rgba(0,0,0,0.2)" },
  { label: "Top", value: "inset 0 4px 8px -2px rgba(0,0,0,0.2)" },
  { label: "All sides", value: "inset 0 0 10px rgba(0,0,0,0.15)" },
];

/** A value set elsewhere (pasted CSS) stays selectable as "Custom". */
const withCustom = (options: { label: string; value: string }[], current: string) =>
  current && !options.some((o) => o.value === current) ? [...options, { label: "Custom", value: current }] : options;

export const ShadowSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => {
  const [more, setMore] = React.useState(false);
  const outer = extractOuterShadow(styles["box-shadow"]);
  const inner = extractInnerShadow(styles["box-shadow"]);
  const write = (nextOuter: string, nextInner: string) => onChange("box-shadow", composeShadow(nextOuter, nextInner));

  return (
    <Section title="Shadow" isOpen={isOpen} onToggle={onToggle} id="inspector-section-shadow">
      <div className="tw:relative">
        <SelectRow
          label="Outer"
          property="box-shadow"
          placeholder="None"
          value={outer}
          options={withCustom(OUTER_PRESETS, outer)}
          onChange={(v) => write(v, inner)}
        />
      </div>
      <SelectRow label="Inner" placeholder="None" value={inner} options={withCustom(INNER_PRESETS, inner)} onChange={(v) => write(outer, v)} />
      {more && (
        <>
          <InputRow label="Outer CSS" placeholder="0 4px 12px rgba(0,0,0,0.08)" value={outer} onChange={(v) => write(v, inner)} />
          <InputRow
            label="Inner CSS"
            placeholder="inset 0 2px 4px rgba(0,0,0,0.1)"
            value={inner}
            onChange={(v) => write(outer, v && !v.startsWith("inset") ? `inset ${v}` : v)}
          />
        </>
      )}
      <MoreSettingsToggle isOpen={more} onToggle={() => setMore((v) => !v)} />
    </Section>
  );
};
