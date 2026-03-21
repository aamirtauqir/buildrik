"use client";

import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthIcon } from "@/components/auth/auth-icon";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthButtonSecondary } from "@/components/auth/auth-button-secondary";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const acceptInviteMutation = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => {
      router.push("/dashboard");
    },
  });

  const declineInviteMutation = trpc.auth.declineInvite.useMutation({
    onSuccess: () => {
      router.push("/auth/login");
    },
  });

  return (
    <AuthCard>
      <AuthLogo />
      <AuthIcon name="mail" color="blue" />
      <h1 className="text-auth-title font-semibold text-center">You've been invited</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center">
        Join the team and start collaborating
      </p>
      <div className="h-6" />
      <div className="bg-gray-50 rounded-lg p-4 w-full">
        <p className="font-bold">Acme Corp</p>
        <p className="text-sm text-gray-600">Invited by John Doe</p>
        <span className="inline-block mt-2 bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-medium">
          Editor
        </span>
      </div>
      <div className="h-6" />
      <AuthButton
        loading={acceptInviteMutation.isPending}
        onClick={() => acceptInviteMutation.mutate({ token: token || "" })}
      >
        Accept Invite
      </AuthButton>
      <div className="h-3" />
      <AuthButtonSecondary
        disabled={declineInviteMutation.isPending}
        onClick={() => declineInviteMutation.mutate({ token: token || "" })}
      >
        Decline
      </AuthButtonSecondary>
      <div className="h-4" />
      <Link href="/auth/login" className="text-auth-link text-sm hover:underline">
        ← Back to sign in
      </Link>
    </AuthCard>
  );
}
