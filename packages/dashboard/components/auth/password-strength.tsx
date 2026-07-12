import { cn } from "@lib/utils";
import { CheckCircle, Circle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
  /** "checklist" = 4-rule list (signup). "line" = single strength summary (mockup). */
  variant?: "checklist" | "line";
}

const rules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$...)", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export function PasswordStrength({ password, variant = "checklist" }: PasswordStrengthProps) {
  if (variant === "line") {
    if (!password) return null;
    const passed = rules.filter((r) => r.test(password)).length;
    const strong = passed === rules.length;
    const text = strong ? "Strong password" : passed >= 2 ? "Fair password" : "Weak password";
    return (
      <p className={cn("text-auth-label", strong ? "text-auth-strength-pass" : "text-auth-text-muted")}>
        {text}
      </p>
    );
  }

  return (
    <div className="w-full bg-auth-strength-bg rounded-auth-input p-4 space-y-2">
      <p className="text-auth-label text-auth-text-secondary">Password must include:</p>
      {rules.map((rule) => {
        const passed = rule.test(password);
        return (
          <div key={rule.label} className="flex items-center gap-2">
            {passed ? (
              <CheckCircle className="w-4 h-4 text-auth-strength-pass shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-auth-text-placeholder shrink-0" />
            )}
            <span className={cn("text-auth-error", passed ? "text-auth-strength-pass" : "text-auth-text-muted")}>
              {rule.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
