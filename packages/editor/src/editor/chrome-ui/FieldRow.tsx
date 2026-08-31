/**
 * FieldRow — no Figma component set.
 *
 * The Inspector's label+control pair. Border, Link, Effects and Grid sections
 * each hand-rolled their own version with different label widths, which is why
 * the Inspector never looked like one panel. One component, one width.
 *
 * `stacked` is for controls that need the full 300px inspector width (textarea,
 * segmented groups) — the label sits above instead of beside.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface FieldRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  htmlFor?: string;
  stacked?: boolean;
  hint?: string;
}

/* row/stacked each supply their own full set — width/flex-direction/gap all
   flip together, so a shared base + additive override has no cascade-order
   guarantee (Tailwind utilities of equal specificity, see Row precedent). */
const ROOT_CLASS: Record<"row" | "stacked", string> = {
  row: "tw:flex tw:items-center tw:gap-3 tw:min-h-8",
  stacked: "tw:flex tw:flex-col tw:items-stretch tw:gap-1 tw:min-h-8",
};
const LABEL_CLASS: Record<"row" | "stacked", string> = {
  row: "tw:w-24 tw:flex-none tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-ui)] tw:text-xs",
  stacked: "tw:w-auto tw:flex-none tw:text-[var(--bk-ink-soft)] tw:[font-family:var(--bk-font-ui)] tw:text-xs",
};

export function FieldRow({ label, htmlFor, stacked, hint, className, children, ...rest }: FieldRowProps) {
  const mode = stacked ? "stacked" : "row";
  return (
    <div className={[ROOT_CLASS[mode], className].filter(Boolean).join(" ")} {...rest}>
      <label className={LABEL_CLASS[mode]} htmlFor={htmlFor} title={hint}>
        {label}
      </label>
      <div className="tw:flex-1 tw:min-w-0 tw:flex tw:items-center tw:gap-2">{children}</div>
    </div>
  );
}
