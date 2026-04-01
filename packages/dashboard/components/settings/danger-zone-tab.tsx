"use client";

import { useState } from "react";

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

  const canDelete = confirmText === "DELETE";

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!canDelete) return;
    onDelete?.(reason || undefined);
  }

  return (
    <div className="space-y-8">
      {/* Export Section */}
      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: "#0D0D0D" }}>
          Export your data
        </h2>
        <p className="text-sm mb-4" style={{ color: "#7A7A7A" }}>
          Download a copy of everything we store about you and your workspace.
        </p>

        <div
          className="p-4 rounded-lg border mb-4"
          style={{ borderColor: "#E8E8E8" }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: "#0D0D0D" }}>
            What&apos;s included:
          </p>
          <ul className="space-y-1">
            {EXPORT_INCLUDES.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm" style={{ color: "#7A7A7A" }}>
                <span style={{ color: "#16a34a" }}>&#10003;</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs mt-3" style={{ color: "#B0B0B0" }}>
            Estimated size: {estimatedSize}
          </p>
        </div>

        {previousExports.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2" style={{ color: "#0D0D0D" }}>
              Previous exports
            </p>
            <div
              className="rounded-lg border overflow-hidden"
              style={{ borderColor: "#E8E8E8" }}
            >
              {previousExports.map((exp, idx) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: idx < previousExports.length - 1 ? "1px solid #E8E8E8" : undefined }}
                >
                  <div>
                    <p className="text-sm" style={{ color: "#0D0D0D" }}>
                      {exp.date}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs" style={{ color: "#7A7A7A" }}>
                        {exp.size}
                      </p>
                      {exp.expiresAt && (
                        <p className="text-xs" style={{ color: "#B0B0B0" }}>
                          {getExpiryText(exp.expiresAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {exp.status === "ready" && exp.downloadUrl ? (
                    <a
                      href={exp.downloadUrl}
                      className="text-sm font-medium"
                      style={{ color: "#E42313" }}
                    >
                      Download
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: "#B0B0B0" }}>
                      Processing...
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onExport}
          disabled={isExporting}
          className="px-4 py-2 text-sm font-medium rounded-md border disabled:opacity-60"
          style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
        >
          {isExporting ? "Preparing export..." : "Export My Data"}
        </button>
      </section>

      <div style={{ borderTop: "1px solid #E8E8E8" }} />

      {/* Delete Account Section */}
      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: "#7F1D1D" }}>
          Delete account
        </h2>
        <p className="text-sm mb-4" style={{ color: "#7A7A7A" }}>
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>

        {/* Pre-checks warnings */}
        {(isSoleOwner || hasActiveSubscription) && (
          <div
            className="p-4 rounded-lg border mb-4"
            style={{ borderColor: "#fbbf24", backgroundColor: "#fffbeb" }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: "#92400e" }}>
              Before you can delete your account:
            </p>
            <ul className="space-y-1">
              {isSoleOwner && (
                <li className="flex items-start gap-2 text-sm" style={{ color: "#92400e" }}>
                  <span className="mt-0.5 font-bold">!</span>
                  You are the sole owner of a workspace. Transfer ownership or delete the workspace first.
                </li>
              )}
              {hasActiveSubscription && (
                <li className="flex items-start gap-2 text-sm" style={{ color: "#92400e" }}>
                  <span className="mt-0.5 font-bold">!</span>
                  You have an active paid subscription. Cancel it before deleting your account.
                </li>
              )}
            </ul>
          </div>
        )}

        <div
          className="p-4 rounded-lg border mb-4"
          style={{ borderColor: "#fca5a5", backgroundColor: "#fff5f5" }}
        >
          <p className="text-sm font-medium mb-1" style={{ color: "#7F1D1D" }}>
            What happens when you delete your account
          </p>
          <ul className="space-y-1 mt-2">
            {DELETE_WARNINGS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#7F1D1D" }}>
                <span className="mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs mb-4" style={{ color: "#991b1b" }}>
          Your data will be permanently deleted after 30 days.
        </p>

        {!showDeleteForm ? (
          <button
            type="button"
            onClick={() => setShowDeleteForm(true)}
            className="px-4 py-2 text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: "#7F1D1D" }}
          >
            I want to delete my account
          </button>
        ) : (
          <form onSubmit={handleDelete} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Tell us why you're leaving..."
                className="w-full px-3 py-2 text-sm rounded-md border outline-none resize-none"
                style={{ borderColor: "#E8E8E8", color: "#0D0D0D" }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "#0D0D0D" }}>
                Type{" "}
                <code
                  className="px-1 py-0.5 rounded text-xs font-mono"
                  style={{ backgroundColor: "#E8E8E8" }}
                >
                  DELETE
                </code>{" "}
                to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 text-sm rounded-md border outline-none font-mono"
                style={{ borderColor: canDelete ? "#7F1D1D" : "#E8E8E8", color: "#0D0D0D" }}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!canDelete}
                className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50"
                style={{ backgroundColor: "#dc2626" }}
              >
                Delete Account
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteForm(false);
                  setConfirmText("");
                  setReason("");
                }}
                className="px-4 py-2 text-sm font-medium rounded-md border"
                style={{ borderColor: "#E8E8E8", color: "#7A7A7A" }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
