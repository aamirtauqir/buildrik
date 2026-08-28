"use client";

import { useState } from "react";
import { SectionCard, MetricValue, Button, InputField } from "@/components/dashboard/primitives";

interface PreviousExport {
  id: string;
  date: string;
  size: string;
  expiresAt?: string;
  status: "ready" | "processing";
  downloadUrl?: string;
}

interface DangerZoneTabProps {
  estimatedSize?: string;
  previousExports?: PreviousExport[];
  onExport?: () => void;
  onDelete?: (reason?: string) => void;
  isExporting?: boolean;
  isSoleOwner?: boolean;
  hasActiveSubscription?: boolean;
}

const EXPORT_INCLUDES = [
  "Sites (published and drafts)",
  "Settings and preferences",
  "Form submissions",
  "Team members",
  "Analytics data",
  "Invoices and billing history",
  "Account preferences",
];

const DELETE_WARNINGS = [
  "Your account enters a 30-day grace period before permanent deletion.",
  "All published sites will be immediately unpublished.",
  "You will lose access to all workspace data.",
  "This action cannot be undone after the grace period ends.",
];

function getExpiryText(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  if (diffMs <= 0) return "Expired";
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Expires in less than 1 hour";
  if (diffHours < 24) return `Expires in ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `Expires in ${diffDays}d`;
}

export function DangerZoneTab({
  estimatedSize = "~2 MB",
  previousExports = [],
  onExport,
  onDelete,
  isExporting,
  isSoleOwner,
  hasActiveSubscription,
}: DangerZoneTabProps) {
  const [confirmText, setConfirmText] = useState("");
  const [reason, setReason] = useState("");
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  // Blocked = a prerequisite (sole ownership / live subscription) isn't cleared.
  // The backend enforces this too; disabling here just avoids a doomed submit.
  const blocked = !!isSoleOwner || !!hasActiveSubscription;
  const canDelete = confirmText === "DELETE" && !blocked;

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!canDelete) return;
    onDelete?.(reason || undefined);
  }

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <section>
        <h2 className="text-section-title mb-1" style={{ color: "var(--color-text-primary)" }}>
          Export your data
        </h2>
        <p className="text-body mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Download a copy of everything we store about you and your workspace.
        </p>

        <SectionCard title="What's included" className="mb-4">
          <ul className="space-y-1">
            {EXPORT_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2 text-body" style={{ color: "var(--color-text-secondary)" }}>
                <span style={{ color: "#0E9F6E" }}>&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-body-sm mt-3" style={{ color: "var(--color-text-muted)" }}>
            Estimated size: <MetricValue>{estimatedSize}</MetricValue>
          </p>
        </SectionCard>

        {previousExports.length > 0 && (
          <div className="mb-4">
            <p className="text-body font-medium mb-2" style={{ color: "var(--color-text-primary)" }}>
              Previous exports
            </p>
            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              {previousExports.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: idx < previousExports.length - 1 ? "1px solid var(--color-border-default)" : undefined }}
                >
                  <div>
                    <p className="text-body" style={{ color: "var(--color-text-primary)" }}>
                      <MetricValue>{exp.date}</MetricValue>
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <MetricValue>{exp.size}</MetricValue>
                      </p>
                      {exp.expiresAt && (
                        <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                          {getExpiryText(exp.expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {exp.status === "ready" && exp.downloadUrl ? (
                    <a
                      href={exp.downloadUrl}
                      className="text-body font-medium"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                      Processing...
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button type="button" variant="ghost" onClick={onExport} disabled={isExporting}>
          {isExporting ? "Preparing export..." : "Export my data"}
        </Button>
      </section>

      <div style={{ borderTop: "1px solid var(--color-border-default)" }} />

      {/* Delete Account Section */}
      <section>
        <h2 className="text-section-title mb-1" style={{ color: "#771D1D" }}>
          Delete account
        </h2>
        <p className="text-body mb-4" style={{ color: "var(--color-text-secondary)" }}>
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>

        {/* Pre-checks warnings */}
        {(isSoleOwner || hasActiveSubscription) && (
          <div
            className="p-4 rounded-lg border mb-4"
            style={{ borderColor: "#E3A008", backgroundColor: "#FDFDEA" }}
          >
            <p className="text-body font-medium mb-2" style={{ color: "#723B13" }}>
              Before you can delete your account:
            </p>
            <ul className="space-y-1">
              {isSoleOwner && (
                <li className="flex items-start gap-2 text-body" style={{ color: "#723B13" }}>
                  <span className="mt-0.5 font-bold">!</span>
                  You are the sole owner of a workspace. Transfer ownership or delete the workspace first.
                </li>
              )}
              {hasActiveSubscription && (
                <li className="flex items-start gap-2 text-body" style={{ color: "#723B13" }}>
                  <span className="mt-0.5 font-bold">!</span>
                  You have an active paid subscription. Cancel it before deleting your account.
                </li>
              )}
            </ul>
          </div>
        )}

        <div
          className="p-4 rounded-lg border mb-4"
          style={{ borderColor: "#F8B4B4", backgroundColor: "#FDF2F2" }}
        >
          <p className="text-body font-medium mb-1" style={{ color: "#771D1D" }}>
            What happens when you delete your account
          </p>
          <ul className="space-y-1 mt-2">
            {DELETE_WARNINGS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body" style={{ color: "#771D1D" }}>
                <span className="mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-body-sm mb-4" style={{ color: "#9B1C1C" }}>
          Your data will be permanently deleted after 30 days.
        </p>

        {!showDeleteForm ? (
          <Button type="button" variant="danger" disabled={blocked} onClick={() => setShowDeleteForm(true)}>
            I want to delete my account
          </Button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell us why you're leaving..."
                className="w-full px-3 py-2 text-body rounded-md border outline-none resize-none"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              />
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                Type{" "}
                <code
                  className="px-1 py-0.5 rounded text-body-sm font-mono"
                  style={{ backgroundColor: "var(--color-border-default)" }}
                >
                  DELETE
                </code>{" "}
                to confirm
              </label>
              <InputField
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
                valid={canDelete}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" variant="danger" disabled={!canDelete}>
                Delete Account
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowDeleteForm(false);
                  setConfirmText("");
                  setReason("");
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
