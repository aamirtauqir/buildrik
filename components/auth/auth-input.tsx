"use client";

import { useState, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { InlineError } from "./inline-error";

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="w-full">
        <label className="block text-auth-label text-auth-text-secondary mb-1.5">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            type={inputType}
            className={cn(
              "w-full h-auth-input px-3 rounded-auth-input text-auth-input text-auth-text-body",
              "placeholder:text-auth-text-placeholder",
              "border transition-colors outline-none",
              error
                ? "border-2 border-auth-input-error"
                : "border border-auth-input-border focus:border-2 focus:border-auth-input-focus",
              isPassword && "pr-10",
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
              tabIndex={-1}
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
