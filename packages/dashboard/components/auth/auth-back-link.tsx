import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@lib/utils";

interface AuthBackLinkProps {
  /** Defaults to the login screen — the only place most auth screens go back to. */
  href?: string;
  /** Defaults to "Back to log in". Override only when the destination isn't login. */
  children?: React.ReactNode;
  /** Top-left arrow (forms) vs a centred footer link (status screens). */
  placement?: "top" | "footer";
  className?: string;
}

/**
 * The one way out of an auth screen.
 *
 * The escape hatch was hand-written per page and drifted into eight different
 * phrasings for the same action ("Back to log in", "Back", "Log in", "Log in
 * normally", "Continue to log in", "Log in again"…), and four screens ended up
 * with no way back at all — reset-password stranded you completely, with nothing
 * but "Reset password" on it.
 */
export function AuthBackLink({
  href = "/auth",
  children = "Back to log in",
  placement = "footer",
  className,
}: AuthBackLinkProps) {
  if (placement === "top") {
    return (
      <Link
        href={href}
        className={cn(
          "mb-4 flex items-center gap-1 self-start text-auth-label text-auth-text-muted transition-colors hover:text-auth-text-secondary",
          className
        )}
      >
        <ArrowLeft size={14} />
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "text-center text-auth-label font-semibold text-auth-text-body transition-colors hover:underline",
        className
      )}
    >
      {children}
    </Link>
  );
}
