"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Check } from "lucide-react";
import { AuthLogo } from "@/components/auth/auth-logo";
import { AuthCard } from "@/components/auth/auth-card";
import { trpc } from "@lib/trpc/client";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  EDITOR: "Content editor",
  DESIGNER: "Designer",
  VIEWER: "Viewer",
};

export default function WorkspaceSelectPage() {
  const router = useRouter();
  const { update } = useSession();
  const workspacesQuery = trpc.account.workspace.listMine.useQuery();
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const select = async (workspaceId: string) => {
    setSwitchingId(workspaceId);
    // Persist the active workspace into the session (jwt callback validates the
    // membership), then land on the dashboard for that workspace.
    await update({ workspaceId });
    router.push("/dashboard");
    router.refresh();
  };

  const workspaces = workspacesQuery.data ?? [];

  return (
    <AuthCard>
      <AuthLogo />
      <h1 className="text-auth-title font-semibold text-center">Choose a workspace</h1>
      <p className="text-auth-subtitle text-auth-text-muted text-center">
        Pick which workspace to work in.
      </p>
      <div className="h-6" />

      {workspacesQuery.isLoading ? (
        <div className="flex w-full flex-col gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />)}
        </div>
      ) : workspaces.length === 0 ? (
        <p className="text-center text-sm text-gray-500">You&apos;re not a member of any workspace yet.</p>
      ) : (
        <div className="flex w-full flex-col gap-3">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => select(ws.id)}
              disabled={!!switchingId}
              className="flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-gray-50 disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 text-sm font-semibold text-gray-600">
                {ws.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ws.iconUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  ws.name.charAt(0).toUpperCase()
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{ws.name}</span>
                <span className="block text-sm text-gray-500">
                  {ROLE_LABELS[ws.role] ?? ws.role} · {ws.memberCount} member{ws.memberCount === 1 ? "" : "s"}
                </span>
              </span>
              {switchingId === ws.id && <Check className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />}
            </button>
          ))}
        </div>
      )}

      <div className="h-4" />
      <button
        onClick={() => router.push("/onboarding/setup")}
        className="flex w-full items-center justify-center gap-1.5 text-auth-link text-center hover:underline"
      >
        <Plus className="h-4 w-4" />
        Create new workspace
      </button>
    </AuthCard>
  );
}
