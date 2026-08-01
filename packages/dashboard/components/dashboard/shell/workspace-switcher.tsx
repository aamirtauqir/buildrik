"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { trpc } from "@lib/trpc/client";

function initials(name?: string) {
  if (!name) return "W";
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/** Workspace switcher — the first card in the sidebar: ink tile + workspace
 *  name + chevrons, opening a full-width dropdown. */
export function WorkspaceSwitcher() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const list = trpc.account.workspace.listMine.useQuery();

  const currentId = (session?.user as { workspaceId?: string | null } | undefined)?.workspaceId ?? null;
  const workspaces = list.data ?? [];
  const current = workspaces.find((w) => w.id === currentId) ?? workspaces[0];

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const switchTo = async (id: string) => {
    if (id === currentId) { setOpen(false); return; }
    setSwitching(id);
    await update({ workspaceId: id });
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors hover:bg-[var(--color-bg-subtle)]"
        style={{ borderColor: "var(--color-border-default)" }}
        aria-label="Switch workspace"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md text-body-sm font-bold text-white" style={{ backgroundColor: "var(--color-ink)" }}>{initials(current?.name)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold leading-tight" style={{ color: "var(--color-text-primary)" }}>{current?.name ?? "Workspace"}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-lg border bg-white shadow-card" style={{ borderColor: "var(--color-border-default)" }}>
          <div className="max-h-72 overflow-y-auto p-1">
            {workspaces.map((ws) => (
              <button key={ws.id} onClick={() => switchTo(ws.id)} disabled={!!switching} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-60">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-body-sm font-bold text-white" style={{ backgroundColor: "var(--color-ink)" }}>{initials(ws.name)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body font-medium" style={{ color: "var(--color-text-primary)" }}>{ws.name}</span>
                  <span className="block text-eyebrow" style={{ color: "var(--color-text-secondary)" }}>{ws.memberCount} member{ws.memberCount === 1 ? "" : "s"}</span>
                </span>
                {ws.id === currentId && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--color-primary)" }} />}
              </button>
            ))}
          </div>
          <div className="border-t p-1" style={{ borderColor: "var(--color-border-default)" }}>
            <button onClick={() => { setOpen(false); router.push("/auth/workspace-setup"); }} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-body transition-colors hover:bg-[var(--color-bg-subtle)]" style={{ color: "var(--color-text-secondary)" }}>
              <Plus className="h-4 w-4" /> Create workspace
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
