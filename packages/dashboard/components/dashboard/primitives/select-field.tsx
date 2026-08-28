import type { SelectHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@lib/utils";

/** Select on the same recipe as `InputField`: 42px, radius-lg,
 *  `--color-border-input` hairline, focus = accent border + soft 2px ring, all
 *  as inset box-shadows so focus never shifts layout.
 *
 *  This is not a wrapper for its own sake. Before it, the dashboard's fifteen
 *  `<select>` elements rendered in **six** different shapes — `rounded-md` next
 *  to `rounded-lg`, `py-1.5` next to `py-2` next to a fixed 42px, two different
 *  focus treatments, and one local `SELECT_FIELD_CLASS` in `workspace-form`
 *  that was described as "matched to InputField" but used `--shadow-ring`
 *  rather than InputField's `--color-border-input` hairline, so it did not
 *  match either.
 *
 *  It also takes the chevron off the operating system. A bare `<select>` keeps
 *  `appearance: auto` and paints the platform's own arrow, so the control looks
 *  different on macOS, Windows and Linux and matches none of the DS chevrons
 *  beside it. `appearance-none` plus a lucide `ChevronDown` makes it one glyph
 *  everywhere. `pr-9` reserves that glyph's column so a long option label
 *  cannot run underneath it.
 *
 *  Two sizes, two rhythms. `md` is 42px to match `InputField` — a select in a
 *  form column belongs to the field rhythm. `sm` is **36px to match
 *  `Button size="sm"`** — a select in a control bar belongs to the button
 *  rhythm. `sm` shipped at 32px for an afternoon, which put a 32px select
 *  beside a 36px "Add" button on the site redirects row: the exact "one
 *  control, many shapes" defect this arc exists to remove, introduced by the
 *  primitive meant to remove it. Found by measuring the pair live, not by
 *  reading the file. */
export const SelectField = forwardRef<
  HTMLSelectElement,
  // `size` is Omit-ed: the native attribute is a row count for a list box, so
  // intersecting it with `"md" | "sm"` leaves nothing assignable. Watched to
  // fail without the Omit — `size="sm"` gave
  // `TS2322: Type 'string' is not assignable to type 'undefined'`, and only at
  // the first call site, never here.
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & { wrapperClassName?: string; invalid?: boolean; size?: "md" | "sm"; children: ReactNode }
>(({ wrapperClassName, className, invalid, size = "md", children, ...props }, ref) => (
  <div
    className={cn(
      "relative flex w-full items-center rounded-lg transition-shadow",
      size === "sm" ? "h-9" : "h-[42px]",
      invalid
        ? "shadow-[inset_0_0_0_1px_var(--color-error)] focus-within:shadow-[inset_0_0_0_1px_var(--color-error),0_0_0_2px_rgba(224,36,36,0.25)]"
        : "shadow-[inset_0_0_0_1px_var(--color-border-input)] focus-within:shadow-[inset_0_0_0_1px_var(--color-primary),0_0_0_2px_rgba(26,86,219,0.30)]",
      props.disabled && "opacity-60",
      wrapperClassName,
    )}
    style={{ backgroundColor: props.disabled ? "var(--color-bg-subtle)" : "var(--color-bg-surface)" }}
  >
    <select
      ref={ref}
      className={cn(
        "h-full w-full appearance-none bg-transparent outline-none",
        size === "sm" ? "pl-2.5 pr-7 text-[12px]" : "pl-[13px] pr-9 text-[13.5px]",
        className,
      )}
      style={{ color: "var(--color-text-primary)" }}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      className={cn("pointer-events-none absolute", size === "sm" ? "right-2 h-3.5 w-3.5" : "right-[11px] h-4 w-4")}
      style={{ color: "var(--color-text-muted)" }}
      aria-hidden
    />
  </div>
));
SelectField.displayName = "SelectField";
