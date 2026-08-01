"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";

// Landing page for the workspace-transfer email invite
// (`/transfer/accept?token=…`, built by sendWSTransferInviteEmail). The
// recipient accepts here; account.workspace.transfer.accept verifies the
// token, that it hasn't expired, and that the signed-in user's email matches
// the invited address, then flips ownership.
function AcceptTransferContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const acceptMutation = trpc.account.workspace.transfer.accept.useMutation({
    onSuccess: () => setDone(true),
    onError: (err) => {
      if (err.data?.code === "UNAUTHORIZED") {
        router.push(`/auth/login?returnUrl=${encodeURIComponent(`/transfer/accept?token=${token}`)}`);
        return;
      }
      setError(err.message);
    },
  });

  if (!token) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="warning" color="red" />
        <h1 className="text-auth-title text-auth-text-primary text-center">Invalid transfer link</h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">This link is missing its token.</p>
        <div className="h-6" />
        <Link href="/dashboard" className="text-auth-link hover:underline">← Back to dashboard</Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard>
        <AuthLogo />
        <AuthIcon name="check" color="green" />
        <h1 className="text-auth-title font-semibold text-center">You&apos;re now the owner</h1>
        <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
          Ownership of the workspace has been transferred to you.
        </p>
        <div className="h-6" />
        <AuthButton onClick={() => { router.push("/dashboard"); router.refresh(); }}>
          Go to dashboard
        </AuthButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title font-semibold text-center">Accept workspace ownership</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center mt-1">
        You&apos;ve been invited to take ownership of a workspace. Accepting makes you the owner; the previous owner stays on as a member.
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
        onClick={() => { setError(null); acceptMutation.mutate({ token }); }}
      >
        Accept ownership
      </AuthButton>
      <div className="h-4" />
      <Link href="/dashboard" className="text-auth-link text-body hover:underline">← Back to dashboard</Link>
    </AuthCard>
  );
}

export default function AcceptTransferPage() {
  return <Suspense fallback={null}><AcceptTransferContent /></Suspense>;
}
