/**
 * Chip — Figma `144:14`-`144:25` (the Media drawer's type filters).
 *
 * A filter chip: a pill-shaped toggle carrying a label and, usually, a count.
 * The count is mono with `tabular-nums` because these numbers change while the
 * user watches — an upload finishes, a filter narrows — and proportional digits
 * make the row twitch as they do (the same reason board 16:16 put section
 * counts in mono).
 *
 * WHY THIS IS A COMPONENT AND NOT A STYLED `Button`. The board's chip is 22px
 * tall at its stated padding, which fails WCAG 2.5.8's 24x24 minimum. Every
 * call site that styled a flowbite `Button` into a chip re-derived that
 * mistake; `min-h-6` lives here once, so the floor cannot be lost by a caller
 * who only wanted to change a colour.
 *
 * @license BSD-3-Clause
 */
import React from "react";

export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Chip copy. Lowercase in the board: `image`, `video`, `svg`. */
  label: string;
  /** Rendered mono, right of the label. Omit (or 0) to draw the label alone. */
  count?: number;
  selected?: boolean;
  /** ARIA role — `tab` inside a tablist, `button` on its own. */
  role?: "tab" | "button";
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { label, count, selected = false, role = "button", className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role={role}
      aria-selected={role === "tab" ? selected : undefined}
      aria-pressed={role === "button" ? selected : undefined}
      className={[
        "tw:inline-flex tw:items-center tw:gap-1 tw:shrink-0 tw:min-h-6 tw:px-2 tw:py-[3px]",
        "tw:rounded-full tw:border-0 tw:cursor-pointer",
        "tw:[font-family:var(--bk-font-ui)] tw:text-[11px] tw:leading-4",
        "tw:[transition:var(--bk-transition-fast)]",
        "tw:outline-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]",
        selected
          ? "tw:bg-blue-50 tw:text-blue-700"
          : "tw:bg-gray-100 tw:text-gray-900 tw:hover:bg-gray-200",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {label}
      {count ? (
        <span className="tw:[font-family:var(--bk-font-mono)] tw:font-medium tw:tabular-nums tw:text-gray-600">
          {count}
        </span>
      ) : null}
    </button>
  );
});
