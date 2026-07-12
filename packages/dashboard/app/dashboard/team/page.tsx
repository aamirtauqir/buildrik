"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { MembersTable } from "@/components/team/members-table";
import { InviteModal } from "@/components/team/invite-modal";
import { PendingInvites } from "@/components/team/pending-invites";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { ErrorState } from "@/components/states";
import { PageHeader, StatCard, MetricValue } from "@/components/dashboard/primitives";
import { UserPlus } from "lucide-react";

const TEAM_DESCRIPTION = "Manage who can access and edit your workspace.";

export default function TeamPage() {
  const { data: session } = useSession();
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
    onError: (err) => addToast("error", "Failed to revoke", err.message),
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
    onError: (err) => addToast("error", "Failed to revoke invitation", err.message),
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
  const isError = statsQuery.isError || membersQuery.isError;
  const isEmpty = (statsQuery.data?.total ?? 0) <= 1;
  const currentUserId = session?.user?.id ?? "";

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Team" description={TEAM_DESCRIPTION} />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
      </div>
    );
  }

  // Without this, a failed stats/list query left data undefined → isEmpty true →
  // the "invite your first member" empty state showed on a real error.
  if (isError) {
    return (
      <div>
        <PageHeader title="Team" description={TEAM_DESCRIPTION} />
        <ErrorState
          title="Couldn't load your team"
          description="Something went wrong on our end."
          onRetry={() => {
            statsQuery.refetch();
            membersQuery.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Team"
        description={TEAM_DESCRIPTION}
        actions={
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        }
      />

      {isEmpty ? (
        <TeamEmptyState onInvite={() => setInviteOpen(true)} />
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          {statsQuery.data && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Total Members" value={<MetricValue>{statsQuery.data.total}</MetricValue>} />
              <StatCard label="Active" value={<MetricValue>{statsQuery.data.active}</MetricValue>} />
              <StatCard label="Pending Invitations" value={<MetricValue>{statsQuery.data.pending}</MetricValue>} />
            </div>
          )}

          {/* Members Table */}
          {membersQuery.data && (
            <MembersTable
              members={membersQuery.data.data}
              currentUserId={currentUserId}
              onAction={handleMemberAction}
              onChangeRole={(memberId, role) =>
                changeRoleMutation.mutate({ memberId, role: role as "ADMIN" | "EDITOR" | "VIEWER" })
              }
            />
          )}

          {/* Pending Invites */}
          {pendingQuery.data && pendingQuery.data.length > 0 && (
            <div>
              <h2 className="mb-3 text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>Pending Invitations</h2>
              <PendingInvites
                invites={pendingQuery.data}
                onRevoke={(inviteId) => revokeInviteMutation.mutate({ inviteId })}
                onResend={(inviteId) => resendInviteMutation.mutate({ inviteId })}
              />
            </div>
          )}

          {/* Team Activity */}
          <div className="rounded-xl border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
            <h3 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Team Activity</h3>
            {activityQuery.data && activityQuery.data.length > 0 ? (
              <div className="space-y-3">
                {activityQuery.data.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                    <div>
                      <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                        {entry.actorName && (
                          <span className="font-medium">{entry.actorName} </span>
                        )}
                        {entry.description ?? entry.action}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>No team activity yet</p>
            )}
          </div>
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
            siteIds: data.siteIds,
            message: data.message,
          })
        }
        isLoading={inviteMutation.isPending}
      />
    </div>
  );
}
