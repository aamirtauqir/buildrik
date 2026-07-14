"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { rateLimitedHref } from "@lib/rate-limit-redirect";
import { emailField } from "@buildrik/shared/schemas/auth";
import { cn } from "@lib/utils";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [invalidEmail, setInvalidEmail] = useState(false);

  const forgotPasswordMutation = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => {
      router.push(`/auth/check-inbox?type=reset&email=${encodeURIComponent(email)}`);
    },
    onError: (err) => {
      // forgotPassword is rate-limited (10 / 15min per IP). Without this the
      // limiter's raw "Too many requests. Please try again later." was dumped
      // into the form while the designed rate-limit screen sat unreachable.
      if (err.data?.code === "TOO_MANY_REQUESTS") {
        router.push(rateLimitedHref(err));
        return;
      }
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Same email rule the router enforces (packages/shared is the SSOT).
    const parsed = emailField.safeParse(email);
    if (!parsed.success) {
      setInvalidEmail(true);
      setError(parsed.error.issues[0].message);
      return;
    }
    setInvalidEmail(false);
    setError(null);
    forgotPasswordMutation.mutate({ email: parsed.data });
  };

  const sending = forgotPasswordMutation.isPending;

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => router.push("/auth")}
        className="flex items-center gap-1.5 text-auth-label text-auth-text-muted hover:text-auth-text-body mb-5 self-start"
      >
        <ArrowLeft size={16} /> Back to log in
      </button>

      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Reset your password</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Enter the email tied to your account and we&apos;ll send a reset link.
        </p>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3">
        <div className={cn("w-full", sending && "opacity-50 pointer-events-none")}>
          <AuthInput
            label="Email"
            hideLabel
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className={cn(invalidEmail && "border-auth-input-error")}
          />
        </div>
        <AuthButton type="submit" loading={sending}>
          {sending ? "Sending reset link…" : "Send reset link"}
        </AuthButton>
      </form>

      <div className="h-5" />

      <p className="text-auth-label text-auth-text-muted text-center">
        Remembered it?{" "}
        <Link href="/auth" className="font-semibold text-auth-text-body hover:underline">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
