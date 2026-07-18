"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, X, ArrowUpRight } from "lucide-react";
import { VERCEL_CHECK_LABEL, type PrePublishChecksResult } from "@buildrik/shared/schemas/publish";
import { Button } from "@/components/dashboard/primitives";

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-5 w-5" style={{ color: "var(--color-success)" }} />,
  warning: <AlertTriangle className="h-5 w-5" style={{ color: "#F59E0B" }} />,
  fail: <XCircle className="h-5 w-5" style={{ color: "var(--color-primary)" }} />,
} as const;

interface PrePublishChecksProps {
  checks: PrePublishChecksResult;
  onPublish: (notifyTeam: boolean) => void;
  onCancel: () => void;
}

export function PrePublishChecks({ checks, onPublish, onCancel }: PrePublishChecksProps) {
  const [notifyTeam, setNotifyTeam] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>Pre-Publish Checks</h2>
          <button onClick={onCancel} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {checks.checks.map((check) => (
            <div key={check.label} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="mt-0.5 shrink-0">{STATUS_ICON[check.status]}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{check.label}</p>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{check.detail}</p>
                {check.label === VERCEL_CHECK_LABEL && check.status === "fail" && (
                  <Link
                    href="/dashboard/settings/integrations"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    style={{ color: "var(--color-primary)" }}
                  >
                    Connect Vercel
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={notifyTeam}
            onChange={(e) => setNotifyTeam(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Notify team members when published</span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onPublish(notifyTeam)} disabled={!checks.ready}>
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
