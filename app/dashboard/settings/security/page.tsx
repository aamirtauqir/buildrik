"use client";

import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { SecurityTab } from "@/components/settings/security-tab";

export default function SecurityPage() {
  const { addToast } = useToast();
  const sessionsQuery = trpc.account.sessions.list.useQuery();
  const historyQuery = trpc.account.loginHistory.useQuery();

  const revokeMutation = trpc.account.sessions.revoke.useMutation({
    onSuccess: () => { sessionsQuery.refetch(); addToast("success", "Session revoked"); },
  });
  const revokeAllMutation = trpc.account.sessions.revokeAll.useMutation({
    onSuccess: () => { sessionsQuery.refetch(); addToast("success", "All other sessions revoked"); },
  });

  if (sessionsQuery.isLoading) return <div className="h-64 animate-pulse rounded-xl" style={{ backgroundColor: "#F4F4F4" }} />;

  return (
    <SecurityTab
      twoFactorEnabled={false}
      sessions={sessionsQuery.data ?? []}
      loginHistory={historyQuery.data ?? []}
      onToggle2FA={() => addToast("info", "2FA setup modal is not yet implemented — see PRD ACCT-3 for the 3-step flow")}
      onRevokeSession={(id) => revokeMutation.mutate({ sessionId: id })}
      onRevokeAllSessions={(currentId) => revokeAllMutation.mutate({ currentSessionId: currentId })}
    />
  );
}
