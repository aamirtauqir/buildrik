"use client";

import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="text-center max-w-sm mx-auto px-4">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "#FEF2F2" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#E42313"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2
          className="text-lg font-semibold"
          style={{ color: "#0D0D0D" }}
        >
          Failed to load this page
        </h2>
        <p className="mt-2 text-sm" style={{ color: "#7A7A7A" }}>
          Something went wrong while loading this section.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
            style={{ backgroundColor: "#E42313" }}
          >
            Retry
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg text-sm font-medium border"
            style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
