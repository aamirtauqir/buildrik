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
      <label className="block text-sm font-semibold text-onb-ink mb-1.5">{label}</label>
      <div className="relative">
        <select
          ref={ref}
          value={value}
          className={cn(
            "w-full h-onb-input pl-3.5 pr-10 rounded-onb text-sm bg-onb-surface appearance-none",
            "border transition-colors outline-none",
            value ? "text-onb-text" : "text-onb-subtle",
            error ? "border-onb-error" : "border-onb-line focus:border-onb-primary",
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
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-onb-subtle" />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-onb-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-onb-muted">{hint}</p>
      ) : null}
    </div>
  )
);
OnbSelect.displayName = "OnbSelect";
