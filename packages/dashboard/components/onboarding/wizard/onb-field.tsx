"use client";

import { forwardRef } from "react";
import { cn } from "@lib/utils";

interface OnbFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labeled onboarding text input — 46px, radius 8, onb tokens (spec §3). The
 *  field is filled (pale blue on a 1px ring), not outlined; the error state
 *  drops the fill to white and thickens the ring to 1.5px red. Rings are
 *  inset shadows so they don't affect layout height. */
export const OnbField = forwardRef<HTMLInputElement, OnbFieldProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <div className="w-full">
      <label className="block text-sm font-semibold text-onb-text mb-2">{label}</label>
      <input
        ref={ref}
        className={cn(
          "w-full h-onb-input px-4 rounded-onb text-[13.5px] text-onb-text",
          "transition-colors outline-none placeholder:text-onb-muted",
          error
            ? "bg-white shadow-[inset_0_0_0_1.5px_var(--color-onb-error)] focus:shadow-[inset_0_0_0_1.5px_var(--color-onb-error),0_0_0_3px_rgb(37_99_235_/_0.12)]"
            : "bg-onb-field shadow-[inset_0_0_0_1px_var(--color-onb-field-ring)] focus:shadow-[inset_0_0_0_1.5px_var(--color-onb-primary),0_0_0_3px_rgb(37_99_235_/_0.12)]",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="mt-2 text-xs leading-[1.4] text-onb-error">⚠ {error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs leading-[1.4] text-onb-muted">{hint}</p>
      ) : null}
    </div>
  )
);
OnbField.displayName = "OnbField";
