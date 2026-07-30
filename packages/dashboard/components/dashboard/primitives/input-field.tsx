import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@lib/utils";

/** Input field on the Flowbite recipe: 42px, radius-lg, gray-400 hairline
 *  (`--color-border-input`, mirrors the editor's bk-border-input), focus =
 *  accent border + soft 2px ring (decision log 2026-07-29). Rings are inset
 *  box-shadows so focus never shifts layout. `leading` slots an icon. */
export const InputField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; wrapperClassName?: string }
>(({ leading, wrapperClassName, className, ...props }, ref) => (
  <div
    className={cn(
      "flex h-[42px] items-center gap-2.5 rounded-lg px-[13px] shadow-[inset_0_0_0_1px_var(--color-border-input)] transition-shadow",
      "focus-within:shadow-[inset_0_0_0_1px_var(--color-primary),0_0_0_2px_rgba(26,86,219,0.30)]",
      wrapperClassName
    )}
    style={{ backgroundColor: "var(--color-bg-surface)" }}
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
