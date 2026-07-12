"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthMessage } from "@/components/auth/auth-message";

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthMessage
      title="Too many requests"
      subtitle="You've made too many attempts. Please wait a moment and try again."
    >
      <p className="text-auth-input font-semibold text-auth-cta text-center tabular-nums">
        {seconds > 0 ? `Try again in ${seconds}s` : "You can try again now"}
      </p>
      <Link href="/auth" className="text-auth-label text-auth-link hover:underline text-center">
        Back to log in
      </Link>
    </AuthMessage>
  );
}
