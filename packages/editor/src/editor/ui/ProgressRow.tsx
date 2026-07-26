/**
 * ProgressRow — Figma 17:23.
 * Onboarding checklist, template apply, migrations, uploads.
 * @license BSD-3-Clause
 */
import React from "react";

export type ProgressTone = "default" | "done" | "failed";

export interface ProgressRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: number;
  max?: number;
  tone?: ProgressTone;
  valueLabel?: string;
}

export function ProgressRow({
  label, value, max = 100, tone = "default", valueLabel, className, ...rest
}: ProgressRowProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={["bk-progress", className].filter(Boolean).join(" ")} {...rest}>
      <span className="bk-progress__head">
        <span>{label}</span>
        <span className="bk-progress__value">{valueLabel ?? `${Math.round(pct)}%`}</span>
      </span>
      <div
        className="bk-progress__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className={["bk-progress__fill", tone !== "default" && `bk-progress__fill--${tone}`]
            .filter(Boolean)
            .join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
