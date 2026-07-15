"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthDivider } from "@/components/auth/auth-divider";
import { FormBanner } from "@/components/auth/form-banner";
import { AuthSocialButtons } from "@/components/auth/auth-social-buttons";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signIn } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { emailField } from "@buildrik/shared/schemas/auth";
import { cn } from "@lib/utils";
import { ArrowLeft } from "lucide-react";
import { LegalModal } from "@/components/legal/legal-modal";
import { TermsContent, PrivacyContent } from "@/components/legal/legal-content";

/** Both phases open the same two modals — they get the same treatment. */
const LEGAL_LINK = "font-semibold text-auth-text-body hover:underline";

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
  const [invalidEmail, setInvalidEmail] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  function goToEmailExists(taken: string) {
    router.push(`/auth/email-exists?email=${encodeURIComponent(taken)}`);
  }

  const checkEmailMutation = trpc.auth.checkEmail.useMutation({
    onSuccess: (data, variables) => {
      setError(null);
      if (data.exists) {
        goToEmailExists(variables.email);
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
    onError: (err) => {
      // auth.service.signup throws EMAIL_EXISTS (409 → CONFLICT) when the address
      // was claimed between the checkEmail probe and submit. Same destination.
      if (err.data?.code === "CONFLICT") {
        goToEmailExists(email);
        return;
      }
      setError(err.message);
    },
  });

  function handleEmailContinue(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Validate against the SSOT schema and show the styled banner, like
    // forgot-password and magic-link do. This form previously relied on the
    // browser's native tooltip, so signup was the odd one out.
    const parsed = emailField.safeParse(email);
    if (!parsed.success) {
      setInvalidEmail(true);
      setError("Enter a valid email address.");
      return;
    }
    setInvalidEmail(false);
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

  const creating = signupMutation.isPending;

  const loginLink = (
    <>
      Already have an account?{" "}
      <Link href="/auth" className="font-semibold text-auth-text-body hover:underline">
        Log in
      </Link>
    </>
  );

  if (phase === "capture") {
    return (
      <AuthCard>
        <div className="w-full flex flex-col gap-2.5 mb-7">
          <h1 className="text-[21px] font-bold leading-[1.08] tracking-[-0.03em] text-auth-text-primary">
            Create your account
          </h1>
          <p className="text-[13px] leading-[1.45] text-auth-text-muted">
            Start building client sites in minutes.
          </p>
        </div>

        {error && (
          <>
            <FormBanner variant="error" title={error} />
            <div className="h-4" />
          </>
        )}

        <AuthSocialButtons onSelect={oauth} />

        <div className="h-5" />
        <AuthDivider text="or" />
        <div className="h-5" />

        <form onSubmit={handleEmailContinue} noValidate className="w-full flex flex-col gap-3">
          <AuthInput
            label="Email"
            hideLabel
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (invalidEmail) setInvalidEmail(false);
            }}
            invalid={invalidEmail}
            autoComplete="email"
            autoFocus
          />
          <AuthButton type="submit" variant="secondary" loading={checkEmailMutation.isPending}>
            Continue with email
          </AuthButton>
        </form>

        <p className="w-full text-auth-subtitle leading-[1.55] text-auth-text-muted mt-6">
          By continuing you agree to our{" "}
          <button type="button" onClick={() => setLegal("terms")} className={LEGAL_LINK}>Terms</button>
          {" "}&amp;{" "}
          <button type="button" onClick={() => setLegal("privacy")} className={LEGAL_LINK}>Privacy Policy</button>.
          <br />
          {loginLink}
        </p>

        <LegalModal open={legal !== null} onClose={() => setLegal(null)}>
          {legal === "terms" ? <TermsContent /> : legal === "privacy" ? <PrivacyContent /> : null}
        </LegalModal>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      {!creating && (
        <button
          type="button"
          onClick={() => { setPhase("capture"); setError(null); }}
          className="flex items-center gap-1 text-auth-label text-auth-text-muted hover:text-auth-text-secondary mb-4 self-start"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      <div className="flex flex-col items-center gap-1.5 text-center mb-5">
        <span className="text-auth-subtitle text-auth-text-muted">Sign up for</span>
        <span className="text-[21px] font-bold leading-none tracking-[-0.02em] text-auth-text-primary">
          Buildrick
        </span>
      </div>

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleSignup} className="w-full flex flex-col gap-3">
        <div className={cn("flex flex-col gap-3", creating && "opacity-50 pointer-events-none")}>
          <AuthInput
            label="Full name"
            hideLabel
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            autoFocus
          />
          <AuthInput label="Work email" hideLabel type="email" value={email} readOnly onChange={() => {}} />
          <AuthInput
            label="Password"
            hideLabel
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

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
            <button type="button" onClick={(e) => { e.preventDefault(); setLegal("terms"); }} className={LEGAL_LINK}>Terms</button>{" "}
            and{" "}
            <button type="button" onClick={(e) => { e.preventDefault(); setLegal("privacy"); }} className={LEGAL_LINK}>Privacy Policy</button>
          </span>
        </label>

        <div className="h-1" />

        <AuthButton
          type="submit"
          variant={creating ? "primary" : "secondary"}
          disabled={!termsAccepted}
          loading={creating}
        >
          {creating ? "Creating your account…" : "Create account"}
        </AuthButton>
      </form>

      <div className="h-3.5" />
      <p className="text-auth-label text-auth-text-muted text-center">{loginLink}</p>

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
