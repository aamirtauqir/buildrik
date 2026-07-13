import { cn } from "@lib/utils";
import { Loader2 } from "lucide-react";

interface OnbButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
}

/** The wizard's primary CTA — blue fill, 50px, radius 8 (spec §3). It is the
 *  only button style in onboarding; secondary actions are OnbBack text links. */
export function OnbButton({ loading, disabled, children, className, ...props }: OnbButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        "w-full h-onb-cta rounded-onb text-[15px] font-bold transition-colors",
        "flex items-center justify-center gap-2",
        "bg-onb-primary hover:bg-onb-primary-hover text-white",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
