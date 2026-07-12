import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export interface PartnerReferralRow {
  id: string;
  name: string;
  plan: string;
  signedUpAt: string;
  commissionCents: number;
}

export interface PartnerDashboard {
  referralCode: string;
  tier: { name: string; commissionPct: number };
  nextTier: { name: string; commissionPct: number; thresholdCents: number } | null;
  /** cents of influenced MRR still needed to reach the next tier (0 if maxed) */
  toNextTierCents: number;
  metrics: { referrals: number; mrrInfluencedCents: number; commissionEarnedCents: number };
  referrals: PartnerReferralRow[];
}

// Partner tiers keyed on influenced MRR. Default thresholds — adjust when the
// commercial program is finalized.
const TIERS = [
  { name: "Bronze", commissionPct: 15, minMrrCents: 0 },
  { name: "Silver", commissionPct: 20, minMrrCents: 100_000 }, // $1,000
  { name: "Gold", commissionPct: 25, minMrrCents: 1_000_000 }, // $10,000
] as const;

export async function getPartnerDashboard(workspaceId: string): Promise<PartnerDashboard> {
  const rows = await prisma.referral.findMany({
    where: { workspaceId },
    orderBy: { signedUpAt: "desc" },
  });

  const mrrInfluencedCents = rows.reduce((s, r) => s + r.mrrCents, 0);
  const commissionEarnedCents = rows.reduce((s, r) => s + r.commissionCents, 0);

  let idx = 0;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (mrrInfluencedCents >= TIERS[i].minMrrCents) {
      idx = i;
      break;
    }
  }
  const tier = TIERS[idx];
  const nextTier = TIERS[idx + 1] ?? null;

  // Deterministic, stable per-workspace referral code (no schema field needed).
  const referralCode = createHash("sha256").update(workspaceId).digest("hex").slice(0, 8).toUpperCase();

  return {
    referralCode,
    tier: { name: tier.name, commissionPct: tier.commissionPct },
    nextTier: nextTier ? { name: nextTier.name, commissionPct: nextTier.commissionPct, thresholdCents: nextTier.minMrrCents } : null,
    toNextTierCents: nextTier ? Math.max(0, nextTier.minMrrCents - mrrInfluencedCents) : 0,
    metrics: { referrals: rows.length, mrrInfluencedCents, commissionEarnedCents },
    referrals: rows.map((r) => ({
      id: r.id,
      name: r.referredName,
      plan: r.plan,
      signedUpAt: r.signedUpAt.toISOString(),
      commissionCents: r.commissionCents,
    })),
  };
}
