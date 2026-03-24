"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { TeamStatCards } from "@/components/team/stat-cards";
import { MembersTable } from "@/components/team/members-table";
import { InviteModal } from "@/components/team/invite-modal";
import { PendingInvites } from "@/components/team/pending-invites";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { UserPlus } from "lucide-react";

export default function TeamPage() {
  const { addToast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);

  // Queries
  const statsQuery = trpc.team.stats.useQuery();
  const membersQuery = trpc.team.list.useQuery({ page: 1, perPage: 20 });
  const pendingQuery = trpc.team.pendingInvites.useQuery();
  const activityQuery = trpc.team.activity.useQuery();

  // Mutations
  const inviteMutation = trpc.team.invite.useMutation({
    onSuccess: (result) => {
      membersQuery.refetch();
      pendingQuery.refetch();
      statsQuery.refetch();
      setInviteOpen(false);
      addToast("success", `${result.sent} invitation${result.sent > 1 ? "s" : ""} sent`);
    },
    onError: (err) => addToast("error", "Failed to invite", err.message),
  });

  const changeRoleMutation = trpc.team.changeRole.useMutation({
    onSuccess: () => {
      membersQuery.refetch();
      addToast("success", "Role updated");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const revokeMutation = trpc.team.revoke.useMutation({
    onSuccess: () => {
      membersQuery.refetch();
      statsQuery.refetch();
      addToast("success", "Access revoked");
    },
  });

  const deleteMutation = trpc.team.delete.useMutation({
    onSuccess: () => {
      membersQuery.refetch();
      statsQuery.refetch();
      addToast("success", "Member removed");
    },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const revokeInviteMutation = trpc.team.revokeInvite.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      statsQuery.refetch();
      addToast("success", "Invitation revoked");
    },
  });

  const resendInviteMutation = trpc.team.resendInvite.useMutation({
    onSuccess: () => {
      pendingQuery.refetch();
      addToast("success", "Invitation resent");
    },
    onError: (err) => addToast("error", "Failed to resend", err.message),
  });

  const handleMemberAction = useCallback(
    (action: string, memberId: string) => {
      switch (action) {
        case "revoke":
          revokeMutation.mutate({ memberId });
          break;
        case "delete":
          deleteMutation.mutate({ memberId });
          break;
      }
    },
    [revokeMutation, deleteMutation]
  );

  const isLoading = statsQuery.isLoading || membersQuery.isLoading;
  const isEmpty = (statsQuery.data?.total ?? 0) <= 1;

  if (isLoading) {
    return (
      <div>
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Team</h1>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-bold" style={{ color: "#0D0D0D" }}>Team</h1>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: "#E42313" }}
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {isEmpty ? (
        <div className="mt-8">
          <TeamEmptyState onInvite={() => setInviteOpen(true)} />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {/* Stats */}
          {statsQuery.data && <TeamStatCards stats={statsQuery.data} />}

          {/* Members Table */}
          {membersQuery.data && (
            <MembersTable
              members={membersQuery.data.data}
              onAction={handleMemberAction}
              onChangeRole={(memberId, role) =>
                changeRoleMutation.mutate({ memberId, role: role as "ADMIN" | "EDITOR" | "VIEWER" })
              }
            />
          )}

          {/* Pending Invites */}
          {pendingQuery.data && pendingQuery.data.length > 0 && (
            <PendingInvites
              invites={pendingQuery.data}
              onRevoke={(inviteId) => revokeInviteMutation.mutate({ inviteId })}
              onResend={(inviteId) => resendInviteMutation.mutate({ inviteId })}
            />
          )}

          {/* Team Activity */}
          {activityQuery.data && activityQuery.data.length > 0 && (
            <div className="rounded-xl border bg-white p-5" style={{ borderColor: "#E8E8E8" }}>
              <h3 className="mb-3 text-sm font-semibold" style={{ color: "#0D0D0D" }}>Team Activity</h3>
              <div className="space-y-3">
                {activityQuery.data.map((entry: { id: string; action: string; description: string | null; createdAt: Date }) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "#E42313" }} />
                    <div>
                      <p className="text-sm" style={{ color: "#0D0D0D" }}>{entry.description ?? entry.action}</p>
                      <p className="text-xs" style={{ color: "#B0B0B0" }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onSubmit={(data) =>
          inviteMutation.mutate({
            emails: data.emails,
            role: data.role as "ADMIN" | "EDITOR" | "VIEWER",
            message: data.message,
          })
        }
        isLoading={inviteMutation.isPending}
      />
    </div>
  );
}
