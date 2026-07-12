"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthDivider } from "@/components/auth/auth-divider";
import { FormBanner } from "@/components/auth/form-banner";
import { SocialButton } from "@/components/auth/social-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signIn } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { ArrowLeft } from "lucide-react";
import { LegalModal } from "@/components/legal/legal-modal";
import { TermsContent, PrivacyContent } from "@/components/legal/legal-content";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  // "capture" = mockup email/social screen; "details" = name+password step the signup mutation needs.
  const [phase, setPhase] = useState<"capture" | "details">("capture");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  const checkEmailMutation = trpc.auth.checkEmail.useMutation({
    onSuccess: (data, variables) => {
      setError(null);
      if (data.exists) {
        router.push(`/auth?email=${encodeURIComponent(variables.email)}`);
      } else {
        setPhase("details");
      }
    },
    onError: (err) => {
      setError(err.data?.code === "TOO_MANY_REQUESTS" ? "Too many attempts. Try again in 15 minutes." : err.message);
    },
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`),
    onError: (err) => setError(err.message),
  });

  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    checkEmailMutation.mutate({ email });
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    signupMutation.mutate({ fullName, email, password, termsAccepted: termsAccepted as true });
  }

  function oauth(provider: "google" | "github") {
    signIn(provider, { callbackUrl: "/auth/redirect" });
  }

  return (
    <AuthCard>
      {phase === "details" && (
        <button
          type="button"
          onClick={() => { setPhase("capture"); setError(null); }}
          className="flex items-center gap-1 text-auth-label text-auth-text-muted hover:text-auth-text-secondary mb-4 self-start"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <div className="text-center">
        <h1 className="text-auth-title-lg text-auth-text-primary">Create your account</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-1.5">Start building client sites in minutes.</p>
      </div>

      <div className="h-7" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      {phase === "capture" ? (
        <>
          <SocialButton provider="google" variant="primary" label="Sign up with Google" onClick={() => oauth("google")} />
          <div className="h-2.5" />
          <SocialButton provider="github" variant="dark" onClick={() => oauth("github")} />

          <div className="h-5" />
          <AuthDivider text="or" />
          <div className="h-5" />

          <form onSubmit={handleEmailContinue} className="w-full flex flex-col gap-3">
            <AuthInput
              label="Email"
              hideLabel
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
            <AuthButton type="submit" variant="secondary" loading={checkEmailMutation.isPending}>
              Continue with email
            </AuthButton>
          </form>

          <p className="text-auth-fine text-auth-text-placeholder text-center mt-6">
            By continuing, you agree to our{" "}
            <button type="button" onClick={() => setLegal("terms")} className="text-auth-link font-medium hover:underline">Terms</button>{" "}
            and{" "}
            <button type="button" onClick={() => setLegal("privacy")} className="text-auth-link font-medium hover:underline">Privacy Policy</button>.
          </p>
        </>
      ) : (
        <form onSubmit={handleSignup} className="w-full flex flex-col gap-3">
          <AuthInput
            label="Full name"
            hideLabel
            type="text"
            placeholder="Your name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            autoFocus
          />
          <AuthInput label="Email" hideLabel type="email" value={email} readOnly onChange={() => {}} />
          <AuthInput
            label="Password"
            hideLabel
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              suppressHydrationWarning
              className="mt-0.5 rounded border-auth-input-fill-border accent-auth-cta"
            />
            <span className="text-auth-label text-auth-text-secondary">
              I agree to the{" "}
              <button type="button" onClick={(e) => { e.preventDefault(); setLegal("terms"); }} className="text-auth-link hover:underline">Terms of Service</button>{" "}
              and{" "}
              <button type="button" onClick={(e) => { e.preventDefault(); setLegal("privacy"); }} className="text-auth-link hover:underline">Privacy Policy</button>
            </span>
          </label>

          <div className="h-1" />
          <AuthButton type="submit" disabled={!termsAccepted} loading={signupMutation.isPending}>
            Create account
          </AuthButton>
        </form>
      )}

      <div className="h-5" />
      <p className="text-auth-label text-auth-text-muted text-center">
        Already have an account?{" "}
        <Link href="/auth" className="text-auth-link font-medium hover:underline">Log in</Link>
      </p>

      <LegalModal open={legal !== null} onClose={() => setLegal(null)}>
        {legal === "terms" ? <TermsContent /> : legal === "privacy" ? <PrivacyContent /> : null}
      </LegalModal>
    </AuthCard>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
