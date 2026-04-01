"use client";

import { cn } from "@lib/utils";

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

const ROLE_BADGE: Record<Role, { bg: string; color: string }> = {
  ADMIN: { bg: "#EFF6FF", color: "#3B82F6" },
  EDITOR: { bg: "#F0FDF4", color: "#22C55E" },
  VIEWER: { bg: "#F3F4F6", color: "#7A7A7A" },
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
      <div className="rounded-xl border border-[#E8E8E8] bg-white px-6 py-10 text-center">
        <p className="text-sm" style={{ color: "#7A7A7A" }}>No pending invitations.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#E8E8E8] bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E8E8E8]" style={{ backgroundColor: "#FAFAFA" }}>
            {["Email", "Role", "Sent", "Expires In", "Resends", ""].map((h) => (
              <th
                key={h}
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide",
                  h === "" ? "text-right" : "text-left"
                )}
                style={{ color: "#7A7A7A" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => {
            const badge = ROLE_BADGE[invite.role as Role] ?? ROLE_BADGE.VIEWER;
            const days = daysUntil(invite.expiresAt);
            const expiringSoon = days <= 2;
            const resendDisabled = invite.resendCount >= MAX_RESENDS;

            return (
              <tr key={invite.id} className="border-b border-[#E8E8E8] transition-colors last:border-0 hover:bg-[#FAFAFA]">
                <td className="px-4 py-3 font-medium" style={{ color: "#0D0D0D" }}>
                  {invite.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ backgroundColor: badge.bg, color: badge.color }}
                  >
                    {invite.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: "#7A7A7A" }}>
                  {formatDate(invite.createdAt)}
                </td>
                <td className="px-4 py-3 text-xs font-medium" style={{ color: expiringSoon ? "#E42313" : "#7A7A7A" }}>
                  {days === 0 ? "Expires today" : `Expires in ${days}d`}
                </td>
                <td className="px-4 py-3 text-xs" style={{ color: resendDisabled ? "#E42313" : "#7A7A7A" }}>
                  Resent {invite.resendCount}/{MAX_RESENDS} times
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onResend(invite.id)}
                      disabled={!!resendingId || resendDisabled}
                      className="rounded-lg border border-[#E8E8E8] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F4F4F4] disabled:opacity-50"
                      style={{ color: "#0D0D0D" }}
                      title={resendDisabled ? "Maximum resends reached" : undefined}
                    >
                      {resendingId === invite.id ? "Sending..." : "Resend"}
                    </button>
                    <button
                      onClick={() => onRevoke(invite.id)}
                      disabled={!!revokingId}
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                      style={{ borderColor: "#E42313", color: "#E42313" }}
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
