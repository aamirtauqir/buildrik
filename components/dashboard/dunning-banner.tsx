"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

export function DunningBanner() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-5 py-3">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
        <p className="text-sm text-red-700">
          Payment failed. Your workspace will be restricted soon.
        </p>
      </div>
      <Link
        href="/dashboard/billing"
        className="ml-4 shrink-0 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
      >
        Update Payment
      </Link>
    </div>
  );
}
