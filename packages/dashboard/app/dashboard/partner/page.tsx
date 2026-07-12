"use client";

import { useState } from "react";
import { Users, TrendingUp, Wallet, Copy, Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { LoadingSkeleton, ErrorState } from "@/components/states";

const usd = (cents: number) => {
  const d = cents / 100;
  return d >= 1000 ? `$${(d / 1000).toFixed(d % 1000 === 0 ? 0 : 1)}k` : `$${d.toLocaleString()}`;
};

export default function PartnerPage() {
  const query = trpc.dashboard.partner.useQuery(undefined, { retry: false });
  const [copied, setCopied] = useState(false);

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

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[22px] font-bold" style={{ color: "var(--color-text-primary)" }}>Partner program</h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Earn commission and perks by referring agencies.
        </p>
      </header>

      {query.isLoading ? (
        <LoadingSkeleton rows={3} variant="card" />
      ) : query.isError ? (
        <ErrorState title="Couldn't load partner data" onRetry={() => query.refetch()} />
      ) : d ? (
        <>
          <div className="mb-4 flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-primary-subtle)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {d.tier.name} Partner · {d.tier.commissionPct}% commission
              </p>
              {d.nextTier ? (
                <>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {usd(influenced)} of {usd(nextThreshold)} to reach {d.nextTier.name} ({d.nextTier.commissionPct}%)
                  </p>
                  <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full" style={{ backgroundColor: "var(--color-border-default)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: "var(--color-primary)" }} />
                  </div>
                </>
              ) : (
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-secondary)" }}>Top tier reached — max commission.</p>
              )}
            </div>
            <button
              onClick={copyLink}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Get referral link"}
            </button>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Metric icon={Users} label="Referrals" value={String(d.metrics.referrals)} />
            <Metric icon={TrendingUp} label="MRR influenced" value={usd(d.metrics.mrrInfluencedCents)} />
            <Metric icon={Wallet} label="Commission earned" value={usd(d.metrics.commissionEarnedCents)} />
          </div>

          {d.referrals.length === 0 ? (
            <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>No referrals yet</p>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>Share your referral link to start earning commission.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--color-border-default)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wide text-neutral-500" style={{ borderColor: "var(--color-border-default)" }}>
                    <th className="px-4 py-2.5 font-medium">Referred</th>
                    <th className="px-4 py-2.5 font-medium">Signed up</th>
                    <th className="px-4 py-2.5 font-medium">Plan</th>
                    <th className="px-4 py-2.5 font-medium">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {d.referrals.map((r) => (
                    <tr key={r.id} className="border-b last:border-0" style={{ borderColor: "var(--color-border-default)" }}>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{r.name}</td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{new Date(r.signedUpAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="px-4 py-3" style={{ color: "var(--color-text-secondary)" }}>{r.plan}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: "var(--color-text-primary)" }}>{usd(r.commissionCents)}/mo</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}>
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-primary)" }}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>{label}</p>
      </div>
      <p className="mt-2 text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
    </div>
  );
}
