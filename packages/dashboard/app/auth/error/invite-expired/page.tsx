import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function InviteExpiredPage() {
  return (
    <AuthMessage
      title="Invite expired"
      subtitle="This invitation link has expired. Ask the workspace admin to send a new invite."
    >
      <Link href="/auth" className="w-full">
        <AuthButton type="button">Back to log in</AuthButton>
      </Link>
    </AuthMessage>
  );
}
