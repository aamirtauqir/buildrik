"use client";

import Link from "next/link";
import { Globe, ShieldCheck, ShieldAlert, Clock, ExternalLink } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState, StateEmpty } from "@/components/states";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  VERIFIED: { label: "Connected", color: "var(--color-success)", bg: "#ECFDF5" },
  PENDING: { label: "Verifying", color: "#8E4B10", bg: "#FDFDEA" },
  FAILED: { label: "Failed", color: "#E02424", bg: "#FDF2F2" },
};

export default function WorkspaceDomainsPage() {
  const query = trpc.siteDetail.domains.listForWorkspace.useQuery(undefined, { retry: false });
  const domains = query.data ?? [];

  const connected = domains.filter((d) => d.status === "VERIFIED").length;
  const pending = domains.filter((d) => d.status === "PENDING").length;

  return (
    <div>
      {/* The settings layout owns the section PageHeader (D10.4). */}
      {query.isLoading ? (
        <LoadingSkeleton rows={4} variant="list" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load domains" description="Something went wrong on our end." onRetry={() => query.refetch()} />
      ) : domains.length === 0 ? (
        <StateEmpty
          icon={<Globe className="h-7 w-7" />}
          title="No custom domains yet"
          description="Connect a domain from any site's Domains tab. They'll all show up here."
        />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
              <p className="text-body-sm uppercase tracking-wide text-neutral-500">Connected</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{connected}</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
              <p className="text-body-sm uppercase tracking-wide text-neutral-500">Verifying</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{pending}</p>
            </div>
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--color-border-default)" }}>
              <p className="text-body-sm uppercase tracking-wide text-neutral-500">Total</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{domains.length}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--color-border-default)" }}>
            <table className="w-full text-body">
              <thead>
                <tr className="border-b text-left text-body-sm uppercase tracking-wide text-neutral-500" style={{ borderColor: "var(--color-border-default)" }}>
                  <th className="px-4 py-2.5 font-medium">Domain</th>
                  <th className="px-4 py-2.5 font-medium">Site</th>
                  <th className="px-4 py-2.5 font-medium">SSL</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {domains.map((d) => {
                  const s = STATUS_STYLE[d.status] ?? STATUS_STYLE.PENDING;
                  const sslOk = d.sslStatus === "ACTIVE" || d.sslStatus === "VERIFIED";
                  return (
                    <tr key={d.id} className="border-b last:border-0" style={{ borderColor: "var(--color-border-default)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {d.domain}
                        {d.isPrimary && <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-body-sm text-neutral-500">primary</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/sites/${d.siteId}/domains`} className="text-[var(--color-primary)] hover:underline">{d.siteName}</Link>
                      </td>
                      <td className="px-4 py-3">
                        {sslOk ? (
                          <span className="inline-flex items-center gap-1 text-body-sm text-[var(--color-success)]"><ShieldCheck className="h-3.5 w-3.5" /> Secured</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-body-sm text-neutral-400"><ShieldAlert className="h-3.5 w-3.5" /> Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-body-sm font-medium" style={{ color: s.color, backgroundColor: s.bg }}>
                          {d.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {s.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {d.status === "VERIFIED" && (
                          <a href={`https://${d.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-body-sm text-neutral-500 hover:text-[var(--color-primary)]">
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
