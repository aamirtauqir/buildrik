"use client";

import { Pill, SectionCard, type PillTone } from "@/components/dashboard/primitives";
import { EditInSiteSettings, SummaryNotice } from "./settings-summary";

/**
 * Site tab · Domains — read-only (Settings Phase B, PD-1, plan row #52).
 *
 * Connecting, removing, making primary and DNS checks happen in the editor's
 * Site settings › Domains (8136:214348). This tab lists the site's domains as
 * stored — primary first, its status, its certificate — and opens that screen
 * (`?settings=domains`).
 */

interface DomainEntry {
  id: string;
  domain: string;
  status: string;
  sslStatus: string;
  isPrimary: boolean;
}

const STATUS_TONE: Record<string, PillTone> = { VERIFIED: "success", PENDING: "warning", FAILED: "error" };
const STATUS_LABEL: Record<string, string> = { VERIFIED: "Connected", PENDING: "Waiting for DNS", FAILED: "DNS not found" };

export function DomainsTab({ siteId, domains }: { siteId: string; domains: DomainEntry[] }) {
  const rows = [...domains].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return (
    <div className="space-y-6">
      <SummaryNotice>Domains are managed in the editor&rsquo;s Site settings. Changes there are live immediately.</SummaryNotice>
      <SectionCard title="Custom domains" actions={<EditInSiteSettings siteId={siteId} screen="domains" />}>
        {rows.length === 0 ? (
          <p className="text-body" style={{ color: "var(--color-text-muted)" }} data-testid="domains-summary-empty">
            No custom domain. The site uses its default vercel.app address.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                style={{ borderColor: "var(--color-border-default)" }}
                data-testid={`domains-summary-${d.id}`}
              >
                <span className="min-w-0 flex-1 truncate text-body font-medium" style={{ color: "var(--color-text-primary)" }}>
                  {d.domain}
                </span>
                {d.isPrimary ? <Pill tone="accent">Primary</Pill> : null}
                <Pill tone={STATUS_TONE[d.status] ?? "neutral"}>{STATUS_LABEL[d.status] ?? d.status}</Pill>
                <span className="w-24 text-right text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {d.sslStatus === "ACTIVE" ? "SSL active" : "SSL pending"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
