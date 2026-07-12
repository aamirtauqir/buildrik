import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

export default function CaptchaPage() {
  return (
    <AuthMessage
      title="Verify you're human"
      subtitle="We detected unusual activity. Please complete the verification to continue."
    >
      <div className="w-full rounded-auth-input bg-auth-input-fill border border-auth-input-fill-border p-8 text-center text-auth-text-placeholder text-auth-label">
        CAPTCHA widget
      </div>
      <AuthButton disabled>Continue</AuthButton>
      <Link href="/auth" className="text-auth-label text-auth-link hover:underline text-center">
        Back to log in
      </Link>
    </AuthMessage>
  );
}
