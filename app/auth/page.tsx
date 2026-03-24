"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthButtonSecondary } from "@/components/auth/auth-button-secondary";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SocialButton } from "@/components/auth/social-button";
import { signIn } from "next-auth/react";

export default function AuthLandingPage() {
  const router = useRouter();

  return (
    <>
      <AuthCard>
        <AuthLogo />

        <h1 className="text-auth-title text-auth-text-primary text-center">
          Welcome to Buildrik
        </h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-8">
          Build beautiful websites, fast.
        </p>

        <AuthButton onClick={() => router.push("/auth/login")}>
          Sign In
        </AuthButton>

        <div className="h-3" />

        <AuthButtonSecondary onClick={() => router.push("/auth/signup")}>
          Create Account
        </AuthButtonSecondary>

        <div className="h-6" />

        <AuthDivider text="or" />

        <div className="h-6" />

        <SocialButton provider="google" onClick={() => signIn("google", { callbackUrl: "/auth/redirect" })} />

        <div className="h-2" />

        <SocialButton provider="github" onClick={() => signIn("github", { callbackUrl: "/auth/redirect" })} />
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
