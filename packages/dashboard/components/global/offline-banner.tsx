"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { WifiOff, RefreshCw, Wifi } from "lucide-react";

const RETRY_INTERVAL = 15;

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [countdown, setCountdown] = useState(RETRY_INTERVAL);
  const wasOfflineRef = useRef(false);

  const goOnline = useCallback(() => {
    setIsOffline(false);
    if (wasOfflineRef.current) {
      setShowBackOnline(true);
      setTimeout(() => setShowBackOnline(false), 3000);
    }
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      wasOfflineRef.current = true;
      setIsOffline(true);
      setCountdown(RETRY_INTERVAL);
    };
    const handleOnline = () => goOnline();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    if (!navigator.onLine) {
      wasOfflineRef.current = true;
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [goOnline]);

  useEffect(() => {
    if (!isOffline) return;

    setCountdown(RETRY_INTERVAL);

    const tick = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (navigator.onLine) goOnline();
          return RETRY_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [isOffline, goOnline]);

  if (showBackOnline) {
    return (
      <div
        className="fixed left-0 right-0 top-0 z-[10000] flex items-center justify-center gap-3 px-4 py-2"
        style={{ backgroundColor: "#F0FDF4", borderBottom: "1px solid var(--color-success)" }}
        role="status"
      >
        <Wifi className="h-4 w-4" style={{ color: "#166534" }} />
        <p className="text-sm font-medium" style={{ color: "#166534" }}>
          Back online
        </p>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[10000] flex items-center justify-center gap-3 px-4 py-2"
      style={{ backgroundColor: "#FEFCE8", borderBottom: "1px solid #EAB308" }}
      role="alert"
    >
      <WifiOff className="h-4 w-4" style={{ color: "#854D0E" }} />
      <p className="text-sm font-medium" style={{ color: "#854D0E" }}>
        You&apos;re offline. Auto-retrying in {countdown}s...
      </p>
      <button
        onClick={() => {
          if (navigator.onLine) goOnline();
          else setCountdown(RETRY_INTERVAL);
        }}
        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
        style={{ backgroundColor: "#EAB308", color: "white" }}
      >
        <RefreshCw className="h-3 w-3" />
        Retry Now
      </button>
    </div>
  );
}
