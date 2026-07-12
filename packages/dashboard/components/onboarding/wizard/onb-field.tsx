"use client";

import { forwardRef } from "react";
import { cn } from "@lib/utils";

interface OnbFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

/** Labeled onboarding text input — 46px, radius 8, onb tokens (spec §3). */
export const OnbField = forwardRef<HTMLInputElement, OnbFieldProps>(
  ({ label, hint, error, className, ...props }, ref) => (
    <div className="w-full">
      <label className="block text-sm font-semibold text-onb-ink mb-1.5">{label}</label>
      <input
        ref={ref}
        className={cn(
          "w-full h-onb-input px-3.5 rounded-onb text-sm text-onb-text bg-onb-surface",
          "border transition-colors outline-none placeholder:text-onb-subtle",
          error ? "border-onb-error" : "border-onb-line focus:border-onb-primary",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-onb-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-onb-muted">{hint}</p>
      ) : null}
    </div>
  )
);
OnbField.displayName = "OnbField";
