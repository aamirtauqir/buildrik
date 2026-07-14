"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";

/** mm:ss for anything over a minute — the window is up to 15 of them. */
function format(total: number) {
  if (total >= 60) {
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return `${total}s`;
}

function RateLimitedContent() {
  const searchParams = useSearchParams();
  // `until` is the limiter's real resetAt (ISO). This used to be a hardcoded 60s
  // countdown while the actual window is up to 15 minutes — so the screen invited
  // users to retry on a timer that was a lie, and they got blocked again.
  const until = searchParams.get("until");

  const [seconds, setSeconds] = useState(() => {
    if (!until) return 0;
    const ms = new Date(until).getTime() - Date.now();
    return Number.isNaN(ms) ? 0 : Math.max(0, Math.ceil(ms / 1000));
  });

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  return (
    <AuthMessage
      title="Too many requests"
      subtitle="You've made too many attempts. Please wait a moment and try again."
    >
      {seconds > 0 ? (
        <p className="text-auth-input font-semibold text-auth-cta text-center tabular-nums">
          Try again in {format(seconds)}
        </p>
      ) : (
        <p className="text-auth-input font-semibold text-auth-cta text-center">You can try again now</p>
      )}
      <Link href="/auth" className="text-auth-label text-auth-link hover:underline text-center">
        Back to log in
      </Link>
    </AuthMessage>
  );
}

export default function RateLimitedPage() {
  return (
    <Suspense fallback={null}>
      <RateLimitedContent />
    </Suspense>
  );
}
