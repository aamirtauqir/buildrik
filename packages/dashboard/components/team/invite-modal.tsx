"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@lib/utils";
import { trpc } from "@lib/trpc/client";

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin", description: "Can manage everything except billing" },
  { value: "EDITOR", label: "Content editor", description: "Can edit content on sites they have access to" },
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

  if (!open) return null;

  const emails = parseEmails(emailsRaw);
  const validCount = emails.length;
  const tooMany = validCount > 10;
  const invalidEmails = emails.filter((e) => !EMAIL_RE.test(e));
  const hasInvalid = invalidEmails.length > 0;

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
    if (tooMany || validCount === 0 || hasInvalid) return;
    onSubmit({
      emails,
      role,
      siteIds: accessMode === "specific" ? Array.from(selectedSiteIds) : undefined,
      message: message.trim() || undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[var(--color-border-default)] bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 hover:bg-[var(--color-bg-subtle)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
        </button>

        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Invite Team Members
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Add up to 10 email addresses separated by commas or new lines.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Email input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Email addresses
            </label>
            <textarea
              rows={4}
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder={"alice@example.com\nbob@example.com"}
              className={cn(
                "w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]",
                tooMany || hasInvalid ? "border-[var(--color-primary)]" : "border-[var(--color-border-default)]"
              )}
              style={{ color: "var(--color-text-primary)" }}
            />
            {tooMany && (
              <p className="mt-1 text-xs" style={{ color: "var(--color-primary)" }}>
                Maximum 10 emails allowed. You have {validCount}.
              </p>
            )}
            {hasInvalid && !tooMany && (
              <p className="mt-1 text-xs" style={{ color: "var(--color-primary)" }}>
                Invalid: {invalidEmails.join(", ")}
              </p>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Role
            </label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    role === opt.value ? "border-[var(--color-primary)] bg-red-50" : "border-[var(--color-border-default)] hover:bg-[var(--color-bg-subtle)]"
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
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {opt.label}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Site access */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              Site Access
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccessMode("all")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  accessMode === "all"
                    ? "border-[var(--color-primary)] bg-red-50 text-[var(--color-primary)]"
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
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  accessMode === "specific"
                    ? "border-[var(--color-primary)] bg-red-50 text-[var(--color-primary)]"
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
                  <p className="py-3 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>Loading sites...</p>
                )}
                {sitesQuery.data && sitesQuery.data.data.length === 0 && (
                  <p className="py-3 text-center text-xs" style={{ color: "var(--color-text-secondary)" }}>No sites found.</p>
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
                    <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>{site.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Personal message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
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
              className="w-full resize-none rounded-lg border border-[var(--color-border-default)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-primary)]"
              style={{ color: "var(--color-text-primary)" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[var(--color-border-default)] py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-bg-subtle)]"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={validCount === 0 || tooMany || hasInvalid || isLoading}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {isLoading
                ? "Sending..."
                : validCount > 1
                ? `Send ${validCount} Invitations`
                : "Send Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
