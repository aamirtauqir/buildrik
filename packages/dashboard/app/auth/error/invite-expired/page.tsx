import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function InviteExpiredPage() {
  return (
    <AuthMessage
      title="This invitation expired"
      subtitle="Invitations are valid for 7 days. Ask the workspace owner to send a new one."
    >
      <Link href="/auth" className="w-full">
        <AuthButton type="button">Back to log in</AuthButton>
      </Link>
    </AuthMessage>
  );
}
