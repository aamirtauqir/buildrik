import Link from "next/link";
import { Shield } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";
import { SUPPORT_EMAIL } from "@lib/constants/contact";

/**
 * The `2fa-too-many` mockup frame. Two things in it are deliberately dropped:
 *   - the "Try again in 02:00" countdown — verify2FA throws a flat 2FA_LOCKED
 *     with no retry-after, so there is no deadline to count down to;
 *   - the "Use a backup code" CTA — the lockout branch calls
 *     `invalidateToken(tempToken)` first, and verifyBackupCode validates that
 *     same 2fa_temp token, so a backup code here would always fail.
 * Logging in again (which mints a fresh temp token) is the only real way out —
 * which is exactly what the service's own error message says.
 */
export default function TwoFALockedPage() {
  return (
    <AuthMessage
      icon={<Shield size={26} strokeWidth={1.7} className="text-[#B7791F]" />}
      title="Too many attempts"
      subtitle="For your security we've paused two-factor verification. Log in again to try another code or a backup code."
    >
      <Link href="/auth" className="w-full">
        <AuthButton type="button">Back to log in</AuthButton>
      </Link>
      <Link
        href={`mailto:${SUPPORT_EMAIL}`}
        className="text-center text-auth-input text-auth-text-muted hover:text-auth-text-body"
      >
        Lost your codes? <span className="font-semibold text-auth-text-body">Contact support</span>
      </Link>
    </AuthMessage>
  );
}
