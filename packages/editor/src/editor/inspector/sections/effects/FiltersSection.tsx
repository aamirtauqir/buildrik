/**
 * Filters — blur plus brightness, contrast and grayscale (board 3; renamed
 * from Blur, absorbing the filter rows of the old "More effects"). Each
 * slider merges its own function into `filter`, so moving one never drops
 * another. A filter the sliders cannot hold — a function they do not know
 * (saturate), one written twice — is kept as written (2L9 161:12525
 * "Authored value", I10 "Edit custom value"): the sliders would have
 * dropped it. The one writer of `filter`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AuthoredValue, countWord, RangeSlider, Section } from "@/editor/inspector/shared/controls";
import type { BaseStyleSectionProps } from "../registry/_shared";
import { composable, composeFilter, FILTER_ORDER, functionsOf, parseFunction } from "./effectValues";

const FILTERS = [
  { fn: "blur", label: "Blur", unit: "px", identity: "0px", min: 0, max: 20 },
  { fn: "brightness", label: "Brightness", unit: "%", identity: "100%", min: 0, max: 200 },
  { fn: "contrast", label: "Contrast", unit: "%", identity: "100%", min: 0, max: 200 },
  { fn: "grayscale", label: "Grayscale", unit: "%", identity: "0%", min: 0, max: 100 },
] as const;

/* `brightness(1)` is 100%: a bare number in a percentage filter is a ratio.
   Read as a percentage it showed "1%" for an untouched filter. */
const readFilter = (raw: string, unit: string): number => {
  const n = parseFloat(raw);
  return unit === "%" && !raw.trim().endsWith("%") ? n * 100 : n;
};

/** Why a custom filter is kept: "Two blur functions are preserved in their
 *  original order." (161:12525), else the functions the sliders lack. */
function keptNote(filter: string): string {
  const fns = functionsOf(filter);
  const twice = fns.find((f, i) => fns.indexOf(f) !== i);
  if (twice) return `${countWord(fns.filter((f) => f === twice).length)} ${twice} functions are preserved in their original order.`;
  const unknown = [...new Set(fns.filter((f) => !FILTER_ORDER.includes(f)))];
  return `${unknown.join(", ")} ${unknown.length === 1 ? "is" : "are"} kept as written — the sliders do not edit ${unknown.length === 1 ? "it" : "them"}.`;
}

export const FiltersSection: React.FC<BaseStyleSectionProps> = ({ styles, onChange, isOpen, onToggle }) => {
  const filter = styles.filter;
  const custom = !composable(filter, FILTER_ORDER);
  return (
    <Section
      title="Filters"
      isOpen={isOpen}
      onToggle={onToggle}
      id="inspector-section-filters"
      action={custom ? <span className="tw:text-[12px] tw:text-[var(--bk-ink-soft)]">Custom</span> : undefined}
    >
      {custom ? (
        <AuthoredValue
          testId="inspector-filters-authored"
          caption="Authored value"
          value={filter ?? ""}
          note={keptNote(filter ?? "")}
          editLabel="Edit custom value"
          accept={(v) => functionsOf(v).length > 0}
          onCommit={(v) => onChange("filter", v)}
        />
      ) : (
        <div className="tw:relative">
          {FILTERS.map((f) => (
            <RangeSlider
              key={f.fn}
              label={f.label}
              property="filter"
              unit={f.unit}
              min={f.min}
              max={f.max}
              value={readFilter(parseFunction(filter, f.fn, f.identity), f.unit)}
              onChange={(v) => onChange("filter", composeFilter(filter, f.fn, `${v}${f.unit}`))}
            />
          ))}
        </div>
      )}
    </Section>
  );
};
