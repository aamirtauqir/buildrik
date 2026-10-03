"use client";

import { DataTable, MetricValue, Pill, SectionCard, StatCard, type Column } from "@/components/dashboard/primitives";
import { EditInSiteSettings, SummaryNotice } from "./settings-summary";

/**
 * Site tab · Redirects — read-only (Settings Phase B, PD-1, plan row #53).
 *
 * Rules are added, edited, deleted, imported and exported in the editor's
 * Site settings › Redirects (8136:214826). This tab shows the stored rules and
 * the plan's limit, and opens that screen (`?settings=redirects`). The rules
 * reach visitors through the next publish (the deploy's vercel.json,
 * `lib/publish-files.ts`).
 */

export interface RedirectRow {
  id: string;
  fromPath: string;
  toUrl: string;
  type: string;
}

interface RedirectsTabProps {
  siteId: string;
  redirects: RedirectRow[];
  /** -1 = unlimited */
  limit: number;
}

const COLUMNS: Column<RedirectRow>[] = [
  { key: "fromPath", header: "From", render: (r) => <MetricValue className="text-body-sm">{r.fromPath}</MetricValue> },
  { key: "toUrl", header: "To", render: (r) => <span className="break-all text-body-sm">{r.toUrl}</span> },
  { key: "type", header: "Type", render: (r) => <Pill tone="neutral">{r.type}</Pill> },
];

export function RedirectsTab({ siteId, redirects, limit }: RedirectsTabProps) {
  return (
    <div className="space-y-6">
      <SummaryNotice>
        Redirects are managed in the editor&rsquo;s Site settings — 301 = permanent (SEO), 302 = temporary. Rules apply on
        the next publish.
      </SummaryNotice>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active" value={<MetricValue>{redirects.length}</MetricValue>} />
        <StatCard label="Plan limit" value={<MetricValue>{limit === -1 ? "∞" : limit}</MetricValue>} />
        <StatCard label="Permanent (301)" value={<MetricValue>{redirects.filter((r) => r.type === "301").length}</MetricValue>} />
      </div>

      <SectionCard title="Redirect rules" padding="none" actions={<EditInSiteSettings siteId={siteId} screen="redirects" />}>
        <DataTable
          columns={COLUMNS}
          rows={redirects}
          keyOf={(r) => r.id}
          empty={
            <p className="p-4 text-body" style={{ color: "var(--color-text-muted)" }} data-testid="redirects-summary-empty">
              No redirects yet. Add one or import a CSV in Site settings.
            </p>
          }
        />
      </SectionCard>
    </div>
  );
}
