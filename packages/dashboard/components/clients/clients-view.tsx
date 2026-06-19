"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase, Plus, Pencil, Trash2, X } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { StateEmpty, LoadingSkeleton, ErrorState, DeniedState } from "@/components/states";

interface ClientRow {
  id: string;
  name: string;
  brandColor: string | null;
  siteCount: number;
}

// Single name dialog reused for create + rename (the only field that needs
// input at this stage; branding/white-label lands in E2-T5).
function NameDialog({
  title,
  initial,
  submitLabel,
  onClose,
  onSubmit,
}: {
  title: string;
  initial: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const trimmed = name.trim();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "#0000004D" }}
      onClick={onClose}
    >
      <div className="w-[400px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Client name"
          className="mt-4 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: "var(--color-border-default)" }}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed) onSubmit(trimmed);
          }}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={() => trimmed && onSubmit(trimmed)}
            disabled={!trimmed}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteDialog({
  client,
  onClose,
  onConfirm,
}: {
  client: ClientRow;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "#0000004D" }}
      onClick={onClose}
    >
      <div className="w-[420px] rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
          Delete {client.name}?
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Its {client.siteCount} {client.siteCount === 1 ? "site" : "sites"} become unassigned, not deleted.
          You can reassign them to another client later.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Delete client
          </button>
        </div>
      </div>
    </div>
  );
}

export function ClientsView() {
  const { addToast } = useToast();
  // clients.list returns [] both when the agency_layer flag is off AND when it's
  // on with zero clients — the flag disambiguates so a solo workspace gets a
  // boundary (DeniedState) instead of a misleading "create your first client".
  const featuresQuery = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agencyEnabled = featuresQuery.data?.agency_layer ?? false;
  const clientsQuery = trpc.clients.list.useQuery(undefined, { enabled: agencyEnabled });
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<ClientRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ClientRow | null>(null);

  const createMut = trpc.clients.create.useMutation({
    onSuccess: () => {
      addToast("success", "Client created");
      setCreating(false);
      clientsQuery.refetch();
    },
    onError: (err) => addToast("error", "Failed to create client", err.message),
  });
  const updateMut = trpc.clients.update.useMutation({
    onSuccess: () => {
      addToast("success", "Client renamed");
      setRenaming(null);
      clientsQuery.refetch();
    },
    onError: (err) => addToast("error", "Failed to rename", err.message),
  });
  const deleteMut = trpc.clients.delete.useMutation({
    onSuccess: () => {
      addToast("success", "Client deleted — its sites are now unassigned");
      setConfirmDelete(null);
      clientsQuery.refetch();
    },
    onError: (err) => addToast("error", "Failed to delete", err.message),
  });

  const clients = (clientsQuery.data ?? []) as ClientRow[];

  return (
    <div>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>Clients</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Group sites by the client they belong to.
          </p>
        </div>
        {agencyEnabled && clients.length > 0 && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <Plus className="h-4 w-4" />
            New client
          </button>
        )}
      </header>

      {featuresQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="card" />
      ) : !agencyEnabled ? (
        <DeniedState
          title="Agency features aren't enabled"
          description="Clients group sites per customer with white-label branding. Ask a workspace admin to enable the agency layer."
          action={{ label: "Back to sites", href: "/dashboard/sites" }}
        />
      ) : clientsQuery.isLoading ? (
        <LoadingSkeleton rows={3} variant="card" />
      ) : clientsQuery.isError ? (
        <ErrorState
          title="Couldn't load your clients"
          description="Something went wrong on our end."
          onRetry={() => clientsQuery.refetch()}
        />
      ) : clients.length === 0 ? (
        <StateEmpty
          icon={<Briefcase className="h-7 w-7" />}
          title="No clients yet"
          description="Create a client to group its sites, brand them, and invite the client to edit content."
          action={{ label: "+ New client", onClick: () => setCreating(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => (
            <div
              key={c.id}
              className="group rounded-xl border bg-white p-4 transition-shadow hover:shadow-sm"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div className="flex items-start justify-between">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: c.brandColor ?? "var(--color-primary)" }}
                >
                  {c.name.slice(0, 2).toUpperCase()}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => setRenaming(c)}
                    aria-label="Rename client"
                    className="rounded p-1.5 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <Pencil className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(c)}
                    aria-label="Delete client"
                    className="rounded p-1.5 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" style={{ color: "var(--color-text-secondary)" }} />
                  </button>
                </div>
              </div>
              <Link href={`/dashboard/clients/${c.id}`} className="mt-3 block">
                <h3 className="text-sm font-semibold hover:underline" style={{ color: "var(--color-text-primary)" }}>{c.name}</h3>
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  {c.siteCount} {c.siteCount === 1 ? "site" : "sites"}
                </p>
              </Link>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <NameDialog
          title="New client"
          initial=""
          submitLabel="Create"
          onClose={() => setCreating(false)}
          onSubmit={(name) => createMut.mutate({ name })}
        />
      )}
      {renaming && (
        <NameDialog
          title="Rename client"
          initial={renaming.name}
          submitLabel="Save"
          onClose={() => setRenaming(null)}
          onSubmit={(name) => updateMut.mutate({ id: renaming.id, name })}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteDialog
          client={confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => deleteMut.mutate({ id: confirmDelete.id })}
        />
      )}
    </div>
  );
}
