/**
 * FormatRow — Figma 249:6 (Selected).
 *
 * A pickable option with a description — export formats, publish targets.
 * It is a real radio so arrow keys move between options and the group is
 * announced as a group; the visual is the row, the semantics are the input.
 *
 * @license BSD-3-Clause
 */
import React from "react";
import { Radio } from "flowbite-react";

export interface FormatRowProps extends Omit<React.HTMLAttributes<HTMLLabelElement>, "onChange"> {
  name: string;
  value: string;
  title: string;
  description?: string;
  checked?: boolean;
  onChange?: (value: string) => void;
  trailing?: React.ReactNode;
  /** An option that exists but cannot be picked yet ("coming soon"). It renders
   *  NO radio at all rather than a disabled one: a disabled radio still answers
   *  to `getByRole("radio")` and still occupies an arrow-key stop in the group,
   *  so the option would read as pickable to a keyboard user. */
  disabled?: boolean;
}

/** FormatRow never went through the Row component — it borrowed `.bk-row` +
 *  `.bk-format-row` as two CSS classes on its own <label>. Now that
 *  `.bk-row`'s CSS is gone (dissolved into Row.tsx's own tw:* composition,
 *  this same commit), this is one self-contained class list recreating
 *  both former rules' combined effect — no Row-BASE-vs-override composition
 *  ambiguity here since there's only one static string. */
/* min-height, not height: a description wraps once the row is narrow (the
   export picker lays these out two per column). Same fix as Row's `comment`. */
const BASE =
  "tw:flex tw:items-center tw:gap-3 tw:min-h-16 tw:py-2 tw:px-4 tw:w-full tw:text-left tw:border tw:border-[var(--bk-gray-200)] " +
  "tw:rounded-lg tw:bg-white tw:[font-family:var(--bk-font-ui)] tw:text-[13px] tw:text-[var(--bk-ink)] " +
  "tw:[transition:var(--bk-transition-fast)] " +
  "tw:aria-[checked=true]:border-blue-700 tw:aria-[checked=true]:bg-blue-50 " +
  "tw:aria-disabled:opacity-50 tw:aria-disabled:pointer-events-none tw:aria-disabled:select-none";

export function FormatRow({
  name, value, title, description, checked, onChange, trailing, disabled, className, ...rest
}: FormatRowProps) {
  return (
    /* No `aria-checked` here: this is a <label>, and axe rejects it outright
       ("ARIA attribute is not allowed", 3 nodes in the export modal). The real
       <Radio> inside already reports checked state to assistive tech, and the
       label supplies its name — adding a second, roleless "checked" only
       created an invalid element. */
    <label
      className={[BASE, className].filter(Boolean).join(" ")}
      aria-disabled={disabled || undefined}
      {...rest}
    >
      {disabled ? (
        /* Holds the radio's column so a disabled row still lines up with its
           pickable siblings in the same grid. */
        <span className="tw:size-4 tw:flex-none tw:rounded-full tw:border tw:border-[var(--bk-gray-200)]" aria-hidden="true" />
      ) : (
        <Radio
          color="blue"
          className="tw:bg-white"
          name={name}
          value={value}
          checked={Boolean(checked)}
          onChange={() => onChange?.(value)}
        />
      )}
      {/* Blocks, not spans. The radio's accessible name is computed from this
          label's contents, and the name algorithm only separates them when
          they are block-level — as inline spans it read "HTMLStatic HTML file
          with…". `tw:block` would not fix it: the utility resolves from a
          stylesheet, and the algorithm reads computed display. */}
      <div className="tw:flex-1 tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0">
        <div>{title}</div>
        {/* gray-600: a selected row's tint is light enough that gray-500
            measures 4.38:1 on it — under AA at 12px (axe, export modal). */}
        {description ? <div className="tw:text-[var(--bk-ink-soft)] tw:text-xs">{description}</div> : null}
      </div>
      {trailing}
    </label>
  );
}
