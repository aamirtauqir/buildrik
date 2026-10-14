/**
 * Filters — blur plus brightness, contrast and grayscale (board 3; renamed
 * from Blur, absorbing the filter rows of the old "More effects"). Each
 * slider merges its own function into `filter`, so moving one never drops
 * another. The one writer of `filter`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { RangeSlider, Section } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { composeFilter, parseFunction } from "./effectValues";

const FILTERS = [
  { fn: "blur", label: "Blur", unit: "px", identity: "0px", min: 0, max: 20 },
  { fn: "brightness", label: "Brightness", unit: "%", identity: "100%", min: 0, max: 200 },
  { fn: "contrast", label: "Contrast", unit: "%", identity: "100%", min: 0, max: 200 },
  { fn: "grayscale", label: "Grayscale", unit: "%", identity: "0%", min: 0, max: 100 },
] as const;

export const FiltersSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => (
  <Section title="Filters" isOpen={isOpen} onToggle={onToggle} id="inspector-section-filters">
    <div className="tw:relative">
      {FILTERS.map((f) => (
        <RangeSlider
          key={f.fn}
          label={f.label}
          property="filter"
          unit={f.unit}
          min={f.min}
          max={f.max}
          value={parseFloat(parseFunction(styles.filter, f.fn, f.identity))}
          onChange={(v) => onChange("filter", composeFilter(styles.filter, f.fn, `${v}${f.unit}`))}
        />
      ))}
    </div>
  </Section>
);
