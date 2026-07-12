"use client";

import { useState, forwardRef } from "react";
import { cn } from "@lib/utils";
import { Eye, EyeOff, Mail, Lock, User, type LucideIcon } from "lucide-react";
import { InlineError } from "./inline-error";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Left icon. Defaults are inferred from `type` (email→Mail, password→Lock). Pass null to hide. */
  icon?: LucideIcon | null;
  /** Hide the visible label (kept for screen readers). Mockup uses placeholder-as-label. */
  hideLabel?: boolean;
}

function defaultIcon(type?: string): LucideIcon | null {
  if (type === "email") return Mail;
  if (type === "password") return Lock;
  if (type === "text") return User;
  return null;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type, icon, hideLabel, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const Icon = icon === undefined ? defaultIcon(type) : icon;

    return (
      <div className="w-full">
        <label
          className={cn(
            "block text-auth-label text-auth-text-secondary mb-1.5",
            hideLabel && "sr-only"
          )}
        >
          {label}
        </label>
        <div className="relative">
          {Icon && (
            <Icon
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-auth-text-placeholder pointer-events-none"
            />
          )}
          <input
            ref={ref}
            type={inputType}
            suppressHydrationWarning
            className={cn(
              "w-full h-auth-input rounded-auth-input text-auth-input text-auth-text-body",
              "placeholder:text-auth-text-placeholder",
              "bg-auth-input-fill transition-colors outline-none",
              "border border-auth-input-fill-border focus:bg-auth-input-fill-focus focus:border-auth-input-focus",
              error && "border-auth-input-error bg-white",
              Icon ? "pl-11" : "pl-4",
              isPassword ? "pr-10" : "pr-4",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-auth-text-placeholder hover:text-auth-text-secondary"
              aria-label="Toggle password visibility"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          )}
        </div>
        <InlineError message={error} />
      </div>
    );
  }
);
AuthInput.displayName = "AuthInput";
