"use client";

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
      hasPassword={profileQuery.data?.hasPassword ?? false}
      connectedAccounts={profileQuery.data?.connectedAccounts ?? []}
      onChangePassword={(data) =>
        changePasswordMutation.mutate({ ...data, confirmPassword: data.newPassword })
      }
      onDisconnectAccount={() =>
        addToast("info", "Account unlinking coming soon")
      }
      saving={changePasswordMutation.isPending}
    />
  );
}
