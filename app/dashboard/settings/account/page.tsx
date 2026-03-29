"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { AccountTab } from "@/components/settings/account-tab";
import { useToast } from "@/components/dashboard/toast-provider";

const LINK_ERROR_MESSAGES: Record<string, string> = {
  invalid_token: "Link request expired or invalid. Please try again.",
  email_mismatch: "The provider email doesn't match your account email.",
  email_not_verified: "Provider didn't confirm your email. Try a different account.",
  already_linked: "That provider is already connected to an account.",
  server_error: "Something went wrong. Please try again.",
};

export default function AccountPage() {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [connectingProvider, setConnectingProvider] = useState<"google" | "github" | null>(null);

  // Handle OAuth redirect result — ?linked= (success) or ?link_error= (failure)
  useEffect(() => {
    const linked = searchParams.get("linked");
    const linkError = searchParams.get("link_error");
    if (linked) {
      addToast("success", `${linked === "google" ? "Google" : "GitHub"} connected successfully`);
      window.history.replaceState({}, "", "/dashboard/settings/account");
    } else if (linkError) {
      addToast("error", "Could not connect provider", LINK_ERROR_MESSAGES[linkError] ?? "Unknown error");
      window.history.replaceState({}, "", "/dashboard/settings/account");
    }
  }, [searchParams, addToast]);

  const linkedProvidersQuery = trpc.account.linkedProviders.useQuery();
  const connectedAccounts = (linkedProvidersQuery.data ?? []) as {
    provider: "google" | "github";
    createdAt: Date | string;
  }[];

  const changePasswordMutation = trpc.account.changePassword.useMutation({
    onSuccess: () => addToast("success", "Password changed successfully"),
    onError: (err) => addToast("error", "Password change failed", err.message),
  });

  const initiateLinkingMutation = trpc.account.initiateLinking.useMutation({
    onError: (err) => {
      setConnectingProvider(null);
      addToast("error", "Could not initiate connection", err.message);
    },
  });

  const unlinkMutation = trpc.account.unlinkProvider.useMutation({
    onSuccess: () => {
      linkedProvidersQuery.refetch();
      addToast("success", "Provider disconnected");
    },
    onError: (err) => addToast("error", "Could not disconnect provider", err.message),
  });

  async function handleConnect(provider: "google" | "github") {
    setConnectingProvider(provider);
    try {
      const { linkToken } = await initiateLinkingMutation.mutateAsync({ provider });
      // Navigate the browser to the initiate route — it sets the HttpOnly cookie
      // and redirects into the OAuth flow. On return, ?linked= or ?link_error=
      // params trigger the useEffect above.
      window.location.href = `/api/account/link/initiate?token=${encodeURIComponent(linkToken)}&provider=${provider}`;
    } catch {
      setConnectingProvider(null);
    }
  }

  return (
    <AccountTab
      connectedAccounts={connectedAccounts}
      connectingProvider={connectingProvider}
      onConnectAccount={handleConnect}
      onChangePassword={(data) =>
        changePasswordMutation.mutate({ ...data, confirmPassword: data.newPassword })
      }
      onDisconnectAccount={(provider) => unlinkMutation.mutate({ provider })}
    />
  );
}
