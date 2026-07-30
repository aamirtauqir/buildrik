"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AlertCircle, CheckCircle, MinusCircle } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthButton } from "@/components/auth/auth-button";
import { FormBanner } from "@/components/auth/form-banner";
import { trpc } from "@lib/trpc/client";
import { roleLabel } from "@lib/constants/enums";

/**
 * Every state the backend already distinguishes gets its own designed screen.
 * `acceptInvite` throws CONFLICT (already a member), FORBIDDEN (invite is bound
 * to another email) and UNAUTHORIZED (no session) — these used to collapse into
 * one generic error banner. Decline is irreversible (the invite row flips to
 * DECLINED), so it now goes through a confirm step.
 */
type View =
  | "invite"
  | "signin-required"
  | "decline-confirm"
  | "declined"
  | "wrong-account"
  | "already-member"
  | "accepted";

function withArticle(label: string) {
  return `${/^[aeiou]/i.test(label) ? "an" : "a"} ${label}`;
}

function StatusView({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[#F5F5F6]">{icon}</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-auth-title text-auth-text-primary">{title}</h1>
          <p className="text-auth-subtitle text-auth-text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="h-5" />
      <div className="w-full flex flex-col gap-3">{children}</div>
    </AuthCard>
  );
}

function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  // Set by /auth/join-workspace after it signs the invitee up, logs them in and
  // accepts on their behalf. It needs a hard navigation (fresh session cookie),
  // so the success screen is carried across in the URL rather than in state.
  const justAccepted = searchParams.get("accepted") === "1";
  const { data: session, status } = useSession();
  const sessionEmail = session?.user?.email ?? "";

  const [view, setView] = useState<View | null>(justAccepted ? "accepted" : null);
  const [error, setError] = useState<string | null>(null);

  const inviteQuery = trpc.auth.getInviteDetails.useQuery({ token }, { enabled: !!token });
  const inviteUrl = `/auth/invite?token=${encodeURIComponent(token)}`;

  const acceptMutation = trpc.auth.acceptInvite.useMutation({
    onSuccess: () => setView("accepted"),
    onError: (err) => {
      const code = err.data?.code;
      if (code === "CONFLICT") return setView("already-member");
      if (code === "FORBIDDEN") return setView("wrong-account");
      if (code === "UNAUTHORIZED") return setView("signin-required");
      if (code === "NOT_FOUND") return router.push("/auth/error/invite-expired");
      setError(err.message);
    },
  });

  const declineMutation = trpc.auth.declineInvite.useMutation({
    onSuccess: () => setView("declined"),
    onError: (err) => {
      setError(err.message);
      setView("invite");
    },
  });

  const effectiveView: View = view ?? (status === "authenticated" ? "invite" : "signin-required");

  // Only bounce to the expired screen while the invite is still actionable —
  // once it has been accepted or declined the row is no longer PENDING, so a
  // refetch would otherwise yank the user off their own result screen.
  const actionable =
    effectiveView === "invite" ||
    effectiveView === "signin-required" ||
    effectiveView === "decline-confirm";
  const expired = inviteQuery.data?.found ? inviteQuery.data.expired : false;
  useEffect(() => {
    if (actionable && expired) router.push("/auth/error/invite-expired");
  }, [actionable, expired, router]);

  if (inviteQuery.isLoading || status === "loading") {
    return <AuthMessage title="Loading invitation…" />;
  }

  if (!inviteQuery.data?.found) {
    return (
      <AuthMessage
        title="Invitation not found"
        subtitle="This invite link is invalid or has been revoked."
      >
        <Link href="/auth" className="w-full">
          <AuthButton variant="secondary" type="button">Back to log in</AuthButton>
        </Link>
      </AuthMessage>
    );
  }

  const invite = inviteQuery.data;
  const role = withArticle(roleLabel(invite.role));

  if (actionable && invite.expired) {
    // Redirect handled by the effect above; render nothing meanwhile.
    return null;
  }

  if (effectiveView === "accepted") {
    return (
      <StatusView
        icon={<CheckCircle className="h-7 w-7 text-[#12805C]" strokeWidth={1.9} />}
        title="You're in!"
        subtitle={`Welcome to ${invite.workspaceName}. You've joined as ${role} — start building client sites.`}
      >
        <AuthButton onClick={() => router.push("/dashboard")}>Go to dashboard</AuthButton>
      </StatusView>
    );
  }

  if (effectiveView === "already-member") {
    return (
      <StatusView
        icon={<CheckCircle className="h-[26px] w-[26px] text-auth-text-body" strokeWidth={1.9} />}
        title="You're already a member"
        subtitle={`You've already accepted this invitation and joined ${invite.workspaceName}. Head to your dashboard.`}
      >
        <AuthButton onClick={() => router.push("/dashboard")}>Go to dashboard</AuthButton>
      </StatusView>
    );
  }

  if (effectiveView === "wrong-account") {
    return (
      <StatusView
        icon={<AlertCircle className="h-[26px] w-[26px] text-[#C27803]" strokeWidth={1.7} />}
        title="This invite is for another email"
        subtitle={
          <>
            You&apos;re logged in as {sessionEmail || "another account"}, but this invitation was sent
            to {invite.email}. Switch accounts to accept.
          </>
        }
      >
        <AuthButton
          onClick={async () => {
            try {
              await fetch("/api/auth/logout", { method: "POST" });
            } catch {
              // best-effort: send them to log in regardless
            }
            window.location.assign(`/auth?returnUrl=${encodeURIComponent(inviteUrl)}`);
          }}
        >
          Switch account
        </AuthButton>
        <AuthButton variant="secondary" onClick={() => setView("invite")}>
          View invitation
        </AuthButton>
      </StatusView>
    );
  }

  if (effectiveView === "declined") {
    return (
      <StatusView
        icon={<MinusCircle className="h-[26px] w-[26px] text-auth-text-muted" strokeWidth={1.7} />}
        title="Invitation declined"
        subtitle={`You've declined the invitation to ${invite.workspaceName}. You can still create your own workspace anytime.`}
      >
        <AuthButton onClick={() => router.push("/auth/signup")}>Create my own workspace</AuthButton>
        <Link href="/auth" className="w-full">
          <AuthButton variant="secondary" type="button">Back to log in</AuthButton>
        </Link>
      </StatusView>
    );
  }

  if (effectiveView === "decline-confirm") {
    return (
      <StatusView
        icon={<AlertCircle className="h-[26px] w-[26px] text-[#C27803]" strokeWidth={1.7} />}
        title="Decline this invitation?"
        subtitle="You can always ask the workspace owner to invite you again later."
      >
        <AuthButton
          loading={declineMutation.isPending}
          onClick={() => declineMutation.mutate({ token })}
          className="border border-[#E5484D]/50 bg-white text-[#E5484D] hover:bg-[#E5484D]/5"
        >
          Yes, decline
        </AuthButton>
        <AuthButton variant="secondary" disabled={declineMutation.isPending} onClick={() => setView("invite")}>
          Keep it
        </AuthButton>
      </StatusView>
    );
  }

  // "invite" and "signin-required" share the workspace header — the difference
  // is whether we can act on the invite (accept needs a session).
  return (
    <AuthCard>
      <div className="flex flex-col items-center text-center gap-[14px]">
        <span className="flex h-[52px] w-[52px] items-center justify-center overflow-hidden rounded-[13px] bg-auth-cta text-[19px] font-bold tracking-[-0.02em] text-white">
          {invite.workspaceIconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={invite.workspaceIconUrl} alt={invite.workspaceName} className="h-full w-full object-cover" />
          ) : (
            invite.workspaceName.charAt(0).toUpperCase()
          )}
        </span>
        <div className="flex flex-col gap-2">
          <h1 className="text-auth-title text-auth-text-primary">Join {invite.workspaceName}</h1>
          <p className="text-auth-subtitle text-auth-text-muted">
            {invite.inviterName} invited you to collaborate as {role}.
          </p>
        </div>
      </div>

      <div className="h-5" />

      {error && (
        <>
          <FormBanner variant="error" title={error} />
          <div className="h-4" />
        </>
      )}

      {effectiveView === "signin-required" ? (
        <div className="w-full flex flex-col gap-3">
          <Link href={`/auth?returnUrl=${encodeURIComponent(inviteUrl)}`} className="w-full">
            <AuthButton type="button">Log in to accept</AuthButton>
          </Link>
          <Link href={`/auth/join-workspace?token=${encodeURIComponent(token)}`} className="w-full">
            <AuthButton variant="secondary" type="button">Create an account</AuthButton>
          </Link>
        </div>
      ) : (
        <div className="w-full flex gap-3">
          <AuthButton
            className="flex-1"
            loading={acceptMutation.isPending}
            onClick={() => {
              setError(null);
              acceptMutation.mutate({ token });
            }}
          >
            Accept invitation
          </AuthButton>
          <AuthButton
            variant="secondary"
            className="w-auto px-[22px]"
            disabled={acceptMutation.isPending}
            onClick={() => setView("decline-confirm")}
          >
            Decline
          </AuthButton>
        </div>
      )}
    </AuthCard>
  );
}

export default function InvitePage() {
  return <Suspense fallback={null}><InviteContent /></Suspense>;
}
