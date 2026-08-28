"use client";

import type { ReactNode } from "react";

/** UI kit — segmented tab control (grey track, white active pill). Shared
 *  across screens (Media type/sort filters, Templates/Libraries switcher,
 *  Plans billing cycle).
 *
 *  `label` is a ReactNode, not a string: the Plans billing-cycle toggle carries
 *  a "save 20%" badge inside the Yearly segment, and before this it was a
 *  hand-rolled track with a blue-fill active segment — a second track shape for
 *  the same job. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: ReactNode }[];
  /** Names the track for a screen reader ("Billing cycle", "Media type"). */
  label: string;
}) {
  // role="group" + aria-pressed, matching FilterChip's documented
  // `<button aria-pressed>`. Not role="tablist": real tabs own tabpanels, and
  // these tracks only filter a list. This carried NO ARIA at all until the
  // Plans billing-cycle toggle moved onto it — that toggle had role="tablist",
  // aria-label and aria-selected, so consolidating would have been a net
  // accessibility loss for Media and Activity as well.
  return (
    <div role="group" aria-label={label} className="flex items-center gap-0.5 rounded-lg p-1" style={{ backgroundColor: "var(--color-bg-subtle)" }}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className="rounded-md px-3.5 py-1.5 text-[13px] transition-colors"
            style={{
              backgroundColor: active ? "var(--color-bg-surface)" : "transparent",
              color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
              fontWeight: active ? 600 : 500,
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
