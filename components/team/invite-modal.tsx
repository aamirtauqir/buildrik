"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const ROLE_OPTIONS = [
  { value: "ADMIN", label: "Admin", description: "Can manage everything except billing" },
  { value: "EDITOR", label: "Editor", description: "Can edit sites they have access to" },
  { value: "VIEWER", label: "Viewer", description: "Can only view published sites" },
] as const;

export type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (emails: string[], role: RoleValue, message?: string) => void;
  loading?: boolean;
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((e) => e.trim())
    .filter(Boolean);
}

export function InviteModal({ open, onClose, onSubmit, loading }: InviteModalProps) {
  const [emailsRaw, setEmailsRaw] = useState("");
  const [role, setRole] = useState<RoleValue>("EDITOR");
  const [message, setMessage] = useState("");

  if (!open) return null;

  const emails = parseEmails(emailsRaw);
  const validCount = emails.length;
  const tooMany = validCount > 10;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tooMany || validCount === 0) return;
    onSubmit(emails, role, message.trim() || undefined);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#E8E8E8] bg-white p-6 shadow-2xl">
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
                tooMany ? "border-[#E42313]" : "border-[#E8E8E8]"
              )}
              style={{ color: "#0D0D0D" }}
            />
            {tooMany && (
              <p className="mt-1 text-xs" style={{ color: "#E42313" }}>
                Maximum 10 emails allowed. You have {validCount}.
              </p>
            )}
          </div>

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
              placeholder="Add a note to your invitation…"
              className="w-full resize-none rounded-lg border border-[#E8E8E8] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[#E42313]"
              style={{ color: "#0D0D0D" }}
            />
          </div>

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
              disabled={validCount === 0 || tooMany || loading}
              className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#E42313" }}
            >
              {loading
                ? "Sending…"
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
