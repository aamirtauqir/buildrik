"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from "lucide-react";
import { VERCEL_CHECK_LABEL, type PrePublishChecksResult } from "@buildrik/shared/schemas/publish";
import { Button, Modal } from "@/components/dashboard/primitives";

const STATUS_ICON = {
  pass: <CheckCircle2 className="h-5 w-5" style={{ color: "var(--color-success)" }} />,
  warning: <AlertTriangle className="h-5 w-5" style={{ color: "#C27803" }} />,
  fail: <XCircle className="h-5 w-5" style={{ color: "var(--color-error)" }} />,
} as const;

interface PrePublishChecksProps {
  checks: PrePublishChecksResult;
  onPublish: (notifyTeam: boolean) => void;
  onCancel: () => void;
}

export function PrePublishChecks({ checks, onPublish, onCancel }: PrePublishChecksProps) {
  const [notifyTeam, setNotifyTeam] = useState(false);

  return (
    <Modal
      open={true}
      onClose={onCancel}
      title="Pre-Publish Checks"
      width={512}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onPublish(notifyTeam)} disabled={!checks.ready}>
            Publish
          </Button>
        </>
      }
    >
      <div>
        <div className="space-y-3">
          {checks.checks.map((check) => (
            <div key={check.label} className="flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: "var(--color-border-default)" }}>
              <div className="mt-0.5 shrink-0">{STATUS_ICON[check.status]}</div>
              <div>
                <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>{check.label}</p>
                <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>{check.detail}</p>
                {check.label === VERCEL_CHECK_LABEL && check.status === "fail" && (
                  <Link
                    href="/dashboard/settings/integrations"
                    className="mt-2 inline-flex items-center gap-1 text-body-sm font-semibold hover:underline"
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
          <span className="text-body" style={{ color: "var(--color-text-secondary)" }}>Notify team members when published</span>
        </label>
      </div>
    </Modal>
  );
}
