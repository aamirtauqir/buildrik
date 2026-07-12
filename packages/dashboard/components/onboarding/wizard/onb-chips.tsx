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
      <p className="text-sm font-semibold text-onb-ink mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            aria-pressed={selected(o.value)}
            className={cn(
              "h-9 px-3.5 rounded-onb border text-sm transition-colors",
              selected(o.value)
                ? "border-onb-primary bg-onb-primary-tint text-onb-primary font-medium"
                : "border-onb-line bg-white text-onb-text hover:border-onb-subtle"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-onb-muted">{hint}</p> : null}
    </div>
  );
}
