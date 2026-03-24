"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

const GRACE_PERIOD_DAYS = 14;
const DISMISS_KEY = "buildrik_dunning_dismissed";

interface DunningBannerProps {
  failedAt?: Date | string | null;
}

function getDaysRemaining(failedAt: Date | string | null | undefined): number {
  if (!failedAt) return GRACE_PERIOD_DAYS;
  const failedDate = new Date(failedAt);
  const graceEnd = new Date(failedDate.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remaining = Math.ceil((graceEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

export function DunningBanner({ failedAt }: DunningBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  });

  if (dismissed) return null;

  const daysRemaining = getDaysRemaining(failedAt);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-3">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <p className="text-sm text-red-700">
          Payment failed. {daysRemaining > 0
            ? `Your workspace will be restricted in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`
            : "Your workspace has been restricted."}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <Link
          href="/dashboard/billing"
          className="shrink-0 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Update Payment
        </Link>
        <button
          onClick={handleDismiss}
          className="shrink-0 rounded p-1 text-red-400 hover:text-red-600"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
