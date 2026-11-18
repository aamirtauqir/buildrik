/**
 * Opacity — 2L9 161:12525: one field, "Opacity  100%". The one writer of
 * `opacity`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputWithUnit, Section } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";

export const OpacitySection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => {
  const opacity = styles.opacity ? Math.round(parseFloat(styles.opacity) * 100) : 100;
  return (
    <Section title="Opacity" isOpen={isOpen} onToggle={onToggle} id="inspector-section-opacity">
      <InputWithUnit
        label="Opacity"
        property="opacity"
        units={["%"]}
        value={`${opacity}%`}
        onChange={(v) => {
          const n = parseFloat(v);
          if (Number.isFinite(n)) onChange("opacity", String(Math.max(0, Math.min(100, n)) / 100));
        }}
      />
    </Section>
  );
};
