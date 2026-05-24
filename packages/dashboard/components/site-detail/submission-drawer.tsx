"use client";

import { useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";

export interface FormSubmissionData {
  id: string;
  formBlockId: string;
  siteId: string;
  data: Record<string, string>;
  sourceUrl: string | null;
  ip: string | null;
  isRead: boolean;
  isSpam: boolean;
  isArchived: boolean;
  createdAt: Date;
  formBlock: { name: string };
}

interface SubmissionDrawerProps {
  open: boolean;
  onClose: () => void;
  submission: FormSubmissionData | null;
  onUpdate: (
    id: string,
    data: Partial<{ isRead: boolean; isSpam: boolean; isArchived: boolean }>,
  ) => void;
  onDelete?: (id: string) => void;
}

function maskIp(ip: string | null): string {
  if (!ip) return "Unknown";
  const parts = ip.split(".");
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.xxx`;
  }
  return ip;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SubmissionDrawer({
  open,
  onClose,
  submission,
  onUpdate,
  onDelete,
}: SubmissionDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onClose]);

  if (!open || !submission) return null;

  const fields = Object.entries(submission.data);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative flex h-full w-[480px] max-w-full flex-col bg-white shadow-xl"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--color-border-default)" }}
        >
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Submission Details
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* Form Fields */}
          <div className="space-y-4">
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Form Data
            </h3>
            {fields.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                No fields submitted.
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map(([key, value]) => (
                  <div key={key}>
                    <p
                      className="text-xs font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {key}
                    </p>
                    <p
                      className="mt-0.5 text-sm break-words"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {String(value) || "\u2014"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <div
            className="mt-6 border-t pt-5 space-y-3"
            style={{ borderColor: "var(--color-bg-subtle)" }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Metadata
            </h3>
            <MetaRow label="Submitted" value={formatDate(submission.createdAt)} />
            <MetaRow label="Form" value={submission.formBlock.name} />
            <MetaRow
              label="Source URL"
              value={submission.sourceUrl ?? "Unknown"}
            />
            <MetaRow label="IP Address" value={maskIp(submission.ip)} />
          </div>

          {/* Toggles */}
          <div
            className="mt-6 border-t pt-5 space-y-3"
            style={{ borderColor: "var(--color-bg-subtle)" }}
          >
            <h3
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Status
            </h3>
            <ToggleRow
              label="Read"
              checked={submission.isRead}
              onChange={(v) => onUpdate(submission.id, { isRead: v })}
            />
            <ToggleRow
              label="Spam"
              checked={submission.isSpam}
              onChange={(v) => onUpdate(submission.id, { isSpam: v })}
            />
            <ToggleRow
              label="Archived"
              checked={submission.isArchived}
              onChange={(v) => onUpdate(submission.id, { isArchived: v })}
            />
          </div>
        </div>

        {/* Delete Button */}
        {onDelete && (
          <div
            className="border-t px-6 py-4"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <button
              onClick={() => onDelete(submission.id)}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <Trash2 className="h-4 w-4" />
              Delete Submission
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs font-medium shrink-0" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p
        className="text-xs text-right break-words"
        style={{ color: "var(--color-text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </span>
      <button
        onClick={() => onChange(!checked)}
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ backgroundColor: checked ? "var(--color-primary)" : "var(--color-border-default)" }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
        />
      </button>
    </div>
  );
}
