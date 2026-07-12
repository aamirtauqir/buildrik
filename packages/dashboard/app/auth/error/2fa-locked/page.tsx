import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function TwoFALockedPage() {
  return (
    <AuthMessage
      title="Too many attempts"
      subtitle="Two-factor verification is locked for a short while. Log in again to try a code or a backup code."
    >
      <Link href="/auth" className="w-full">
        <AuthButton type="button">Back to log in</AuthButton>
      </Link>
      <Link href="mailto:support@buildrik.com" className="text-auth-label text-auth-link hover:underline text-center">
        Contact support
      </Link>
    </AuthMessage>
  );
}
