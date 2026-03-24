"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";

function LockedContent() {
  const searchParams = useSearchParams();
  const until = searchParams.get("until");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!until) { setExpired(true); return; }
    const target = new Date(until).getTime();
    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) setExpired(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  const mins = remaining !== null ? Math.floor(remaining / 60) : 0;
  const secs = remaining !== null ? remaining % 60 : 0;

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="lock" color="red" />
      <h1 className="text-auth-title text-auth-text-primary text-center">Account locked</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1 mb-6">
        Too many failed attempts.
        {!expired && remaining !== null && (
          <> Try again in <strong>{mins}:{secs.toString().padStart(2, "0")}</strong></>
        )}
      </p>
      <div className="h-4" />
      {expired && (
        <Link href="/auth/login" className="text-auth-link hover:underline text-center block font-semibold mb-3">
          Back to sign in
        </Link>
      )}
      <Link href="/auth/forgot-password" className="text-auth-link hover:underline text-center block">
        Reset your password
      </Link>
      <div className="h-3" />
      <Link href="mailto:support@buildrik.com" className="text-auth-link hover:underline text-center block">
        Contact support
      </Link>
    </AuthCard>
  );
}

export default function AccountLockedPage() {
  return <Suspense fallback={null}><LockedContent /></Suspense>;
}
