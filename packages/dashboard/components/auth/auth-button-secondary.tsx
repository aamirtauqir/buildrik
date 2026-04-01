import { cn } from "@lib/utils";

interface AuthButtonSecondaryProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function AuthButtonSecondary({
  children,
  className,
  ...props
}: AuthButtonSecondaryProps) {
  return (
    <button
      className={cn(
        "w-full h-auth-btn rounded-auth-btn text-auth-btn font-semibold",
        "text-auth-text-secondary bg-transparent",
        "border border-auth-input-border hover:bg-gray-50 transition-colors",
        "flex items-center justify-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
