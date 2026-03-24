"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "#FAFAFA" }}
    >
      <div className="text-center max-w-md mx-auto px-4">
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
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold" style={{ color: "#E42313" }}>
          500
        </h1>
        <h2
          className="mt-4 text-xl font-semibold"
          style={{ color: "#0D0D0D" }}
        >
          Something Went Wrong
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
          Our team has been notified. Please try again in a moment.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs font-mono" style={{ color: "#7A7A7A" }}>
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: "#E42313" }}
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
