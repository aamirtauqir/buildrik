"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { roleLabel } from "@lib/constants/enums";

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);

  const inviteQuery = trpc.auth.getInviteDetails.useQuery({ token }, { enabled: !!token });

  const acceptMutation = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => router.push("/dashboard"),
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/auth?returnUrl=${encodeURIComponent(`/auth/invite?token=${token}`)}`);
        return;
      }
      setError(err.message);
    },
  });

  const declineMutation = trpc.auth.declineInvite.useMutation({
    onSuccess: () => router.push("/auth"),
    onError: (err) => setError(err.message),
  });

  const inviteExpired = inviteQuery.data?.found ? inviteQuery.data.expired : false;
  useEffect(() => {
    if (inviteExpired) router.push("/auth/error/invite-expired");
  }, [inviteExpired, router]);

  if (inviteQuery.isLoading) {
    return <AuthMessage title="Loading invitation…" />;
  }

  if (!inviteQuery.data?.found) {
    return (
      <AuthMessage
        title="Invitation not found"
        subtitle="This invite link is invalid or has been revoked."
      >
        <Link href="/auth" className="text-auth-label text-auth-link hover:underline text-center">
          Back to log in
        </Link>
      </AuthMessage>
    );
  }

  const invite = inviteQuery.data;

  if (invite.expired) {
    // Redirect handled by the effect above; render nothing meanwhile.
    return null;
  }

  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-[12px] bg-auth-cta text-lg font-bold text-white">
          {invite.workspaceIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invite.workspaceIconUrl} alt={invite.workspaceName} className="h-full w-full object-cover" />
          ) : (
            invite.workspaceName.charAt(0).toUpperCase()
          )}
        </span>
        <h1 className="text-auth-title text-auth-text-primary mt-4">You&apos;ve been invited</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          Join <span className="text-auth-text-secondary font-medium">{invite.workspaceName}</span> as {roleLabel(invite.role)}.
        </p>
        <p className="text-auth-fine text-auth-text-muted mt-1">Invited by {invite.inviterName}</p>
      </div>

      <div className="h-6" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      <div className="w-full flex flex-col gap-3">
        <AuthButton loading={acceptMutation.isPending} onClick={() => acceptMutation.mutate({ token })}>
          Accept invitation
        </AuthButton>
        <AuthButton
          variant="secondary"
          disabled={declineMutation.isPending}
          onClick={() => declineMutation.mutate({ token })}
        >
          Decline
        </AuthButton>
      </div>
    </AuthCard>
  );
}

export default function InvitePage() {
  return <Suspense fallback={null}><InviteContent /></Suspense>;
}
