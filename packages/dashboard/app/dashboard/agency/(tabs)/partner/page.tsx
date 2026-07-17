"use client";

import { useState } from "react";
import { Users, TrendingUp, Wallet, Copy, Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";
import { StatCard, MetricValue, ProgressBar, DataTable, type Column } from "@/components/dashboard/primitives";

const usd = (cents: number) => {
  const d = cents / 100;
  return d >= 1000 ? `$${(d / 1000).toFixed(d % 1000 === 0 ? 0 : 1)}k` : `$${d.toLocaleString()}`;
};

export default function PartnerPage() {
  const query = trpc.dashboard.partner.useQuery(undefined, { retry: false });
  const [copied, setCopied] = useState(false);

  type Referral = NonNullable<typeof query.data>["referrals"][number];

  const copyLink = () => {
    if (!query.data) return;
    const url = `${window.location.origin}/?ref=${query.data.referralCode}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  const d = query.data;
  const nextThreshold = d?.nextTier?.thresholdCents ?? 0;
  const influenced = d?.metrics.mrrInfluencedCents ?? 0;
  const pct = nextThreshold > 0 ? Math.min((influenced / nextThreshold) * 100, 100) : 100;

  const columns: Column<Referral>[] = [
    { key: "name", header: "Referred", className: "font-medium" },
    {
      key: "signedUpAt",
      header: "Signed up",
      render: (r) => (
        <span style={{ color: "var(--color-text-secondary)" }}>
          <MetricValue>{new Date(r.signedUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</MetricValue>
        </span>
      ),
    },
    { key: "plan", header: "Plan", render: (r) => <span style={{ color: "var(--color-text-secondary)" }}>{r.plan}</span> },
    { key: "commission", header: "Commission", className: "font-medium", render: (r) => <MetricValue>{usd(r.commissionCents)}/mo</MetricValue> },
  ];

  return (
    <div>
      {/* The agency layout owns the section PageHeader (D10.4). */}
      {query.isLoading ? (
        <LoadingSkeleton rows={3} variant="card" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load partner data" onRetry={() => query.refetch()} />
      ) : d ? (
        <>
          <div className="mb-4 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-primary-subtle)" }}>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {d.tier.name} Partner · <MetricValue>{d.tier.commissionPct}%</MetricValue> commission
              </p>
              {d.nextTier ? (
                <>
                  <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <MetricValue>{usd(influenced)}</MetricValue> of <MetricValue>{usd(nextThreshold)}</MetricValue> to reach {d.nextTier.name} (<MetricValue>{d.nextTier.commissionPct}%</MetricValue>)
                  </p>
                  <ProgressBar pct={pct} className="mt-2 max-w-xs" />
                </>
              ) : (
                <p className="mt-0.5 text-body-sm" style={{ color: "var(--color-text-secondary)" }}>Top tier reached — max commission.</p>
              )}
            </div>
            <button
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-body font-medium text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Get referral link"}
            </button>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={<Users className="h-4 w-4" />} label="Referrals" value={<MetricValue>{d.metrics.referrals}</MetricValue>} />
            <StatCard icon={<TrendingUp className="h-4 w-4" />} label="MRR influenced" value={<MetricValue>{usd(d.metrics.mrrInfluencedCents)}</MetricValue>} />
            <StatCard icon={<Wallet className="h-4 w-4" />} label="Commission earned" value={<MetricValue>{usd(d.metrics.commissionEarnedCents)}</MetricValue>} />
          </div>

          <DataTable
            columns={columns}
            rows={d.referrals}
            keyOf={(r) => r.id}
            empty={
              <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
                <p className="text-body font-medium" style={{ color: "var(--color-text-primary)" }}>No referrals yet</p>
                <p className="mt-1 text-body" style={{ color: "var(--color-text-secondary)" }}>Share your referral link to start earning commission.</p>
              </div>
            }
          />
        </>
      ) : null}
    </div>
  );
}
