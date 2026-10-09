/**
 * Opacity — board 3's first Effects row: "+" until the element has an
 * opacity, then one slider (0–100 %). The one writer of `opacity`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section, SliderInput } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";

export const OpacitySection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => {
  const opacity = styles.opacity ? Math.round(parseFloat(styles.opacity) * 100) : 100;
  return (
    <Section title="Opacity" isOpen={isOpen} onToggle={onToggle} id="inspector-section-opacity">
      <div className="tw:relative">
        <SliderInput
          label="Opacity"
          property="opacity"
          fieldLabel="Opacity, percent"
          unit="%"
          value={opacity}
          onChange={(v) => onChange("opacity", String(v / 100))}
          min={0}
          max={100}
        />
      </div>
    </Section>
  );
};
