"use client";

import { useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { ToggleSwitch } from "flowbite-react";
import { Button } from "@/components/dashboard/primitives";

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
  // onClose arrives as an inline arrow from the panel that also owns the
  // drawer's state, so its identity changes on every toggle and refetch. Read
  // it through a ref: with onClose in the dep array the trap tore down and
  // re-ran on each re-render, restoring focus to the row behind the scrim and
  // then yanking it back — the user lost their place after every switch.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Same dialog contract as primitives/Modal: Escape closes, Tab is trapped in
  // the panel, and focus returns to the opener on close.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    function focusables(): HTMLElement[] {
      const panel = drawerRef.current;
      if (!panel) return [];
      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.offsetParent !== null);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); drawerRef.current?.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === drawerRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    const panel = drawerRef.current;
    if (panel && !panel.contains(document.activeElement)) panel.focus();
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open || !submission) return null;

  const fields = Object.entries(submission.data);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(18, 22, 32, 0.45)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Submission details"
        tabIndex={-1}
        className="relative flex h-full w-[480px] max-w-full flex-col bg-white shadow-xl outline-none"
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
              className="text-body-sm font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Form Data
            </h3>
            {fields.length === 0 ? (
              <p className="text-body" style={{ color: "var(--color-text-muted)" }}>
                No fields submitted.
              </p>
            ) : (
              <div className="space-y-3">
                {fields.map(([key, value]) => (
                  <div key={key}>
                    <p
                      className="text-body-sm font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {key}
                    </p>
                    <p
                      className="mt-0.5 text-body break-words"
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
              className="text-body-sm font-semibold uppercase tracking-wider"
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
              className="text-body-sm font-semibold uppercase tracking-wider"
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
            <Button onClick={() => onDelete(submission.id)} className="w-full">
              <Trash2 className="h-4 w-4" />
              Delete Submission
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-body-sm font-medium shrink-0" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </p>
      <p
        className="text-body-sm text-right break-words"
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
      <span className="text-body" style={{ color: "var(--color-text-primary)" }}>
        {label}
      </span>
      <ToggleSwitch checked={checked} onChange={onChange} aria-label={label} />
    </div>
  );
}
