"use client";

import { trpc } from "@/lib/trpc/client";
import { AccountTab } from "@/components/settings/account-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function AccountPage() {
  const { addToast } = useToast();

  const changePasswordMutation = trpc.account.changePassword.useMutation({
    onSuccess: () => addToast("success", "Password changed successfully"),
    onError: (err) => addToast("error", "Password change failed", err.message),
  });

  return (
    <AccountTab
      hasPassword={true}
      connectedAccounts={[]}
      onChangePassword={(data) => changePasswordMutation.mutate({ ...data, confirmPassword: data.newPassword })}
      onDisconnectAccount={(provider) => addToast("info", `${provider} disconnect coming soon`)}
    />
  );
}
