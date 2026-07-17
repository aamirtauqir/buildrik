"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, Pencil, Trash2, X, MoreHorizontal } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { useToast } from "@/components/dashboard/toast-provider";
import { StateEmpty, LoadingSkeleton, ErrorState, DeniedState } from "@/components/states";
import { StatCard, MetricValue, DataTable, Pill, type Column } from "@/components/dashboard/primitives";

interface ClientRow {
  id: string;
  name: string;
  brandColor: string | null;
  customDomain: string | null;
  siteCount: number;
}

// Initials-tile palette. A client's own brandColor wins when set; otherwise the
// tile cycles the design-system accent tokens so an un-branded list still reads
// as a coordinated set.
const TILE_TOKENS = ["var(--color-teal)", "var(--color-amber)", "var(--color-primary)", "var(--color-pink)"];

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
  const router = useRouter();
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
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);

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

  // Summary counts, derived from the list the view already loads (no extra tRPC).
  // The client list carries no review/sign-off state, so we report only what the
  // data supports — a client with no sites is "No sites", not "awaiting sign-off".
  const activeClients = clients.filter((c) => c.siteCount > 0).length;
  const totalSites = clients.reduce((n, c) => n + c.siteCount, 0);
  const withoutSites = clients.filter((c) => c.siteCount === 0).length;

  const tileColor = new Map(
    clients.map((c, i) => [c.id, c.brandColor ?? TILE_TOKENS[i % TILE_TOKENS.length]] as const),
  );

  const columns: Column<ClientRow>[] = [
    {
      key: "name",
      header: "Client",
      render: (c) => (
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-eyebrow font-semibold text-white"
            style={{ backgroundColor: tileColor.get(c.id) }}
          >
            {c.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{c.name}</span>
        </div>
      ),
    },
    {
      key: "sites",
      header: "Sites",
      render: (c) => (
        <span>
          <MetricValue>{c.siteCount}</MetricValue>{" "}
          <span className="text-body-sm" style={{ color: "var(--color-text-muted)" }}>
            {c.siteCount === 1 ? "site" : "sites"}
          </span>
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (c) =>
        c.customDomain ? (
          <span style={{ color: "var(--color-text-secondary)" }}>{c.customDomain}</span>
        ) : (
          <span style={{ color: "var(--color-text-muted)" }}>—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (c) =>
        c.siteCount > 0 ? <Pill tone="success">Active</Pill> : <Pill tone="neutral">No sites</Pill>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <button
          type="button"
          aria-label="Client actions"
          onClick={(e) => {
            e.stopPropagation();
            const r = e.currentTarget.getBoundingClientRect();
            setMenu(menu?.id === c.id ? null : { id: c.id, top: r.bottom + 4, left: r.right - 156 });
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--color-bg-subtle)]"
        >
          <MoreHorizontal className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
        </button>
      ),
    },
  ];

  const addButton = agencyEnabled ? (
    <button
      onClick={() => setCreating(true)}
      className="flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-white"
      style={{ backgroundColor: "var(--color-primary)" }}
    >
      <Plus className="h-4 w-4" />
      Add client
    </button>
  ) : undefined;

  return (
    <div>
      {/* The agency layout owns the section PageHeader (D10.4) — this page keeps
          only its functional action. */}
      {addButton && <div className="mb-6 flex justify-end">{addButton}</div>}

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
          action={{ label: "Add client", onClick: () => setCreating(true) }}
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Active clients" value={<MetricValue>{activeClients}</MetricValue>} />
            <StatCard label="Client sites" value={<MetricValue>{totalSites}</MetricValue>} />
            <StatCard label="Without sites" value={<MetricValue>{withoutSites}</MetricValue>} />
          </div>

          <DataTable
            columns={columns}
            rows={clients}
            keyOf={(c) => c.id}
            onRowClick={(c) => router.push(`/dashboard/clients/${c.id}`)}
          />
        </>
      )}

      {menu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 w-[156px] overflow-hidden rounded-lg border shadow-card"
            style={{ top: menu.top, left: menu.left, borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
          >
            <button
              type="button"
              onClick={() => {
                const c = clients.find((x) => x.id === menu.id);
                if (c) setRenaming(c);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-body-sm hover:bg-[var(--color-bg-subtle)]"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              type="button"
              onClick={() => {
                const c = clients.find((x) => x.id === menu.id);
                if (c) setConfirmDelete(c);
                setMenu(null);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-body-sm hover:bg-[var(--color-bg-subtle)]"
              style={{ color: "var(--color-error)" }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </>
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
