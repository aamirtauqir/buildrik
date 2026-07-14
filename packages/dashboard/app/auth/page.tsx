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
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { signIn } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { safeReturnUrl } from "@lib/safe-return-url";
import { cn } from "@lib/utils";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") ?? "";
  const returnUrl = safeReturnUrl(searchParams.get("returnUrl"));
  const reason = searchParams.get("reason");
  const reasonBanner =
    reason === "session-required"
      ? { title: "Please sign in again", subtitle: "Your session has expired." }
      : reason === "session-expired"
        ? { title: "Session expired", subtitle: "Sign in to continue." }
        : null;

  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Backend 5xx → the mockup's "signin-server-error" state (retry + support),
  // which is a different shape from a rejected credential.
  const [serverError, setServerError] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      if (data.requiresTwoFactor) {
        // Carry rememberMe + returnUrl through the 2FA step (query params, since
        // the create-session call happens on the 2FA page).
        const params = new URLSearchParams({ token: data.tempToken ?? "" });
        if (rememberMe) params.set("remember", "1");
        if (returnUrl) params.set("returnUrl", returnUrl);
        router.push(`/auth/2fa?${params.toString()}`);
      } else {
        const res = await fetch("/api/auth/create-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionToken: data.sessionToken, rememberMe }),
        });
        if (res.ok) {
          // Full navigation, not router.push: create-session just set the session
          // cookie manually, but useSession on /auth/redirect would still read the
          // stale "unauthenticated" client cache and bounce to /auth (which
          // middleware then sends to /dashboard, skipping onboarding). A hard load
          // makes /auth/redirect read the fresh cookie and route correctly.
          window.location.assign(returnUrl ?? "/auth/redirect");
        } else {
          setServerError(true);
        }
      }
    },
    onError: (err) => {
      setServerError(false);
      // Too many failures from this IP → captcha required. Show the widget and
      // let them re-submit with a solve.
      if (err.message === "CAPTCHA_REQUIRED") {
        setCaptchaRequired(true);
        setError("Please complete the verification below, then try again.");
        return;
      }
      // Account locked (too many failed attempts) → dedicated screen. Otherwise
      // show the uniform "Incorrect email or password" (no attempts-remaining
      // leak — see the enumeration fix in auth.service.login).
      if (err.message.toLowerCase().includes("locked")) {
        // auth.service now attaches the real lockedUntil; errorFormatter forwards
        // AuthError.data through as `data.cause`. Pass it on so the screen counts
        // down to the actual unlock instead of showing nothing.
        const cause = err.data?.cause as { lockedUntil?: string | null } | undefined;
        const until = cause?.lockedUntil;
        router.push(until ? `/auth/error/locked?until=${encodeURIComponent(until)}` : "/auth/error/locked");
        return;
      }
      if (err.data?.code === "INTERNAL_SERVER_ERROR") {
        setError(null);
        setServerError(true);
        return;
      }
      setError(err.message);
    },
  });

  const pending = loginMutation.isPending;
  // A rejected credential (not the captcha prompt) reds the password field and
  // offers the passwordless way in — the mockup's signin-error state.
  const credentialError = Boolean(error) && !captchaRequired;

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setServerError(false);
    loginMutation.mutate({ email, password, rememberMe, turnstileToken: captchaToken ?? undefined });
  }

  function handleOAuthSignIn(provider: "google" | "github") {
    signIn(provider, { callbackUrl: returnUrl ?? "/auth/redirect" });
  }

  return (
    <AuthCard>
      <div className="flex flex-col items-center gap-1.5 text-center mb-5">
        <span className="text-auth-subtitle text-auth-text-muted">Log in to</span>
        <span className="text-[21px] font-bold leading-none tracking-[-0.02em] text-auth-text-primary">
          Buildrick
        </span>
      </div>

      {serverError && (
        <>
          <FormBanner variant="error" title="Something went wrong on our end. Please try again in a moment." />
          <div className="h-4" />
        </>
      )}
      {!serverError && error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}
      {!serverError && !error && reasonBanner && (
        <>
          <FormBanner variant="error" title={reasonBanner.title} subtitle={reasonBanner.subtitle} />
          <div className="h-4" />
        </>
      )}

      {/* Mockup collapses the social + divider block while the credential
          submit is in flight (signin-loading frame). */}
      {!pending && (
        <>
          <SocialButton
            provider="google"
            variant="primary"
            label="Login with Google"
            onClick={() => handleOAuthSignIn("google")}
          />
          <div className="h-2.5" />
          {/* Not in the mockup, but GitHub OAuth is wired in server/auth.config.ts —
              kept so the provider stays reachable. */}
          <SocialButton provider="github" onClick={() => handleOAuthSignIn("github")} />

          <div className="h-4" />
          <AuthDivider text="or" />
          <div className="h-4" />
        </>
      )}

      <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
        <div className={cn("flex flex-col gap-3", pending && "opacity-50 pointer-events-none")}>
          <AuthInput
            label="Email"
            hideLabel
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
          />
          <AuthInput
            label="Password"
            hideLabel
            type="password"
            placeholder="Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            invalid={credentialError}
          />
        </div>

        {/* Not in the mockup; `rememberMe` is a real backend flag (create-session
            session lifetime), so the control stays. */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            suppressHydrationWarning
            className="rounded border-auth-input-fill-border accent-auth-cta"
          />
          <span className="text-auth-label text-auth-text-secondary">Remember me</span>
        </label>

        {captchaRequired && (
          <div className="py-1">
            <TurnstileWidget onVerify={setCaptchaToken} />
          </div>
        )}

        <div className="h-1" />

        <AuthButton
          type="submit"
          variant={pending ? "primary" : "secondary"}
          loading={pending}
          disabled={captchaRequired && !captchaToken}
        >
          {pending ? "Logging in…" : serverError ? "Try again" : "Log in"}
        </AuthButton>

        {credentialError && !pending && (
          <Link href="/auth/magic-link" className="w-full">
            <AuthButton type="button">Email me a magic link</AuthButton>
          </Link>
        )}
      </form>

      <div className="h-6" />

      <Link href="/auth/forgot-password" className="text-auth-label font-semibold text-auth-text-body hover:underline">
        Forgot password?
      </Link>

      {!pending && (
        <>
          <div className="h-3.5" />
          {serverError ? (
            <p className="text-auth-label text-auth-text-muted text-center">
              Still stuck?{" "}
              <a href="mailto:support@buildrik.com" className="font-semibold text-auth-text-body hover:underline">
                Contact support
              </a>
            </p>
          ) : (
            <p className="text-auth-label text-auth-text-muted text-center">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup" className="font-semibold text-auth-text-body hover:underline">
                Sign up
              </Link>
            </p>
          )}
        </>
      )}
    </AuthCard>
  );
}

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}
