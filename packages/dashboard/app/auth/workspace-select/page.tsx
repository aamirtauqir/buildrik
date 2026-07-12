"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Check } from "lucide-react";
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
          You belong to more than one workspace. Pick which to work in.
        </p>
      </div>

      <div className="h-6" />

      {workspacesQuery.isLoading ? (
        <div className="flex w-full flex-col gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[68px] animate-pulse rounded-auth-input bg-auth-input-fill" />)}
        </div>
      ) : workspaces.length === 0 ? (
        <p className="text-center text-auth-subtitle text-auth-text-muted">You&apos;re not a member of any workspace yet.</p>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => select(ws.id)}
              disabled={!!switchingId}
              className="flex w-full items-center gap-3 rounded-auth-input border border-auth-input-fill-border p-3.5 text-left transition-colors hover:bg-auth-input-fill disabled:opacity-60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-auth-cta text-sm font-bold text-white">
                {ws.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ws.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(ws.name)
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-auth-label font-semibold text-auth-text-primary">{ws.name}</span>
                <span className="block text-auth-fine text-auth-text-muted">
                  {ROLE_LABELS[ws.role] ?? ws.role} · {ws.memberCount} member{ws.memberCount === 1 ? "" : "s"}
                </span>
              </span>
              {switchingId === ws.id && <Check className="h-4 w-4 shrink-0 text-auth-cta" />}
            </button>
          ))}
        </div>
      )}

      <div className="h-4" />
      <button
        onClick={() => router.push("/auth/workspace-setup")}
        className="flex w-full items-center justify-center gap-1.5 text-auth-label text-auth-link text-center hover:underline"
      >
        <Plus className="h-4 w-4" />
        Create new workspace
      </button>
    </AuthCard>
  );
}
