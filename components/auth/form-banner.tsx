import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";

interface FormBannerProps {
  variant: "success" | "error";
  title: string;
  subtitle?: string;
}

export function FormBanner({ variant, title, subtitle }: FormBannerProps) {
  const isSuccess = variant === "success";

  return (
    <div
      className={cn(
        "w-full rounded-auth-input px-4 py-3 flex items-start gap-3",
        isSuccess
          ? "bg-auth-success-bg border border-auth-success-border"
          : "bg-auth-error-bg border border-auth-error-border"
      )}
    >
      {isSuccess ? (
        <CheckCircle className="w-5 h-5 text-auth-success-text shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-auth-error-text shrink-0 mt-0.5" />
      )}
      <div>
        <p className={cn("text-auth-label font-medium", isSuccess ? "text-auth-success-text" : "text-auth-error-text")}>
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
