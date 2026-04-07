"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";

export default function RateLimitedPage() {
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="warning" color="red" />

      <h1 className="text-auth-title text-auth-text-primary text-center">
        Too many requests
      </h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        You&apos;ve made too many requests. Please wait and try again.
      </p>

      <div className="h-4" />

      <p className="text-auth-error text-auth-cta text-center font-semibold">
        {seconds > 0 ? `Try again in ${seconds}s` : "You can try again now"}
      </p>

      <div className="h-6" />

      <Link
        href="/auth/login"
        className="text-auth-label text-auth-link hover:underline text-center block"
      >
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}
