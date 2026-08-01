import { cn } from "@lib/utils";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface FormBannerProps {
  variant: "success" | "error";
  title: string;
  subtitle?: string;
}

/**
 * Craftwork form banner — a borderless tinted chip, not a bordered alert box.
 * The frames tint the fill to 9% of the status colour and carry no border.
 */
export function FormBanner({ variant, title, subtitle }: FormBannerProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className={cn(
        "flex w-full items-center gap-[9px] rounded-lg px-[14px] py-[11px]",
        isSuccess ? "bg-[rgb(18_128_92_/_0.09)]" : "bg-[rgb(229_72_77_/_0.09)]"
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-auth-success-text" strokeWidth={1.8} />
      ) : (
        <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-auth-error-text" strokeWidth={1.8} />
      )}
      <div className="min-w-0">
        <p className={cn("text-[13px] leading-[1.4]", isSuccess ? "text-auth-success-text" : "text-auth-error-text")}>
          {title}
        </p>
        {subtitle && (
          <p className={cn("text-auth-fine mt-0.5", isSuccess ? "text-auth-success-text" : "text-auth-error-text")}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
