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
 * Craftwork auth shell (user 2026-07-15): the art screens are full-bleed — the
 * card fills the whole viewport (`w-full` capped at 100vw, `min-h-auth-shell-min`
 * = 100dvh), split 50/50 with the art rail left and the form right. No radius or
 * shadow on this path — it is the surface, not a floating island.
 *
 * `noArt` is for the transient spinner screens (splash/callback/redirect/
 * success): a small centered white card that keeps the radius + shadow, sized to
 * its content rather than stretched full-bleed around a lone spinner.
 */
export function AuthCard({ children, className, noArt }: AuthCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden bg-white flex",
        noArt
          ? "my-8 w-[calc(100vw-32px)] max-w-[460px] rounded-auth-card shadow-auth-card"
          : "w-full max-w-auth-shell min-h-auth-shell-min",
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
