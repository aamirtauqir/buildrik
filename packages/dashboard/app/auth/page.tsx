"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { AuthDivider } from "@/components/auth/auth-divider";
import { FormBanner } from "@/components/auth/form-banner";
import { SocialButton } from "@/components/auth/social-button";
import { PasswordStrength } from "@/components/auth/password-strength";
import { signIn } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { ArrowLeft } from "lucide-react";

type AuthStep =
  | { type: "email_entry" }
  | { type: "checking" }
  | { type: "login_password"; email: string; providers: ("google" | "github")[] }
  | { type: "oauth_only"; email: string; providers: ("google" | "github")[] }
  | { type: "signup_new"; email: string };

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";
  const reason = searchParams.get("reason");
  const reasonBanner =
    reason === "session-required"
      ? { title: "Please sign in again", subtitle: "Your session has expired." }
      : reason === "session-expired"
        ? { title: "Session expired", subtitle: "Sign in to continue." }
        : null;
  const [step, setStep] = useState<AuthStep>({ type: "email_entry" });
  const [email, setEmail] = useState(prefillEmail);
  const [rememberMe, setRememberMe] = useState(false);
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkEmailMutation = trpc.auth.checkEmail.useMutation({
    onSuccess: (data, variables) => {
      // Use variables.email (what was actually sent) not the current input state,
      // which may have changed while the request was in-flight.
      const resolvedEmail = variables.email;
      setError(null);
      if (!data.exists) {
        setStep({ type: "signup_new", email: resolvedEmail });
      } else if (data.hasPassword) {
        setStep({ type: "login_password", email: resolvedEmail, providers: data.providers });
      } else {
        setStep({ type: "oauth_only", email: resolvedEmail, providers: data.providers });
      }
    },
    onError: (err) => {
      setStep({ type: "email_entry" });
      if (err.data?.code === "TOO_MANY_REQUESTS") {
        setError("Too many attempts. Try again in 15 minutes.");
      } else {
        setError(err.message);
      }
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.requiresTwoFactor) {
        if (rememberMe) {
          try { sessionStorage.setItem("buildrik_rememberMe", "true"); } catch {}
        }
        router.push(`/auth/2fa?token=${data.tempToken}`);
      } else {
        const res = await fetch("/api/auth/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: data.sessionToken, rememberMe }),
        });
        if (res.ok) {
          router.push("/auth/redirect");
        } else {
          setError("Failed to create session");
        }
      }
    },
    onError: (err) => {
      const cause = (err.data as Record<string, unknown>)?.cause as {
        attemptsRemaining?: number;
        locked?: boolean;
        lockedUntil?: string;
      } | undefined;
      if (cause?.locked && cause.lockedUntil) {
        router.push(`/auth/error/locked?until=${encodeURIComponent(cause.lockedUntil)}`);
        return;
      }
      if (cause?.attemptsRemaining !== undefined && cause.attemptsRemaining > 0) {
        setError(`Incorrect password — ${cause.attemptsRemaining} more attempt${cause.attemptsRemaining === 1 ? "" : "s"}`);
      } else {
        setError(err.message);
      }
    },
  });

  const magicLinkMutation = trpc.auth.magicLink.useMutation({
    onSuccess: (_data, variables) => {
      // Use variables.email (captured at call time) not step.email from closure,
      // which may be stale if the user changed state before the response arrived.
      router.push(`/auth/check-inbox?email=${encodeURIComponent(variables.email)}`);
    },
    onError: (err) => setError(err.message),
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      if (step.type === "signup_new") {
        router.push(`/auth/verify-email?email=${encodeURIComponent(step.email)}`);
      }
    },
    onError: (err) => setError(err.message),
  });

  // If the page loaded with ?email= (e.g. redirect from /auth/login), skip the
  // email entry step and run checkEmail immediately on mount.
  useEffect(() => {
    if (prefillEmail && step.type === "email_entry") {
      setStep({ type: "checking" });
      checkEmailMutation.mutate({ email: prefillEmail });
    }
    // Only runs on mount — prefillEmail is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step.type === "checking") return;
    setError(null);
    setStep({ type: "checking" });
    checkEmailMutation.mutate({ email });
  }

  function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step.type !== "login_password") return;
    loginMutation.mutate({ email: step.email, password, rememberMe });
  }

  function handleSignupSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step.type !== "signup_new") return;
    signupMutation.mutate({ fullName, email: step.email, password, termsAccepted: termsAccepted as true });
  }

  function handleOAuthSignIn(provider: "google" | "github") {
    if (rememberMe) {
      try { sessionStorage.setItem("buildrik_rememberMe", "true"); } catch {}
    }
    signIn(provider, { callbackUrl: "/auth/redirect" });
  }

  function resetToEmail() {
    const prevEmail = step.type !== "email_entry" && step.type !== "checking" ? step.email : email;
    setStep({ type: "email_entry" });
    setEmail(prevEmail);
    setPassword("");
    setError(null);
  }

  const showChangeEmail = step.type !== "email_entry" && step.type !== "checking";
  const currentEmail = step.type !== "email_entry" && step.type !== "checking" ? step.email : email;

  return (
    <>
      <AuthCard>
        <AuthLogo />

        {step.type === "email_entry" || step.type === "checking" ? (
          <>
            <h1 className="text-auth-title text-auth-text-primary text-center">
              Welcome to Buildrik
            </h1>
            <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-8">
              Build beautiful websites, fast.
            </p>

            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col items-center">
              {error && (
                <>
                  <FormBanner variant="error" title={error} />
                  <div className="h-4" />
                </>
              )}

              {!error && reasonBanner && (
                <>
                  <FormBanner variant="error" title={reasonBanner.title} subtitle={reasonBanner.subtitle} />
                  <div className="h-4" />
                </>
              )}

              <AuthInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />

              <div className="h-3" />

              <label className="flex items-center gap-2 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  suppressHydrationWarning
                  className="rounded border-auth-input-border"
                />
                <span className="text-auth-label text-auth-text-secondary">Remember me</span>
              </label>

              <div className="h-5" />

              <AuthButton
                type="submit"
                loading={step.type === "checking" || checkEmailMutation.isPending}
              >
                Continue
              </AuthButton>
            </form>

            <div className="h-6" />
            <AuthDivider text="or" />
            <div className="h-6" />

            <SocialButton provider="google" onClick={() => handleOAuthSignIn("google")} />
            <div className="h-2" />
            <SocialButton provider="github" onClick={() => handleOAuthSignIn("github")} />
          </>
        ) : step.type === "login_password" ? (
          <>
            {showChangeEmail && (
              <button
                type="button"
                onClick={resetToEmail}
                className="flex items-center gap-1 text-auth-label text-auth-link hover:underline mb-4 self-start"
              >
                <ArrowLeft size={14} />
                Change email
              </button>
            )}

            <h1 className="text-auth-title text-auth-text-primary text-center">
              Welcome back
            </h1>
            <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
              {currentEmail}
            </p>

            <form onSubmit={handleLoginSubmit} className="w-full flex flex-col items-center">
              {error && (
                <>
                  <FormBanner variant="error" title={error} />
                  <div className="h-4" />
                </>
              )}

              <AuthInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                autoFocus
              />

              <div className="h-3" />

              <div className="flex justify-end w-full">
                <Link
                  href="/auth/forgot-password"
                  className="text-auth-label text-auth-link hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="h-5" />

              <AuthButton type="submit" loading={loginMutation.isPending}>
                Sign In
              </AuthButton>
            </form>

            {step.providers.length > 0 && (
              <>
                <div className="h-6" />
                <AuthDivider text="or continue with" />
                <div className="h-6" />
                {step.providers.includes("google") && (
                  <>
                    <SocialButton provider="google" onClick={() => handleOAuthSignIn("google")} />
                    <div className="h-2" />
                  </>
                )}
                {step.providers.includes("github") && (
                  <SocialButton provider="github" onClick={() => handleOAuthSignIn("github")} />
                )}
              </>
            )}
          </>
        ) : step.type === "oauth_only" ? (
          <>
            {showChangeEmail && (
              <button
                type="button"
                onClick={resetToEmail}
                className="flex items-center gap-1 text-auth-label text-auth-link hover:underline mb-4 self-start"
              >
                <ArrowLeft size={14} />
                Change email
              </button>
            )}

            <h1 className="text-auth-title text-auth-text-primary text-center">
              Welcome back
            </h1>
            <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-8">
              {currentEmail}
            </p>

            {error && (
              <>
                <FormBanner variant="error" title={error} />
                <div className="h-4" />
              </>
            )}

            {step.providers.length > 0 ? (
              <>
                {step.providers.includes("google") && (
                  <>
                    <SocialButton provider="google" onClick={() => handleOAuthSignIn("google")} />
                    <div className="h-2" />
                  </>
                )}
                {step.providers.includes("github") && (
                  <SocialButton provider="github" onClick={() => handleOAuthSignIn("github")} />
                )}

                <div className="h-4" />

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    magicLinkMutation.mutate({ email: step.email });
                  }}
                  disabled={magicLinkMutation.isPending}
                  className="text-auth-label text-auth-link hover:underline"
                >
                  {magicLinkMutation.isPending ? "Sending…" : "Send a magic link instead"}
                </button>
              </>
            ) : (
              <>
                <p className="text-auth-subtitle text-auth-text-muted text-center mb-6">
                  This account has no password. Use a sign-in link to access it.
                </p>
                <AuthButton
                  onClick={() => {
                    setError(null);
                    magicLinkMutation.mutate({ email: step.email });
                  }}
                  loading={magicLinkMutation.isPending}
                >
                  Send sign-in link
                </AuthButton>
              </>
            )}
          </>
        ) : (
          <>
            {showChangeEmail && (
              <button
                type="button"
                onClick={resetToEmail}
                className="flex items-center gap-1 text-auth-label text-auth-link hover:underline mb-4 self-start"
              >
                <ArrowLeft size={14} />
                Change email
              </button>
            )}

            <h1 className="text-auth-title text-auth-text-primary text-center">
              Create your account
            </h1>
            <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
              Start building for free
            </p>

            <form onSubmit={handleSignupSubmit} className="w-full flex flex-col items-center">
              {error && (
                <>
                  <FormBanner variant="error" title={error} />
                  <div className="h-4" />
                </>
              )}

              <AuthInput
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                autoFocus
              />

              <div className="h-4" />

              <AuthInput
                label="Email"
                type="email"
                value={step.email}
                readOnly
                onChange={() => {}}
              />

              <div className="h-4" />

              <AuthInput
                label="Password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />

              <div className="h-3" />

              <PasswordStrength password={password} />

              <div className="h-4" />

              <label className="flex items-start gap-2 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  suppressHydrationWarning
                  className="mt-0.5 rounded border-auth-input-border"
                />
                <span className="text-auth-label text-auth-text-secondary">
                  I agree to the{" "}
                  <Link href="/terms" className="text-auth-link hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-auth-link hover:underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              <div className="h-5" />

              <AuthButton
                type="submit"
                disabled={!termsAccepted}
                loading={signupMutation.isPending}
              >
                Create Account
              </AuthButton>
            </form>
          </>
        )}
      </AuthCard>

      <p className="text-auth-fine text-auth-text-placeholder text-center mt-6">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-auth-text-secondary">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-auth-text-secondary">
          Privacy Policy
        </Link>
        .
      </p>
    </>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}
