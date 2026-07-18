import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { cn } from "@lib/utils";

/** UI kit §4 — Input field. 42px, radius-lg, hairline ring (inset so focus
 *  never shifts layout). `leading` slots an icon before the input. */
export const InputField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; wrapperClassName?: string }
>(({ leading, wrapperClassName, className, ...props }, ref) => (
  <div
    className={cn(
      "flex h-[42px] items-center gap-2.5 rounded-lg px-[13px] shadow-[var(--shadow-ring)] transition-shadow",
      "focus-within:shadow-[inset_0_0_0_1.5px_var(--color-primary)]",
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
