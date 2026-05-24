"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import type { PrePublishChecksResult } from "@buildrik/shared/schemas/publish";

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-5 w-5" style={{ color: "#22C55E" }} />,
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
          <h2 className="text-lg font-bold" style={{ color: "#0D0D0D" }}>Pre-Publish Checks</h2>
          <button onClick={onCancel} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" style={{ color: "#7A7A7A" }} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {checks.checks.map((check) => (
            <div key={check.label} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: "#E8E8E8" }}>
              <div className="mt-0.5 shrink-0">{STATUS_ICON[check.status]}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#0D0D0D" }}>{check.label}</p>
                <p className="text-xs" style={{ color: "#7A7A7A" }}>{check.detail}</p>
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
          <span className="text-sm" style={{ color: "#7A7A7A" }}>Notify team members when published</span>
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-sm font-medium"
            style={{ color: "#7A7A7A", backgroundColor: "#F4F4F4" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onPublish(notifyTeam)}
            disabled={!checks.ready}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
