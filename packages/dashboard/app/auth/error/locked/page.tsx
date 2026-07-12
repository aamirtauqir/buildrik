"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

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
    <AuthMessage
      title="Account temporarily locked"
      subtitle="Too many failed attempts. For your security this account is locked for a short while."
    >
      {!expired && remaining !== null && (
        <p className="text-auth-input font-medium text-auth-text-primary tabular-nums">
          {mins}:{secs.toString().padStart(2, "0")}
        </p>
      )}
      <Link href="/auth/forgot-password" className="w-full">
        <AuthButton type="button">Reset password</AuthButton>
      </Link>
      <Link href="/auth" className="w-full">
        <AuthButton type="button" variant="secondary">Back to log in</AuthButton>
      </Link>
      <Link href="mailto:support@buildrik.com" className="text-auth-label text-auth-link hover:underline text-center">
        Contact support
      </Link>
    </AuthMessage>
  );
}

export default function AccountLockedPage() {
  return <Suspense fallback={null}><LockedContent /></Suspense>;
}
