"use client";

import { AccountTab } from "@/components/settings/account-tab";
import { useToast } from "@/components/dashboard/toast-provider";

export default function AccountPage() {
  const { addToast } = useToast();
  return (
    <AccountTab
      hasPassword={true}
      connectedAccounts={[]}
      onChangePassword={(data) => addToast("info", "Password change coming soon")}
      onDisconnectAccount={(provider) => addToast("info", `${provider} disconnect coming soon`)}
    />
  );
}
