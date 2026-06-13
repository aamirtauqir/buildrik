"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

const DISMISS_KEY = "buildrik_dunning_dismissed";

interface DunningBannerProps {
  // Real downgrade deadline. The billing-downgrade cron downgrades 7 days
  // after the period end, so the page passes currentPeriodEnd + 7d. When
  // unknown, the banner shows no fabricated countdown (previously hardcoded
  // "14 days" regardless of the real schedule).
  graceEndsAt?: Date | string | null;
}

function getDaysRemaining(graceEndsAt: Date | string | null | undefined): number | null {
  if (!graceEndsAt) return null;
  const remaining = Math.ceil(
    (new Date(graceEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  );
  return Math.max(0, remaining);
}

export function DunningBanner({ graceEndsAt }: DunningBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(DISMISS_KEY) === "true";
  });

  if (dismissed) return null;

  const daysRemaining = getDaysRemaining(graceEndsAt);

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  const message =
    daysRemaining === null
      ? "Payment failed. Update your payment method to keep your workspace active."
      : daysRemaining > 0
        ? `Payment failed. Your workspace will be restricted in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}.`
        : "Payment failed. Your workspace has been restricted.";

  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-3">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <p className="text-sm text-red-700">{message}</p>
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
