"use client";

import { RotateCcw } from "lucide-react";
import { Button, DataTable, MetricValue, type Column } from "@/components/dashboard/primitives";

/**
 * Sites › Recently deleted (Settings Phase B, PD-6, plan row #54).
 *
 * The workspace's sites deleted inside the restore window (`sites.listDeleted`),
 * newest first, each with the day it is purged and `Restore` (`sites.restore`,
 * OWNER — the same gate as delete). A restored site comes back as a draft with
 * its forms on and its share links still revoked (Q-B8); it is not republished.
 */

export interface DeletedSiteRow {
  id: string;
  name: string;
  slug: string;
  deletedAt: Date | string;
  purgeAt: Date | string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const day = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** `in 29 days` / `tomorrow` / `today` — how long the site can still come back. */
export function purgeIn(purgeAt: Date | string, now = Date.now()): string {
  const days = Math.max(0, Math.ceil((new Date(purgeAt).getTime() - now) / DAY_MS));
  return days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
}

export function RecentlyDeleted({
  rows,
  canRestore,
  restoringId,
  onRestore,
}: {
  rows: DeletedSiteRow[];
  /** Only the workspace owner may restore (the server enforces it too). */
  canRestore: boolean;
  restoringId: string | null;
  onRestore: (row: DeletedSiteRow) => void;
}) {
  const columns: Column<DeletedSiteRow>[] = [
    {
      key: "name",
      header: "Site",
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
            {r.name}
          </p>
          <p className="truncate text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
            {r.slug}
          </p>
        </div>
      ),
    },
    { key: "deletedAt", header: "Deleted", render: (r) => <MetricValue className="text-body-sm">{day(r.deletedAt)}</MetricValue> },
    {
      key: "purgeAt",
      header: "Removed for good",
      render: (r) => (
        <span className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
          {purgeIn(r.purgeAt)} · {day(r.purgeAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={!canRestore || restoringId !== null}
          title={canRestore ? undefined : "Only the workspace owner can restore a site"}
          onClick={() => onRestore(r)}
          data-testid={`restore-site-${r.id}`}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {restoringId === r.id ? "Restoring…" : "Restore"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-3" data-testid="recently-deleted">
      <p className="text-body" style={{ color: "var(--color-text-secondary)" }}>
        Deleted sites can be restored for 30 days. A restored site comes back as a draft — publish it again to put it
        live. Share links stay off; make new ones.
      </p>
      <DataTable
        columns={columns}
        rows={rows}
        keyOf={(r) => r.id}
        empty={
          <div
            className="rounded-lg border-2 border-dashed py-12 text-center text-body"
            style={{ borderColor: "var(--color-border-default)", color: "var(--color-text-secondary)" }}
            data-testid="recently-deleted-empty"
          >
            No sites deleted in the last 30 days.
          </div>
        }
      />
    </div>
  );
}
