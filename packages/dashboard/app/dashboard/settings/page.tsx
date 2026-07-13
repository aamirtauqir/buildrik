"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@server/trpc/router";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { PageHeader, SectionCard } from "@/components/dashboard/primitives";
import { AICreditsTab } from "@/components/settings/ai-credits-tab";
import { WorkspaceForm } from "@/components/settings/workspace-form";
import { ProfileForm } from "@/components/settings/profile-form";
import { AccountTab } from "@/components/settings/account-tab";
import { SecurityTab } from "@/components/settings/security-tab";
import { NotificationPrefs } from "@/components/settings/notification-prefs";
import { ApiTokensTab } from "@/components/settings/api-tokens-tab";
import { DangerZoneTab } from "@/components/settings/danger-zone-tab";
import { DeleteWorkspaceModal } from "@/components/settings/delete-workspace-modal";

/** Consolidated General settings: one stacked-card page that reuses every
 *  per-tab form + its existing tRPC handlers. Replaces the old tabbed layout —
 *  the /settings/* sub-routes still resolve for deep links. */
export default function GeneralSettingsPage() {
  const { addToast } = useToast();
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState("");

  // --- Profile + account (shared profile query) ---
  const profileQuery = trpc.account.profile.get.useQuery();
  const profileUpdate = trpc.account.profile.update.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Profile updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });
  const changePassword = trpc.account.changePassword.useMutation({
    onSuccess: () => addToast("success", "Password changed successfully"),
    onError: (err) => addToast("error", "Password change failed", err.message),
  });
  const setPassword = trpc.account.setPassword.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Password set — you can now sign in with email"); },
    onError: (err) => addToast("error", "Couldn't set password", err.message),
  });
  const changeEmail = trpc.account.changeEmail.useMutation({
    onSuccess: () => addToast("success", "Confirmation link sent — check your new inbox to finish the switch"),
    onError: (err) => addToast("error", "Couldn't change email", err.message),
  });
  const disconnect = trpc.account.disconnectProvider.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Account disconnected"); },
    onError: (err) => addToast("error", "Could not disconnect", err.message),
  });

  // --- Workspace (shared workspace query drives API tokens too) ---
  const wsQuery = trpc.account.workspace.get.useQuery();
  const pendingTransferQuery = trpc.account.workspace.transfer.pending.useQuery();
  const initiateTransfer = trpc.account.workspace.transfer.initiate.useMutation({
    onSuccess: () => {
      setTransferEmail("");
      pendingTransferQuery.refetch();
      addToast("success", "Transfer invitation sent — the new owner must accept it by email");
    },
    onError: (err) => addToast("error", "Couldn't start transfer", err.message),
  });
  const cancelTransfer = trpc.account.workspace.transfer.cancel.useMutation({
    onSuccess: () => { pendingTransferQuery.refetch(); addToast("success", "Transfer cancelled"); },
    onError: (err) => addToast("error", "Couldn't cancel transfer", err.message),
  });
  const wsUpdate = trpc.account.workspace.update.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Workspace updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });
  const wsDelete = trpc.account.workspace.delete.useMutation({
    onSuccess: () => {
      addToast("success", "Workspace deleted");
      setShowDeleteModal(false);
      router.push("/dashboard");
      router.refresh();
    },
    onError: (err) => addToast("error", "Could not delete workspace", err.message),
  });
  const wsSharing = trpc.account.workspace.sharing.useMutation({
    onSuccess: () => { wsQuery.refetch(); addToast("success", "Sharing settings updated"); },
    onError: (err) => addToast("error", "Failed", err.message),
  });

  // --- AI credits ---
  const creditsQuery = trpc.account.aiCredits.useQuery();

  // --- Account-level danger zone ---
  const exportData = trpc.account.dangerZone.exportData.useMutation({
    onSuccess: () => addToast("success", "Data export started. You'll be notified when ready."),
    onError: (err) => addToast("error", "Export failed", err.message),
  });
  const deleteAccount = trpc.account.dangerZone.deleteAccount.useMutation({
    onSuccess: () => addToast("info", "Account deletion scheduled. You have 30 days to cancel."),
    onError: (err) => addToast("error", "Failed", err.message),
  });

  const isLoading = profileQuery.isLoading || wsQuery.isLoading;

  return (
    <div className="mx-auto max-w-[680px]">
      <PageHeader title="General settings" description="Workspace name, branding, and defaults." />

      {isLoading || !profileQuery.data || !wsQuery.data ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
      ) : (
        <SettingsStack
          profile={profileQuery.data}
          workspace={wsQuery.data}
          credits={creditsQuery.data}
          pendingTransfer={pendingTransferQuery.data ?? null}
          transferEmail={transferEmail}
          setTransferEmail={setTransferEmail}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          addToast={addToast}
          handlers={{
            profileUpdate,
            changePassword,
            setPassword,
            changeEmail,
            disconnect,
            wsUpdate,
            wsSharing,
            wsDelete,
            initiateTransfer,
            cancelTransfer,
            exportData,
            deleteAccount,
          }}
        />
      )}
    </div>
  );
}

// tRPC hook ReturnType loses the query generic (collapses to {}), so derive the
// payload shapes from the router itself.
type RouterOutputs = inferRouterOutputs<AppRouter>;
type ProfileData = NonNullable<RouterOutputs["account"]["profile"]["get"]>;
type WorkspaceData = NonNullable<RouterOutputs["account"]["workspace"]["get"]>;
type CreditsData = RouterOutputs["account"]["aiCredits"] | undefined;
type PendingTransfer = NonNullable<RouterOutputs["account"]["workspace"]["transfer"]["pending"]>;

interface StackHandlers {
  profileUpdate: ReturnType<typeof trpc.account.profile.update.useMutation>;
  changePassword: ReturnType<typeof trpc.account.changePassword.useMutation>;
  setPassword: ReturnType<typeof trpc.account.setPassword.useMutation>;
  changeEmail: ReturnType<typeof trpc.account.changeEmail.useMutation>;
  disconnect: ReturnType<typeof trpc.account.disconnectProvider.useMutation>;
  wsUpdate: ReturnType<typeof trpc.account.workspace.update.useMutation>;
  wsSharing: ReturnType<typeof trpc.account.workspace.sharing.useMutation>;
  wsDelete: ReturnType<typeof trpc.account.workspace.delete.useMutation>;
  initiateTransfer: ReturnType<typeof trpc.account.workspace.transfer.initiate.useMutation>;
  cancelTransfer: ReturnType<typeof trpc.account.workspace.transfer.cancel.useMutation>;
  exportData: ReturnType<typeof trpc.account.dangerZone.exportData.useMutation>;
  deleteAccount: ReturnType<typeof trpc.account.dangerZone.deleteAccount.useMutation>;
}

function SettingsStack({
  profile,
  workspace,
  credits,
  pendingTransfer,
  transferEmail,
  setTransferEmail,
  showDeleteModal,
  setShowDeleteModal,
  addToast,
  handlers,
}: {
  profile: ProfileData;
  workspace: WorkspaceData;
  credits: CreditsData;
  pendingTransfer: PendingTransfer | null;
  transferEmail: string;
  setTransferEmail: (v: string) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (v: boolean) => void;
  addToast: (type: "success" | "error" | "info", title: string, description?: string) => void;
  handlers: StackHandlers;
}) {
  const workspaceName = workspace.name ?? "";

  return (
    <div className="space-y-4">
      {/* 1. AI credits */}
      <AICreditsTab used={credits?.used} limit={credits?.limit} history={credits?.history} />

      {/* 2 + 3. Workspace + Branding */}
      <WorkspaceForm
        initialData={{
          name: workspace.name ?? undefined,
          slug: workspace.slug ?? undefined,
          defaultLanguage: workspace.defaultLanguage ?? undefined,
          timezone: workspace.timezone ?? undefined,
          iconUrl: workspace.iconUrl,
          accentColor: workspace.accentColor ?? undefined,
          editsRequireApproval: workspace.editsRequireApproval ?? false,
          defaultExpiration: workspace.sharingSettings?.defaultExpiration ?? null,
          requirePw: workspace.sharingSettings?.requirePw ?? false,
          allowEditors: workspace.sharingSettings?.allowEditors ?? false,
          notify: workspace.sharingSettings?.notify ?? true,
        }}
        onSave={(data) => handlers.wsUpdate.mutate(data)}
        onSaveSharing={(data) => handlers.wsSharing.mutate(data)}
        saving={handlers.wsUpdate.isPending || handlers.wsSharing.isPending}
      />

      {/* Profile (kept — identity content the workspace cards don't cover) */}
      <SectionCard title="Profile">
        <ProfileForm
          initialData={{
            fullName: profile.fullName,
            email: profile.email,
            bio: profile.bio ?? undefined,
            language: profile.language,
            timezone: profile.timezone,
            displayName: profile.displayName ?? undefined,
            avatarUrl: profile.avatar ?? undefined,
          }}
          onSave={(data) => handlers.profileUpdate.mutate(data)}
          saving={handlers.profileUpdate.isPending}
        />
      </SectionCard>

      {/* Account: password / email / connected accounts (self-carded) */}
      <AccountTab
        email={profile.email ?? ""}
        hasPassword={profile.hasPassword ?? false}
        connectedAccounts={profile.connectedAccounts ?? []}
        onChangePassword={(data) => handlers.changePassword.mutate({ ...data, confirmPassword: data.newPassword })}
        onSetPassword={(data) => handlers.setPassword.mutate({ newPassword: data.newPassword })}
        onChangeEmail={(data) => handlers.changeEmail.mutateAsync(data)}
        onConnectAccount={(provider) => signIn(provider, { callbackUrl: "/dashboard/settings" })}
        onDisconnectAccount={(provider) => handlers.disconnect.mutate({ provider })}
        saving={
          handlers.changePassword.isPending ||
          handlers.setPassword.isPending ||
          handlers.changeEmail.isPending ||
          handlers.disconnect.isPending
        }
      />

      {/* 4. Security */}
      <SectionCard title="Security" description="Two-factor, active sessions, and login history.">
        <SecurityTab />
      </SectionCard>

      {/* 5. Notifications */}
      <SectionCard title="Notifications" description="Choose what reaches you in-app and by email.">
        <NotificationPrefs />
      </SectionCard>

      {/* 6. API tokens (self-headed) */}
      <SectionCard>
        <ApiTokensTab workspaceId={workspace.id} />
      </SectionCard>

      {/* Transfer ownership (kept) */}
      <SectionCard title="Transfer ownership" description="Hand this workspace to another person. They become the owner once they accept the email invitation; you stay on as a member.">
        {pendingTransfer ? (
          <div className="rounded-lg border p-4 flex items-center justify-between" style={{ borderColor: "var(--color-border-default)" }}>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                Transfer pending to {pendingTransfer.toEmail}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                Waiting for them to accept the email invitation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handlers.cancelTransfer.mutate()}
              disabled={handlers.cancelTransfer.isPending}
              className="text-sm px-3 py-2 rounded-md border disabled:opacity-60"
              style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
            >
              {handlers.cancelTransfer.isPending ? "Cancelling…" : "Cancel transfer"}
            </button>
          </div>
        ) : (
          <form
            className="flex items-end gap-2 max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              const email = transferEmail.trim().toLowerCase();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                addToast("error", "Enter a valid email address");
                return;
              }
              handlers.initiateTransfer.mutate({ toEmail: email });
            }}
          >
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--color-text-primary)" }}>
                New owner&apos;s email
              </label>
              <input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                required
                placeholder="owner@example.com"
                className="w-full px-3 py-2 text-sm rounded-md border outline-none"
                style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-primary)" }}
              />
            </div>
            <button
              type="submit"
              disabled={handlers.initiateTransfer.isPending}
              className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-60 whitespace-nowrap"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {handlers.initiateTransfer.isPending ? "Sending…" : "Transfer"}
            </button>
          </form>
        )}
      </SectionCard>

      {/* 7. Danger — delete workspace (danger-subtle card) */}
      <SectionCard className="!border-[var(--color-error)]">
        <div className="flex items-center justify-between gap-4 rounded-lg p-4" style={{ backgroundColor: "var(--color-error-subtle)" }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-error)" }}>
              Delete workspace
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-secondary)" }}>
              Permanently delete this workspace and all its data. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="text-sm font-medium px-4 py-2 rounded-md border shrink-0"
            style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
          >
            Delete workspace
          </button>
        </div>
      </SectionCard>

      {/* Account-level danger: export + delete account (kept) */}
      <DangerZoneTab
        onExport={() => handlers.exportData.mutate()}
        onDelete={(reason) => handlers.deleteAccount.mutate({ reason })}
        isExporting={handlers.exportData.isPending}
        estimatedSize="~2 MB"
      />

      {showDeleteModal && (
        <DeleteWorkspaceModal
          workspaceName={workspaceName}
          onConfirm={() => handlers.wsDelete.mutate({ confirmName: workspaceName })}
          onClose={() => setShowDeleteModal(false)}
          deleting={handlers.wsDelete.isPending}
        />
      )}
    </div>
  );
}
