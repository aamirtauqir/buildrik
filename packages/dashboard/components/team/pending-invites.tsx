"use client";

import { cn } from "@lib/utils";
import { roleLabel } from "@lib/constants/enums";
import { Pill, MetricValue, type PillTone } from "@/components/dashboard/primitives";

type Role = "ADMIN" | "EDITOR" | "VIEWER";

export interface PendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  resendCount: number;
  [key: string]: unknown;
}

const ROLE_TONE: Record<Role, PillTone> = {
  ADMIN: "accent",
  EDITOR: "success",
  VIEWER: "neutral",
};

const MAX_RESENDS = 2;

function daysUntil(date: Date): number {
  return Math.max(0, Math.ceil((new Date(date).getTime() - Date.now()) / 86400000));
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface PendingInvitesProps {
  invites: PendingInvite[];
  onResend: (inviteId: string) => void;
  onRevoke: (inviteId: string) => void;
  resendingId?: string | null;
  revokingId?: string | null;
}

export function PendingInvites({ invites, onResend, onRevoke, resendingId, revokingId }: PendingInvitesProps) {
  if (invites.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--color-border-default)] bg-white px-6 py-10 text-center">
        <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>No pending invitations.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--color-border-default)] bg-white">
      <table className="w-full text-body">
        <thead>
          <tr className="border-b border-[var(--color-border-default)]" style={{ backgroundColor: "var(--color-bg-page)" }}>
            {["Email", "Role", "Sent", "Expires In", "Resends", ""].map((h) => (
              <th
                key={h}
                className={cn(
                  "px-4 py-3 text-body-sm font-semibold uppercase tracking-wide",
                  h === "" ? "text-right" : "text-left"
                )}
                style={{ color: "var(--color-text-secondary)" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => {
            const days = daysUntil(invite.expiresAt);
            const expiringSoon = days <= 2;
            const resendDisabled = invite.resendCount >= MAX_RESENDS;

            return (
              <tr key={invite.id} className="border-b border-[var(--color-border-default)] transition-colors last:border-0 hover:bg-[var(--color-bg-page)]">
                <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {invite.email}
                </td>
                <td className="px-4 py-3">
                  <Pill tone={ROLE_TONE[invite.role as Role] ?? "neutral"}>{roleLabel(invite.role)}</Pill>
                </td>
                <td className="px-4 py-3 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  <MetricValue>{formatDate(invite.createdAt)}</MetricValue>
                </td>
                <td className="px-4 py-3 text-body-sm font-medium" style={{ color: expiringSoon ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                  {days === 0 ? "Expires today" : <>Expires in <MetricValue>{days}d</MetricValue></>}
                </td>
                <td className="px-4 py-3 text-body-sm" style={{ color: resendDisabled ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                  Resent <MetricValue>{invite.resendCount}/{MAX_RESENDS}</MetricValue> times
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onResend(invite.id)}
                      disabled={!!resendingId || resendDisabled}
                      className="rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 text-body-sm font-medium transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
                      style={{ color: "var(--color-text-primary)" }}
                      title={resendDisabled ? "Maximum resends reached" : undefined}
                    >
                      {resendingId === invite.id ? "Sending..." : "Resend"}
                    </button>
                    <button
                      onClick={() => onRevoke(invite.id)}
                      disabled={!!revokingId}
                      className="rounded-lg border px-3 py-1.5 text-body-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                      style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
                    >
                      {revokingId === invite.id ? "Revoking..." : "Revoke"}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
