"use client";

import { signIn } from "next-auth/react";
import { trpc } from "@lib/trpc/client";
import { AccountTab } from "@/components/settings/account-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function AccountPage() {
  const { addToast } = useToast();
  const profileQuery = trpc.account.profile.get.useQuery();

  const changePasswordMutation = trpc.account.changePassword.useMutation({
    onSuccess: () => addToast("success", "Password changed successfully"),
    onError: (err) => addToast("error", "Password change failed", err.message),
  });

  const setPasswordMutation = trpc.account.setPassword.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Password set — you can now sign in with email"); },
    onError: (err) => addToast("error", "Couldn't set password", err.message),
  });

  const changeEmailMutation = trpc.account.changeEmail.useMutation({
    onSuccess: () => addToast("success", "Confirmation link sent — check your new inbox to finish the switch"),
    onError: (err) => addToast("error", "Couldn't change email", err.message),
  });

  const disconnectMutation = trpc.account.disconnectProvider.useMutation({
    onSuccess: () => { profileQuery.refetch(); addToast("success", "Account disconnected"); },
    onError: (err) => addToast("error", "Could not disconnect", err.message),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        ))}
      </div>
    );
  }

  return (
    <AccountTab
      email={profileQuery.data?.email ?? ""}
      hasPassword={profileQuery.data?.hasPassword ?? false}
      connectedAccounts={profileQuery.data?.connectedAccounts ?? []}
      onChangePassword={(data) =>
        changePasswordMutation.mutate({ ...data, confirmPassword: data.newPassword })
      }
      onSetPassword={(data) => setPasswordMutation.mutate({ newPassword: data.newPassword })}
      onChangeEmail={(data) => changeEmailMutation.mutateAsync(data)}
      onConnectAccount={(provider) =>
        signIn(provider, { callbackUrl: "/dashboard/settings/account" })
      }
      onDisconnectAccount={(provider) => disconnectMutation.mutate({ provider })}
      saving={changePasswordMutation.isPending || setPasswordMutation.isPending || changeEmailMutation.isPending || disconnectMutation.isPending}
    />
  );
}
