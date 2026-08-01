"use client";

import { useState } from "react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";
import { Button, Modal } from "@/components/dashboard/primitives";

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin", description: "Can manage everything except billing" },
  { value: "EDITOR", label: "Content editor", description: "Can edit content on sites they have access to" },
  { value: "DESIGNER", label: "Designer", description: "Can edit design & layout on sites they have access to" },
  { value: "VIEWER", label: "Viewer", description: "Can only view published sites" },
] as const;

export type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

type SiteAccessMode = "all" | "specific";

interface InviteSubmitData {
  emails: string[];
  role: RoleValue;
  siteIds?: string[];
  message?: string;
}

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InviteSubmitData) => void;
  isLoading?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function InviteModal({ open, onClose, onSubmit, isLoading }: InviteModalProps) {
  const [emailsRaw, setEmailsRaw] = useState("");
  const [role, setRole] = useState<RoleValue>("EDITOR");
  const [message, setMessage] = useState("");
  const [accessMode, setAccessMode] = useState<SiteAccessMode>("all");
  const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(new Set());

  const sitesQuery = trpc.sites.list.useQuery(
    { page: 1, perPage: 50 },
    { enabled: open }
  );

  const emails = parseEmails(emailsRaw);
  const validCount = emails.length;
  const tooMany = validCount > 10;
  const invalidEmails = emails.filter((e) => !EMAIL_RE.test(e));
  const hasInvalid = invalidEmails.length > 0;
  // "Specific sites" with nothing selected is an invalid restriction (it used to
  // silently grant ALL sites). Block it here and on the server.
  const specificEmpty = accessMode === "specific" && selectedSiteIds.size === 0;

  function toggleSite(siteId: string) {
    setSelectedSiteIds((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooMany || validCount === 0 || hasInvalid || specificEmpty) return;
    onSubmit({
      emails,
      role,
      siteIds: accessMode === "specific" ? Array.from(selectedSiteIds) : undefined,
      message: message.trim() || undefined,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Invite Team Members"
      width={512}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            form="invite-modal-form"
            disabled={validCount === 0 || tooMany || hasInvalid || specificEmpty || isLoading}
            className="flex-1"
          >
            {isLoading
              ? "Sending..."
              : validCount > 1
              ? `Send ${validCount} Invitations`
              : "Send Invitation"}
          </Button>
        </>
      }
    >
      <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
        Add up to 10 email addresses separated by commas or new lines.
      </p>

      <form id="invite-modal-form" onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Email input */}
          <div>
            <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
              Email addresses
            </label>
            <textarea
              rows={4}
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder={"alice@example.com\nbob@example.com"}
              className={cn(
                "w-full resize-none rounded-lg border px-3 py-2.5 text-body outline-none transition-colors focus:border-[var(--color-primary)]",
                tooMany || hasInvalid ? "border-[var(--color-error)]" : "border-[var(--color-border-default)]"
              )}
              style={{ color: "var(--color-text-primary)" }}
            />
            {tooMany && (
              <p className="mt-1 text-body-sm" style={{ color: "var(--color-error-text)" }}>
                Maximum 10 emails allowed. You have {validCount}.
              </p>
            )}
            {hasInvalid && !tooMany && (
              <p className="mt-1 text-body-sm" style={{ color: "var(--color-error-text)" }}>
                Invalid: {invalidEmails.join(", ")}
              </p>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
              Role
            </label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    role === opt.value ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)]" : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)]"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={() => setRole(opt.value)}
                    className="mt-0.5 accent-[var(--color-primary)]"
                  />
                  <div>
                    <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {opt.label}
                    </p>
                    <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Site access */}
          <div>
            <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
              Site Access
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccessMode("all")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-body font-medium transition-colors",
                  accessMode === "all"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                    : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)]"
                )}
                style={accessMode !== "all" ? { color: "var(--color-text-primary)" } : undefined}
              >
                All sites
              </button>
              <button
                type="button"
                onClick={() => setAccessMode("specific")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-body font-medium transition-colors",
                  accessMode === "specific"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                    : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)]"
                )}
                style={accessMode !== "specific" ? { color: "var(--color-text-primary)" } : undefined}
              >
                Specific sites
              </button>
            </div>

            {accessMode === "specific" && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border-default)] p-2">
                {sitesQuery.isLoading && (
                  <p className="py-3 text-center text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Loading sites...</p>
                )}
                {sitesQuery.data && sitesQuery.data.data.length === 0 && (
                  <p className="py-3 text-center text-body-sm" style={{ color: "var(--color-text-secondary)" }}>No sites found.</p>
                )}
                {sitesQuery.data?.data.map((site: { id: string; name: string }) => (
                  <label
                    key={site.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[var(--color-bg-subtle)]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.has(site.id)}
                      onChange={() => toggleSite(site.id)}
                      className="accent-[var(--color-primary)]"
                    />
                    <span className="text-body" style={{ color: "var(--color-text-primary)" }}>{site.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Personal message */}
          <div>
            <label className="mb-1.5 block text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
              Personal message{" "}
              <span className="font-normal" style={{ color: "var(--color-text-muted)" }}>
                (optional)
              </span>
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              placeholder="Add a note to your invitation..."
              className="w-full resize-none rounded-lg border border-[var(--color-border-default)] px-3 py-2.5 text-body outline-none transition-colors focus:border-[var(--color-primary)]"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>

      </form>
    </Modal>
  );
}
