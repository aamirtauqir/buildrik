"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthButtonSecondary } from "@/components/auth/auth-button-secondary";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { roleLabel } from "@lib/constants/enums";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const inviteQuery = trpc.auth.getInviteDetails.useQuery(
    { token },
    { enabled: !!token },
  );

  const acceptMutation = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/auth/login?returnUrl=${encodeURIComponent(`/auth/invite?token=${token}`)}`);
        return;
      }
      setError(err.message);
    },
  });

  const declineMutation = trpc.auth.declineInvite.useMutation({
    onSuccess: () => router.push("/auth/login"),
    onError: (err) => setError(err.message),
  });

  if (inviteQuery.isLoading) {
    return (
      <AuthCard>
        <AuthLogo />
        <p className="text-auth-subtitle text-auth-text-muted text-center">Loading invitation...</p>
      </AuthCard>
    );
  }

  if (!inviteQuery.data?.found) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="warning" color="red" />
        <h1 className="text-auth-title text-auth-text-primary text-center">Invitation not found</h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">This invite link is invalid.</p>
        <div className="h-6" />
        <Link href="/auth/login" className="text-auth-link hover:underline">← Back to sign in</Link>
      </AuthCard>
    );
  }

  const invite = inviteQuery.data;

  if (invite.expired) {
    router.push("/auth/error/invite-expired");
    return null;
  }

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title font-semibold text-center">You&apos;ve been invited</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        Join <strong>{invite.workspaceName}</strong> as {roleLabel(invite.role)}
      </p>
      <p className="text-sm text-auth-text-muted text-center mt-1">
        Invited by {invite.inviterName}
      </p>
      <div className="h-6" />
      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}
      <AuthButton
        loading={acceptMutation.isPending}
        onClick={() => acceptMutation.mutate({ token })}
      >
        Accept Invitation
      </AuthButton>
      <div className="h-3" />
      <AuthButtonSecondary
        disabled={declineMutation.isPending}
        onClick={() => declineMutation.mutate({ token })}
      >
        Decline
      </AuthButtonSecondary>
      <div className="h-4" />
      <Link href="/auth/login" className="text-auth-link text-sm hover:underline">← Back to sign in</Link>
    </AuthCard>
  );
}

export default function InvitePage() {
  return <Suspense fallback={null}><InviteContent /></Suspense>;
}
