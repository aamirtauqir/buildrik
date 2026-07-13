"use client";

import { cn } from "@lib/utils";

interface ChipGroupProps {
  label: string;
  options: { value: string; label: string }[];
  /** Single-select value, or a Set of values for multi. */
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multi?: boolean;
  hint?: string;
}

/** Labeled selectable chip row — single-select (A1 industry, A2 goal, A3 tone)
 *  or multi-select (A2 pages). Selected = primary tint + border, per spec §3. */
export function OnbChips({ label, options, value, onChange, multi, hint }: ChipGroupProps) {
  const selected = (v: string) => (multi ? (value as string[]).includes(v) : value === v);

  const toggle = (v: string) => {
    if (!multi) return onChange(v);
    const cur = value as string[];
    onChange(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
  };

  return (
    <div>
      <p className="text-sm font-semibold text-onb-text mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            aria-pressed={selected(o.value)}
            className={cn(
              "rounded-onb px-3.5 py-[9px] text-[13px] font-medium transition-colors",
              selected(o.value)
                ? "bg-onb-primary-tint text-onb-primary shadow-[inset_0_0_0_1.5px_var(--color-onb-primary)]"
                : "bg-white text-onb-text shadow-[inset_0_0_0_1px_var(--color-onb-line)] hover:shadow-[inset_0_0_0_1px_var(--color-onb-subtle)]"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-2 text-xs text-onb-muted">{hint}</p> : null}
    </div>
  );
}
