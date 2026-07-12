import { cn } from "@lib/utils";
import { Loader2 } from "lucide-react";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  /** "primary" = cobalt fill, "secondary" = neutral gray fill (mockup submit). */
  variant?: "primary" | "secondary";
}

export function AuthButton({
  loading,
  disabled,
  children,
  className,
  variant = "primary",
  ...props
}: AuthButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "w-full h-auth-btn rounded-auth-btn text-auth-btn font-semibold transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        variant === "primary"
          ? "bg-auth-cta hover:bg-auth-cta-hover text-white"
          : "bg-auth-btn-secondary hover:bg-auth-btn-secondary-hover text-auth-text-primary",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
