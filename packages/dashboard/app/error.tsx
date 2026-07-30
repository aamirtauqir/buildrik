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
      style={{ backgroundColor: "var(--color-bg-page)" }}
    >
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#FDF2F2" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold" style={{ color: "var(--color-primary)" }}>
          500
        </h1>
        <h2
          className="mt-4 text-xl font-semibold"
          style={{ color: "var(--color-text-primary)" }}
        >
          Something Went Wrong
        </h2>
        <p className="mt-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
          Our team has been notified. Please try again in a moment.
        </p>
        {error.digest && (
          <p className="mt-3 text-body-sm font-mono" style={{ color: "var(--color-text-secondary)" }}>
            Error ID: {error.digest}
          </p>
        )}
        <div className="mt-8 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-body font-medium text-white cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-body font-medium border"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
