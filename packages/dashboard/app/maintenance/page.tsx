"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MaintenancePage() {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          router.push("/dashboard");
        }
      } catch {
        // Still down, keep waiting
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mx-auto mb-8">
          <h1 className="text-2xl font-bold" style={{ color: "#0D0D0D" }}>
            Buildrik
          </h1>
        </div>
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#FEF2F2" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E42313"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h2
          className="text-xl font-semibold"
          style={{ color: "#0D0D0D" }}
        >
          We&apos;ll be back shortly
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
          We&apos;re performing scheduled maintenance. This page will
          automatically refresh when we&apos;re back online.
        </p>
      </div>
    </div>
  );
}
