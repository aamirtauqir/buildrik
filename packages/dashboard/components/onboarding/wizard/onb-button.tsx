import { cn } from "@lib/utils";
import { Loader2 } from "lucide-react";

interface OnbButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  /** "primary" = blue fill (50px CTA), "secondary" = outlined. */
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

/** M2 onboarding CTA. Primary = onb-primary blue fill, 50px, radius 8 (spec §3). */
export function OnbButton({ loading, disabled, variant = "primary", children, className, ...props }: OnbButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "w-full h-onb-cta rounded-onb text-sm font-semibold transition-colors",
        "flex items-center justify-center gap-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary"
          ? "bg-onb-primary hover:bg-onb-primary-hover text-white"
          : "bg-white text-onb-primary border border-onb-line hover:bg-onb-primary-tint",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
