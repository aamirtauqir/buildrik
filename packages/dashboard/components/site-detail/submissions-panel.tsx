"use client";

import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Download, Inbox } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import {
  SubmissionDrawer,
  type FormSubmissionData,
} from "@/components/site-detail/submission-drawer";
import { Button, DataTable, Pill, MetricValue, type Column, SelectField } from "@/components/dashboard/primitives";

interface FormBlock {
  id: string;
  name: string;
  _count: { submissions: number };
}

interface SubmissionsPanelProps {
  siteId: string;
  formBlocks: FormBlock[];
  isLoading?: boolean;
}

const PER_PAGE = 20;

/** Form-submissions view (filter + export + table + drawer + pagination).
 *  Lives on the Submissions tab (`/feedback`); reads via forms.listSubmissions. */
export function SubmissionsPanel({ siteId, formBlocks, isLoading }: SubmissionsPanelProps) {
  const [page, setPage] = useState(1);
  const [filterFormBlockId, setFilterFormBlockId] = useState<string | undefined>(undefined);
  const [drawerSubmission, setDrawerSubmission] = useState<FormSubmissionData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const submissionsQuery = trpc.forms.listSubmissions.useQuery(
    { siteId, formBlockId: filterFormBlockId, page, perPage: PER_PAGE },
    { enabled: formBlocks.length > 0 },
  );

  const utils = trpc.useUtils();

  const updateMutation = trpc.forms.updateSubmission.useMutation({
    onSuccess: () => {
      utils.forms.listSubmissions.invalidate();
    },
  });

  const deleteMutation = trpc.forms.deleteSubmission.useMutation({
    onSuccess: () => {
      utils.forms.listSubmissions.invalidate();
      setDrawerOpen(false);
      setDrawerSubmission(null);
    },
  });

  const handleDrawerUpdate = useCallback(
    (id: string, data: Partial<{ isRead: boolean; isSpam: boolean; isArchived: boolean }>) => {
      updateMutation.mutate({ id, ...data });
      if (drawerSubmission && drawerSubmission.id === id) {
        setDrawerSubmission({ ...drawerSubmission, ...data });
      }
    },
    [updateMutation, drawerSubmission],
  );

  const handleDrawerDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate({ id });
    },
    [deleteMutation],
  );

  const handleOpenDrawer = useCallback(
    (sub: FormSubmissionData) => {
      setDrawerSubmission(sub);
      setDrawerOpen(true);
      if (!sub.isRead) {
        updateMutation.mutate({ id: sub.id, isRead: true });
      }
    },
    [updateMutation],
  );

  const handleExportCsv = useCallback(async () => {
    // Pull the FULL dataset from the server (respecting the active form
    // filter) rather than serialising only the current 20-row page.
    setExporting(true);
    try {
      const csv = await utils.forms.exportSubmissions.fetch({
        siteId,
        formBlockId: filterFormBlockId,
        format: "csv",
      });
      if (!csv) return;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submissions-${siteId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [utils, siteId, filterFormBlockId]);

  if (!isLoading && formBlocks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center" style={{ borderColor: "var(--color-border-default)" }}>
        <Inbox className="mx-auto h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
        <p className="mt-2 text-body font-medium" style={{ color: "var(--color-text-primary)" }}>No forms on this site yet</p>
        {/* "Add a form block in the editor to start collecting submissions"
            sent people to do something that collects nothing: a Form block
            exports with no action and no submit script, so a published page
            posts nowhere. The editor's Settings → Forms screen says so; this
            one was sending the same user the other way. */}
        <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>
          A Form block renders on a published page, but capturing what visitors
          send isn&rsquo;t wired up yet.
        </p>
      </div>
    );
  }

  const rows = (submissionsQuery.data?.data ?? []) as unknown as FormSubmissionData[];
  const total = submissionsQuery.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const columns: Column<FormSubmissionData>[] = [
    {
      key: "createdAt",
      header: "Submitted",
      render: (s) => (
        <MetricValue className="text-body-sm">
          {new Date(s.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </MetricValue>
      ),
    },
    {
      key: "form",
      header: "Form",
      render: (s) => <span style={{ color: "var(--color-text-secondary)" }}>{s.formBlock?.name ?? "Unknown"}</span>,
    },
    {
      key: "preview",
      header: "Data Preview",
      className: "max-w-[320px] truncate",
      render: (s) => {
        const preview = Object.entries(s.data)
          .slice(0, 2)
          .map(([k, v]) => `${k}: ${String(v).slice(0, 30)}${String(v).length > 30 ? "…" : ""}`)
          .join(" | ");
        return <span style={{ color: "var(--color-text-secondary)" }}>{preview || "—"}</span>;
      },
    },
    {
      key: "status",
      header: "Status",
      render: (s) => (
        <div className="flex items-center gap-1.5">
          {!s.isRead && <Pill tone="accent">Unread</Pill>}
          {s.isSpam && <Pill tone="warning">Spam</Pill>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter + export */}
      <div className="flex items-center justify-between gap-3">
        <SelectField
          value={filterFormBlockId ?? ""}
          onChange={(e) => {
            setFilterFormBlockId(e.target.value || undefined);
            setPage(1);
          }}
          size="sm"
          wrapperClassName="w-[200px] shrink-0"
        >
          <option value="">All forms</option>
          {formBlocks.map((fb) => (
            <option key={fb.id} value={fb.id}>{fb.name}</option>
          ))}
        </SelectField>
        <Button variant="ghost" size="sm" onClick={handleExportCsv} disabled={exporting || rows.length === 0} className="gap-1.5">
          <Download className="h-3.5 w-3.5" />
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {isLoading || submissionsQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 w-full animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
          ))}
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={rows}
            keyOf={(s) => s.id}
            onRowClick={handleOpenDrawer}
            empty={
              <div className="rounded-lg border border-dashed p-10 text-center" style={{ borderColor: "var(--color-border-default)" }}>
                <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>No submissions found</p>
                {/* "Submissions from your published site will appear here" is a
                    promise the product does not keep: a Form block exports with
                    no action and no submit script, so a published page posts
                    nowhere and this endpoint is never called. The editor's own
                    Settings → Forms screen says exactly that; these two screens
                    were telling the user opposite things. */}
                <p className="mt-0.5 text-body" style={{ color: "var(--color-text-secondary)" }}>
                  {filterFormBlockId
                    ? "Try clearing the form filter."
                    : "Capturing submissions from a published Form block isn\u2019t wired up yet. Rows here come from anything you point at this site\u2019s form endpoint yourself."}
                </p>
              </div>
            }
          />

          {total > PER_PAGE && (
            <div className="flex items-center justify-between">
              <p className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                Page <MetricValue>{submissionsQuery.data?.page ?? page}</MetricValue> of <MetricValue>{totalPages}</MetricValue>{" "}
                (<MetricValue>{total}</MetricValue> total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border p-1.5 transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-40"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <ChevronLeft className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="rounded-lg border p-1.5 transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-40"
                  style={{ borderColor: "var(--color-border-default)" }}
                >
                  <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-secondary)" }} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <SubmissionDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setDrawerSubmission(null);
        }}
        submission={drawerSubmission}
        onUpdate={handleDrawerUpdate}
        onDelete={handleDrawerDelete}
      />
    </div>
  );
}
