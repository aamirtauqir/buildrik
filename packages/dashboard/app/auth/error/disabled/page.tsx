import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";

export default function AccountDisabledPage() {
  return (
    <AuthMessage
      title="Account disabled"
      subtitle="Your account has been disabled by an administrator."
    >
      <Link href="mailto:support@buildrik.com" className="text-auth-label text-auth-link hover:underline text-center">
        Contact support
      </Link>
      <Link href="/auth" className="text-auth-label text-auth-text-muted hover:text-auth-text-secondary text-center">
        Use a different account
      </Link>
    </AuthMessage>
  );
}
