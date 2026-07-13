"use client";

import { useRef, useCallback } from "react";
import { cn } from "@lib/utils";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (code: string) => void;
  /** Paint every cell in the error border (mockup `2fa-wrong`). */
  error?: boolean;
}

export function OTPInput({ length = 6, value, onChange, error }: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (!/^\d?$/.test(char)) return;
      const newDigits = [...digits];
      newDigits[index] = char;
      const newValue = newDigits.join("").slice(0, length);
      onChange(newValue);
      if (char && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [digits, length, onChange]
  );

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === "Backspace" && !digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [digits]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    },
    [length, onChange]
  );

  return (
    <div className="flex w-full gap-2.5" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[i] || ""}
          aria-label={`Digit ${i + 1} of verification code`}
          aria-invalid={error || undefined}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            "h-[62px] min-w-0 flex-1 rounded-auth-input text-center font-mono text-2xl font-medium outline-none transition-colors",
            "bg-[#F5F5F6] text-auth-text-body border",
            error
              ? "border-auth-input-error"
              : digits[i]
                ? "border-[#1C1C1E]"
                : "border-[#ECECEE] focus:border-auth-input-focus"
          )}
          style={{ caretColor: "transparent" }}
        />
      ))}
    </div>
  );
}
