"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin", description: "Can manage everything except billing" },
  { value: "EDITOR", label: "Editor", description: "Can edit sites they have access to" },
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
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded p-1 hover:bg-[#F4F4F4]"
          aria-label="Close"
        >
          <X className="h-4 w-4" style={{ color: "#7A7A7A" }} />
        </button>

        <h2 className="text-lg font-semibold" style={{ color: "#0D0D0D" }}>
          Invite Team Members
        </h2>
        <p className="mt-1 text-sm" style={{ color: "#7A7A7A" }}>
          Add up to 10 email addresses separated by commas or new lines.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Email input */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
              Email addresses
            </label>
            <textarea
              rows={4}
              value={emailsRaw}
              onChange={(e) => setEmailsRaw(e.target.value)}
              placeholder={"alice@example.com\nbob@example.com"}
              className={cn(
                "w-full resize-none rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#E42313]",
                tooMany || hasInvalid ? "border-[#E42313]" : "border-[#E8E8E8]"
              )}
              style={{ color: "#0D0D0D" }}
            />
            {tooMany && (
              <p className="mt-1 text-xs" style={{ color: "#E42313" }}>
                Maximum 10 emails allowed. You have {validCount}.
              </p>
            )}
            {hasInvalid && !tooMany && (
              <p className="mt-1 text-xs" style={{ color: "#E42313" }}>
                Invalid: {invalidEmails.join(", ")}
              </p>
            )}
          </div>

          {/* Role selector */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
              Role
            </label>
            <div className="flex flex-col gap-2">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                    role === opt.value ? "border-[#E42313] bg-red-50" : "border-[#E8E8E8] hover:bg-[#F4F4F4]"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={() => setRole(opt.value)}
                    className="mt-0.5 accent-[#E42313]"
                  />
                  <div>
                    <p className="text-sm font-medium" style={{ color: "#0D0D0D" }}>
                      {opt.label}
                    </p>
                    <p className="text-xs" style={{ color: "#7A7A7A" }}>
                      {opt.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Site access */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
              Site Access
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAccessMode("all")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  accessMode === "all"
                    ? "border-[#E42313] bg-red-50 text-[#E42313]"
                    : "border-[#E8E8E8] hover:bg-[#F4F4F4]"
                )}
                style={accessMode !== "all" ? { color: "#0D0D0D" } : undefined}
              >
                All sites
              </button>
              <button
                type="button"
                onClick={() => setAccessMode("specific")}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  accessMode === "specific"
                    ? "border-[#E42313] bg-red-50 text-[#E42313]"
                    : "border-[#E8E8E8] hover:bg-[#F4F4F4]"
                )}
                style={accessMode !== "specific" ? { color: "#0D0D0D" } : undefined}
              >
                Specific sites
              </button>
            </div>

            {accessMode === "specific" && (
              <div className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-[#E8E8E8] p-2">
                {sitesQuery.isLoading && (
                  <p className="py-3 text-center text-xs" style={{ color: "#7A7A7A" }}>Loading sites...</p>
                )}
                {sitesQuery.data && sitesQuery.data.data.length === 0 && (
                  <p className="py-3 text-center text-xs" style={{ color: "#7A7A7A" }}>No sites found.</p>
                )}
                {sitesQuery.data?.data.map((site: { id: string; name: string }) => (
                  <label
                    key={site.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors hover:bg-[#F4F4F4]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.has(site.id)}
                      onChange={() => toggleSite(site.id)}
                      className="accent-[#E42313]"
                    />
                    <span className="text-sm" style={{ color: "#0D0D0D" }}>{site.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Personal message */}
          <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: "#0D0D0D" }}>
              Personal message{" "}
              <span className="font-normal" style={{ color: "#B0B0B0" }}>
                (optional)
              </span>
            </label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              placeholder="Add a note to your invitation..."
              className="w-full resize-none rounded-lg border border-[#E8E8E8] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#E42313]"
              style={{ color: "#0D0D0D" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#E8E8E8] py-2.5 text-sm font-medium transition-colors hover:bg-[#F4F4F4]"
              style={{ color: "#7A7A7A" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={validCount === 0 || tooMany || hasInvalid || isLoading}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#E42313" }}
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
