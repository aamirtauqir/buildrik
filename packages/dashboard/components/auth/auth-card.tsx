import { cn } from "@lib/utils";
import { AuthArt } from "./auth-art";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  /** Hide the art rail (compact single-column screens like OTP/loading). */
  noArt?: boolean;
}

const formColumn = (children: React.ReactNode) => (
  <div className="flex flex-1 min-w-0 items-center justify-center overflow-y-auto px-[60px] py-14 max-[520px]:px-6 max-[520px]:py-10">
    <div className="flex w-full max-w-auth-card flex-col items-center">{children}</div>
  </div>
);

/**
 * Craftwork auth shell — a floating white card on the page tint, art rail left,
 * form right (DESIGN.md §Auth Surface). Every mockup frame is this 1000×620
 * card. It is NOT full-bleed: the card was flattened to `fixed inset-0` in the
 * dashboard reskin, which dropped the radius, the shadow and the page tint on
 * every art screen at once.
 *
 * `noArt` is for the transient spinner screens (splash/callback/redirect/
 * success) that have no mockup frame — same card, no art column, and sized to
 * its content rather than stretched to 1000×620 around a lone spinner.
 */
export function AuthCard({ children, className, noArt }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-[calc(100vw-32px)] overflow-hidden rounded-auth-card bg-white shadow-auth-card",
        "flex",
        noArt ? "max-w-[460px]" : "max-w-auth-shell md:min-h-auth-shell-min",
        className
      )}
    >
      {!noArt && (
        <div className="hidden shrink-0 md:block md:w-1/2">
          <AuthArt />
        </div>
      )}
      {formColumn(children)}
    </div>
  );
}
