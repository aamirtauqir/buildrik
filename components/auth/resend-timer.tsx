"use client";

import { useState, useEffect, useCallback } from "react";

interface ResendTimerProps {
  initialSeconds: number;
  onResend: () => void;
  label?: string;
}

export function ResendTimer({ initialSeconds, onResend, label = "Didn't receive it?" }: ResendTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (seconds <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleResend = useCallback(() => {
    onResend();
    setSeconds(initialSeconds);
    setCanResend(false);
  }, [onResend, initialSeconds]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const timeDisplay = `${mins}:${secs.toString().padStart(2, "0")}`;

  if (!canResend) {
    return (
      <p className="text-auth-error text-auth-cta text-center">
        Code expires in {timeDisplay}
      </p>
    );
  }

  return (
    <p className="text-auth-subtitle text-auth-text-muted text-center">
      {label}{" "}
      <button onClick={handleResend} className="text-auth-link text-auth-link font-medium hover:underline">
        Resend
      </button>
    </p>
  );
}
