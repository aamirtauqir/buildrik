"use client";
import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (!isOffline) return;
    const interval = setInterval(() => {
      if (navigator.onLine) setIsOffline(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [isOffline]);

  if (!isOffline) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-[10000] flex items-center justify-center gap-3 px-4 py-2"
      style={{ backgroundColor: "#FEFCE8", borderBottom: "1px solid #EAB308" }}
    >
      <WifiOff className="h-4 w-4" style={{ color: "#854D0E" }} />
      <p className="text-sm font-medium" style={{ color: "#854D0E" }}>
        You&apos;re offline. Auto-retrying every 15s...
      </p>
      <button
        onClick={() => {
          if (navigator.onLine) setIsOffline(false);
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
