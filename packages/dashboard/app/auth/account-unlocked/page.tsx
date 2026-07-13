import Link from "next/link";
import { LockOpen } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

/** The lockout window from /auth/error/locked has elapsed. */
export default function AccountUnlockedPage() {
  return (
    <AuthMessage
      icon={<LockOpen size={26} className="text-auth-success-text" />}
      title="Your account is unlocked"
      subtitle="The lock has lifted. You can log in again — consider resetting your password if you never got in."
    >
      <Link href="/auth" className="w-full">
        <AuthButton type="button">Continue to log in</AuthButton>
      </Link>
    </AuthMessage>
  );
}
