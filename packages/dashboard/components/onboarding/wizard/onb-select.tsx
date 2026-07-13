"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@lib/utils";

interface OnbSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
  error?: string;
  /** Shown as a disabled first option when the value is empty. */
  placeholder?: string;
  options: { value: string; label: string }[];
}

/** Labeled onboarding select — mirrors OnbField metrics (46px, radius 8, onb
 *  tokens). Native <select> for keyboard + a11y; chevron is decorative. */
export const OnbSelect = forwardRef<HTMLSelectElement, OnbSelectProps>(
  ({ label, hint, error, placeholder, options, className, value, ...props }, ref) => (
    <div className="w-full">
      <label className="block text-sm font-semibold text-onb-text mb-2">{label}</label>
      <div className="relative">
        <select
          ref={ref}
          value={value}
          className={cn(
            "w-full h-onb-input pl-4 pr-10 rounded-onb text-[13.5px] appearance-none",
            "transition-colors outline-none",
            value ? "text-onb-text" : "text-onb-muted",
            error
              ? "bg-white shadow-[inset_0_0_0_1.5px_var(--color-onb-error)]"
              : "bg-onb-field shadow-[inset_0_0_0_1px_var(--color-onb-field-ring)] focus:shadow-[inset_0_0_0_1.5px_var(--color-onb-primary)]",
            className
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} className="text-onb-text">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-onb-muted" />
      </div>
      {error ? (
        <p className="mt-2 text-xs leading-[1.4] text-onb-error">⚠ {error}</p>
      ) : hint ? (
        <p className="mt-2 text-xs leading-[1.4] text-onb-muted">{hint}</p>
      ) : null}
    </div>
  )
);
OnbSelect.displayName = "OnbSelect";
