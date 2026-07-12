"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthButton } from "./auth-button";

interface ResendTimerProps {
  initialSeconds: number;
  onResend: () => void;
  /** Button text when ready to resend. Defaults to "Resend". */
  label?: string;
}

export function ResendTimer({ initialSeconds, onResend, label = "Resend" }: ResendTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(initialSeconds <= 0);

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

  const timeDisplay = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`;

  return (
    <AuthButton type="button" variant="secondary" disabled={!canResend} onClick={handleResend}>
      {canResend ? label : `Resend in ${timeDisplay}`}
    </AuthButton>
  );
}
