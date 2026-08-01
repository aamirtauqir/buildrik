import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@lib/utils";

/** Input field on the Flowbite recipe: 42px, radius-lg, gray-400 hairline
 *  (`--color-border-input`, mirrors the editor's bk-border-input), focus =
 *  accent border + soft 2px ring (decision log 2026-07-29). Rings are inset
 *  box-shadows so focus never shifts layout. `leading` slots an icon;
 *  `invalid` swaps the hairline + focus ring to the error triad, `valid` to
 *  the success one (type-to-confirm fields, where "you typed it right" is the
 *  affordance that arms a destructive action). */
export const InputField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; wrapperClassName?: string; invalid?: boolean; valid?: boolean }
>(({ leading, wrapperClassName, className, invalid, valid, ...props }, ref) => (
  // The ring and background live on the wrapper, so a `disabled:` variant on
  // the input can never reach them — the wrapper reads the state directly and
  // dims the whole field. Without this a locked field rendered at full
  // strength with faint text, which reads as broken rather than unavailable.
  <div
    className={cn(
      "flex h-[42px] items-center gap-2.5 rounded-lg px-[13px] transition-shadow",
      invalid
        ? "shadow-[inset_0_0_0_1px_var(--color-error)] focus-within:shadow-[inset_0_0_0_1px_var(--color-error),0_0_0_2px_rgba(224,36,36,0.25)]"
        : valid
          ? "shadow-[inset_0_0_0_1px_var(--color-success)] focus-within:shadow-[inset_0_0_0_1px_var(--color-success),0_0_0_2px_rgba(14,159,110,0.25)]"
          : "shadow-[inset_0_0_0_1px_var(--color-border-input)] focus-within:shadow-[inset_0_0_0_1px_var(--color-primary),0_0_0_2px_rgba(26,86,219,0.30)]",
      (props.disabled || props.readOnly) && "opacity-60",
      wrapperClassName
    )}
    style={{ backgroundColor: props.disabled || props.readOnly ? "var(--color-bg-subtle)" : "var(--color-bg-surface)" }}
  >
    {leading && (
      <span className="flex shrink-0 items-center" style={{ color: "var(--color-text-placeholder)" }} aria-hidden>
        {leading}
      </span>
    )}
    <input
      ref={ref}
      className={cn("w-full bg-transparent text-[13.5px] outline-none", className)}
      style={{ color: "var(--color-text-primary)" }}
      {...props}
    />
  </div>
));
InputField.displayName = "InputField";
