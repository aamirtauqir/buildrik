import { cn } from "@lib/utils";
import { AuthArt } from "./auth-art";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  /** Hide the art rail (compact single-column screens like OTP/loading). */
  noArt?: boolean;
}

const formColumn = (children: React.ReactNode) => (
  <div className="flex-1 min-w-0 flex items-center justify-center overflow-y-auto px-[60px] py-14 max-[520px]:px-6 max-[520px]:py-10">
    <div className="w-full max-w-auth-card flex flex-col items-center">{children}</div>
  </div>
);

/**
 * Craftwork auth shell. Art variant = full-bleed split screen: the alpine art
 * fills the left half of the viewport, form on the right. Compact `noArt`
 * variant (OTP/loading) stays a centered rounded card.
 */
export function AuthCard({ children, className, noArt }: AuthCardProps) {
  if (noArt) {
    return (
      <div
        className={cn(
          "w-[calc(100vw-32px)] max-w-auth-card bg-white rounded-auth-card shadow-auth-card overflow-hidden",
          "flex md:min-h-[620px]",
          className
        )}
      >
        {formColumn(children)}
      </div>
    );
  }

  return (
    <div className={cn("fixed inset-0 z-0 bg-white flex", className)}>
      <div className="hidden md:block md:w-1/2 shrink-0">
        <AuthArt />
      </div>
      {formColumn(children)}
    </div>
  );
}
