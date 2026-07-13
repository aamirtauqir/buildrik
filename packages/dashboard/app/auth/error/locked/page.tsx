"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Clock, Lock } from "lucide-react";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";

function LockedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // `until` is an ISO lockedUntil. The login mutation cannot supply it today —
  // auth.service throws ACCOUNT_LOCKED with no expiry payload — so the countdown
  // only renders when a caller passes one. It is never faked.
  const until = searchParams.get("until");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (!until) return;
    const target = new Date(until).getTime();
    if (Number.isNaN(target)) return;
    const tick = () => {
      const diff = Math.max(0, Math.floor((target - Date.now()) / 1000));
      setRemaining(diff);
      if (diff <= 0) setUnlocked(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  useEffect(() => {
    if (unlocked) router.replace("/auth/account-unlocked");
  }, [unlocked, router]);

  const mins = Math.floor((remaining ?? 0) / 60);
  const secs = (remaining ?? 0) % 60;

  return (
    <AuthMessage
      icon={<Lock size={26} className="text-auth-input-error" />}
      title="Account temporarily locked"
      subtitle="Too many failed attempts. For your security, log-in is paused. Reset your password or try again shortly."
    >
      {remaining !== null && !unlocked && (
        <div className="w-full h-auth-btn rounded-auth-btn bg-auth-btn-secondary flex items-center justify-center gap-2.5">
          <Clock size={17} className="text-auth-text-muted" />
          <span className="text-auth-input text-auth-text-muted">
            Unlocks in{" "}
            <span className="font-mono font-medium text-auth-text-body tabular-nums">
              {mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
            </span>
          </span>
        </div>
      )}
      <Link href="/auth/forgot-password" className="w-full">
        <AuthButton type="button">Reset password</AuthButton>
      </Link>
      <Link href="/auth" className="w-full">
        <AuthButton type="button" variant="secondary">Back to log in</AuthButton>
      </Link>
    </AuthMessage>
  );
}

export default function AccountLockedPage() {
  return <Suspense fallback={null}><LockedContent /></Suspense>;
}
