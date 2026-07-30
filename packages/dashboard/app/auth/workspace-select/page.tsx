"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronRight, Loader2 } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { trpc } from "@lib/trpc/client";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Content editor",
  DESIGNER: "Designer",
  VIEWER: "Viewer",
};

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/** "Owner · Just you · 1 site" — listUserWorkspaces now returns siteCount too. */
function meta(role: string, memberCount: number, siteCount: number) {
  const who = memberCount === 1 ? "Just you" : `${memberCount} members`;
  const sites = `${siteCount} ${siteCount === 1 ? "site" : "sites"}`;
  return `${ROLE_LABELS[role] ?? role} · ${who} · ${sites}`;
}

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { update } = useSession();
  const workspacesQuery = trpc.account.workspace.listMine.useQuery();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const select = async (workspaceId: string) => {
    setSwitchingId(workspaceId);
    await update({ workspaceId });
    router.push("/dashboard");
    router.refresh();
  };

  const workspaces = workspacesQuery.data ?? [];

  return (
    <AuthCard>
      <div className="text-center">
        <h1 className="text-auth-title text-auth-text-primary">Choose a workspace</h1>
        <p className="text-auth-subtitle text-auth-text-muted mt-2">
          You belong to more than one workspace. Pick where to continue.
        </p>
      </div>

      <div className="h-5" />

      {workspacesQuery.isLoading ? (
        <div className="flex w-full flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-auth-input bg-auth-btn-secondary" />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <p className="text-center text-auth-subtitle text-auth-text-muted">
          You&apos;re not a member of any workspace yet.
        </p>
      ) : (
        <div className="flex w-full flex-col gap-2.5">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => select(ws.id)}
              disabled={!!switchingId}
              className="flex w-full items-center gap-3 rounded-auth-input border border-[#E5E7EB] bg-white px-[15px] py-[13px] text-left transition-colors hover:border-auth-text-body disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-auth-cta text-[15px] font-bold tracking-[-0.02em] text-white">
                {ws.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ws.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(ws.name)
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-auth-input font-semibold text-auth-text-primary">{ws.name}</span>
                <span className="text-auth-fine text-auth-text-muted">{meta(ws.role, ws.memberCount, ws.siteCount)}</span>
              </span>
              {switchingId === ws.id ? (
                <Loader2 className="h-[18px] w-[18px] shrink-0 animate-spin text-auth-cta" />
              ) : (
                <ChevronRight size={18} strokeWidth={1.7} className="shrink-0 text-auth-text-placeholder" />
              )}
            </button>
          ))}
        </div>
      )}

      <div className="h-3.5" />

      <p className="text-center text-auth-input text-auth-text-muted">
        Need a new one?{" "}
        <Link href="/auth/workspace-setup" className="font-semibold text-auth-text-body hover:underline">
          Create a workspace
        </Link>
      </p>
    </AuthCard>
  );
}
