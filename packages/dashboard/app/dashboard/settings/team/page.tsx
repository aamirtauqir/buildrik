"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { MembersTable } from "@/components/team/members-table";
import { InviteModal } from "@/components/team/invite-modal";
import { PendingInvites } from "@/components/team/pending-invites";
import { TeamEmptyState } from "@/components/team/team-empty-state";
import { ErrorState, DeniedState } from "@/components/states";
import { Button, MetricValue } from "@/components/dashboard/primitives";
import { PageHeaderActions } from "@/components/dashboard/shell/page-actions";
import { UserPlus } from "lucide-react";

export default function TeamPage() {
  const { data: session } = useSession();
  const { addToast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);

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

  const reactivateMutation = trpc.team.reactivate.useMutation({
    onSuccess: () => {
      membersQuery.refetch();
      statsQuery.refetch();
      addToast("success", "Member reactivated");
    },
    onError: (err) => addToast("error", "Failed to reactivate", err.message),
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
        case "reactivate":
          reactivateMutation.mutate({ memberId });
          break;
        case "delete":
          deleteMutation.mutate({ memberId });
          break;
      }
    },
    [revokeMutation, reactivateMutation, deleteMutation]
  );

  const isLoading = statsQuery.isLoading || membersQuery.isLoading;
  const isError = statsQuery.isError || membersQuery.isError;
  const isEmpty = (statsQuery.data?.total ?? 0) <= 1;
  const currentUserId = session?.user?.id ?? "";

  if (isLoading) {
    return <div className="h-72 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />;
  }

  // Team data is ADMIN/OWNER only — a non-admin gets FORBIDDEN, which should read
  // as "not for you", not "something broke".
  if (isError) {
    const forbidden =
      statsQuery.error?.data?.code === "FORBIDDEN" || membersQuery.error?.data?.code === "FORBIDDEN";
    if (forbidden) {
      return (
        <DeniedState
          title="Team is admin-only"
          description="Only workspace admins and owners can view and manage members."
          action={{ label: "Back to settings", href: "/dashboard/settings" }}
        />
      );
    }
    // Without this, a failed stats/list query left data undefined → isEmpty true →
    // the "invite your first member" empty state showed on a real error.
    return (
      <ErrorState
        title="Couldn't load your team"
        description="Something went wrong on our end."
        onRetry={() => {
          statsQuery.refetch();
          membersQuery.refetch();
        }}
      />
    );
  }

  return (
    <div>
      {/* The settings layout owns the section PageHeader (D10.4) — this page
          keeps only its functional actions. */}
      {/* On the layout's title row via the actions slot — see page-actions.tsx.
          This was a right-aligned band under the header, which read as a gap
          with nothing in its left half. */}
      <PageHeaderActions>
        {statsQuery.data && (
          <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            <MetricValue>{statsQuery.data.active} / {statsQuery.data.limit === -1 ? "∞" : statsQuery.data.limit}</MetricValue> seats
          </span>
        )}
        {!isEmpty && (
          /* Was hand-rolled at 38px while the identical Select/Invite pair on
             the Sites screen already used the primitive at 40px. Same active
             style override the Sites page applies. */
          <Button
            variant="ghost"
            onClick={() => setSelectMode((v) => !v)}
            style={
              selectMode
                ? { borderColor: "var(--color-primary)", color: "var(--color-primary)", backgroundColor: "var(--color-primary-subtle)" }
                : undefined
            }
          >
            Select
          </Button>
        )}
        <Button onClick={() => setInviteOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      </PageHeaderActions>

      {isEmpty ? (
        <TeamEmptyState onInvite={() => setInviteOpen(true)} />
      ) : (
        <div className="space-y-8">
          {/* Members Table */}
          {membersQuery.data && (
            <MembersTable
              members={membersQuery.data.data}
              currentUserId={currentUserId}
              onAction={handleMemberAction}
              onChangeRole={(memberId, role) =>
                changeRoleMutation.mutate({ memberId, role: role as "ADMIN" | "EDITOR" | "VIEWER" })
              }
              selectMode={selectMode}
              onExitSelectMode={() => setSelectMode(false)}
            />
          )}

          {/* Pending Invites */}
          {pendingQuery.data && pendingQuery.data.length > 0 && (
            <div>
              <h2 className="mb-3 text-section-title" style={{ color: "var(--color-text-primary)" }}>Pending invitations</h2>
              <PendingInvites
                invites={pendingQuery.data}
                onRevoke={(inviteId) => revokeInviteMutation.mutate({ inviteId })}
                onResend={(inviteId) => resendInviteMutation.mutate({ inviteId })}
              />
            </div>
          )}

          {/* Team Activity */}
          <div className="rounded-lg border bg-white p-5" style={{ borderColor: "var(--color-border-default)" }}>
            <h3 className="mb-3 text-section-title" style={{ color: "var(--color-text-primary)" }}>Team activity</h3>
            {activityQuery.data && activityQuery.data.length > 0 ? (
              <div className="space-y-3">
                {activityQuery.data.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-primary)" }} />
                    <div>
                      <p className="text-body" style={{ color: "var(--color-text-primary)" }}>
                        {entry.actorName && (
                          <span className="font-medium">{entry.actorName} </span>
                        )}
                        {entry.description ?? entry.action}
                      </p>
                      <p className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>No team activity yet</p>
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
