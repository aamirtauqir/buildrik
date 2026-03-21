import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

export function AuthButton({
  loading,
  disabled,
  children,
  className,
  ...props
}: AuthButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "w-full h-auth-btn rounded-auth-btn text-auth-btn text-white font-semibold",
        "bg-auth-cta hover:bg-auth-cta-hover transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
