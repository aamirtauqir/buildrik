"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { cn } from "@lib/utils";
import { MetricValue, FilterTabs, Button } from "@/components/dashboard/primitives";
import { PageHeaderActions } from "@/components/dashboard/shell/page-actions";
import { ErrorState } from "@/components/states";
import { useToast } from "@/components/dashboard/toast-provider";

/** The billing-cycle segments. The saving badge stays green in both states —
 *  FilterTabs' active segment is a white pill, so white-on-white was the reason
 *  the old hand-rolled track flipped it. */
const BILLING_CYCLES = [
  { value: "monthly" as const, label: "Monthly" },
  {
    value: "yearly" as const,
    label: (
      <span className="inline-flex items-center gap-1.5">
        Yearly
        <span className="text-body-sm font-semibold" style={{ color: "var(--color-success)" }}>
          &minus;20%
        </span>
      </span>
    ),
  },
];

type PlanName = "FREE" | "PRO" | "BUSINESS";

interface PlanEntry {
  name: string;
  sites: number;
  customDomains: number;
  teamMembers: number;
  priceMonthly: number;
  priceYearly: number;
}

const PLAN_ORDER: PlanName[] = ["FREE", "PRO", "BUSINESS"];

const PLAN_LABEL: Record<PlanName, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
};

const PLAN_TAGLINE: Record<PlanName, string> = {
  FREE: "For trying things out",
  PRO: "For solo builders",
  BUSINESS: "For studios & teams",
};

function formatMoney(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2);
}

function priceLabel(plan: PlanEntry, yearly: boolean): { amount: string; suffix: string | null; note: string | null } {
  if (plan.priceMonthly === 0) return { amount: "$0", suffix: "/mo", note: null };
  const perMonth = yearly ? plan.priceYearly : plan.priceMonthly;
  return { amount: `$${formatMoney(perMonth)}`, suffix: "/mo", note: yearly ? "billed yearly" : null };
}

function siteLabel(n: number): string {
  return n === -1 ? "Unlimited sites" : `${n} sites`;
}

function domainLabel(n: number): string {
  if (n === -1) return "Unlimited custom domains";
  if (n === 0) return "No custom domains";
  return `${n} custom domain${n === 1 ? "" : "s"}`;
}

function teamLabel(n: number): string {
  return n === -1 ? "Unlimited team members" : `${n} team member${n === 1 ? "" : "s"}`;
}

// Real limit values only (PLAN_LIMITS is the SSOT) — no invented marketing
// claims like "priority support" that no limit backs.
function planFeatures(plan: PlanEntry): string[] {
  return [siteLabel(plan.sites), domainLabel(plan.customDomains), teamLabel(plan.teamMembers)];
}

export default function PlansPage() {
  const [yearly, setYearly] = useState(false);
  const { addToast } = useToast();
  const overviewQuery = trpc.billing.overview.useQuery(undefined, { retry: false });
  const plansQuery = trpc.billing.plans.useQuery();

  const currentPlanId = (overviewQuery.data?.plan as PlanName) ?? "FREE";

  // Wire the plan CTAs to the real Stripe flow (they used to be dead links to
  // /billing that dropped the chosen plan). A FREE workspace upgrading goes to
  // Checkout; a paid workspace changing/cancelling tier goes to the Customer
  // Portal (createCheckoutSession throws ALREADY_SUBSCRIBED for them).
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => window.location.assign(data.url),
    onError: (e) => addToast("error", "Couldn't start checkout", e.message),
  });
  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => window.location.assign(data.url),
    onError: (e) => addToast("error", "Couldn't open billing portal", e.message),
  });
  const pending = checkoutMutation.isPending || portalMutation.isPending;

  function selectPlan(target: PlanName) {
    if (currentPlanId === "FREE" && target !== "FREE") {
      checkoutMutation.mutate({ planId: target, interval: yearly ? "YEARLY" : "MONTHLY" });
    } else {
      portalMutation.mutate();
    }
  }

  // Without this, `?? 0` fallbacks below render every plan as $0 / 0-limit
  // while the query is in flight or errored — false pricing on the money page.
  if (plansQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-lg" style={{ backgroundColor: "var(--color-bg-subtle)" }} />
        ))}
      </div>
    );
  }

  if (plansQuery.isError) {
    return (
      <ErrorState
        title="Couldn't load plans"
        description="Something went wrong fetching pricing. Your current plan is unaffected."
        onRetry={() => plansQuery.refetch()}
      />
    );
  }

  const plans: PlanEntry[] = PLAN_ORDER.map((name) => {
    const found = plansQuery.data?.find((p) => p.name === name);
    return {
      name,
      sites: Number(found?.sites ?? 0),
      customDomains: Number(found?.customDomains ?? 0),
      teamMembers: Number(found?.teamMembers ?? 0),
      priceMonthly: Number(found?.priceMonthly ?? 0),
      priceYearly: Number(found?.priceYearly ?? 0),
    };
  });

  return (
    <div>
      {/* On the layout's title row, not a band under it: the settings layout
          owns the section PageHeader (D10.4), and PageHeaderActions portals
          into the slot it renders there. And the cycle toggle is the shared
          FilterTabs now — it was a hand-rolled track with a blue-fill active
          segment, a second track shape doing Media's job. */}
      <PageHeaderActions>
        <FilterTabs
          value={yearly ? "yearly" : "monthly"}
          onChange={(v) => setYearly(v === "yearly")}
          options={BILLING_CYCLES}
          label="Billing cycle"
        />
      </PageHeaderActions>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const planId = plan.name as PlanName;
          const isCurrent = planId === currentPlanId;
          const isInk = planId === "BUSINESS";
          const popular = planId === "PRO";
          const price = priceLabel(plan, yearly);

          const cardStyle = isInk
            ? { backgroundColor: "var(--color-ink)", borderColor: "var(--color-ink)", boxShadow: "var(--shadow-card)" }
            : popular
              ? {
                  backgroundColor: "var(--color-bg-surface)",
                  borderColor: "var(--color-primary)",
                  boxShadow: "0 0 0 1px var(--color-primary), 0 14px 34px -18px rgba(26,86,219,0.5)",
                }
              : {
                  backgroundColor: "var(--color-bg-surface)",
                  borderColor: "var(--color-border-default)",
                  boxShadow: "var(--shadow-card)",
                };

          const nameColor = isInk ? "#FFFFFF" : "var(--color-text-primary)";
          const priceColor = isInk ? "#FFFFFF" : "var(--color-text-primary)";
          const secondaryColor = isInk ? "rgba(255,255,255,0.68)" : "var(--color-text-secondary)";
          const featureColor = isInk ? "rgba(255,255,255,0.9)" : "var(--color-text-primary)";
          const checkColor = isInk ? "var(--color-teal)" : "var(--color-success)";

          return (
            <div key={plan.name} className="relative flex flex-col rounded-lg border p-5" style={cardStyle}>
              {popular && (
                <span
                  className="absolute -top-2.5 left-5 rounded-pill px-2.5 py-0.5 text-eyebrow font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Popular
                </span>
              )}

              <h2 className="text-section-title" style={{ color: nameColor }}>
                {PLAN_LABEL[planId]}
              </h2>

              <div className="mt-3 flex items-baseline gap-1">
                <span style={{ color: priceColor }}>
                  <MetricValue className="text-3xl font-extrabold">{price.amount}</MetricValue>
                </span>
                {price.suffix && (
                  <span className="text-body" style={{ color: secondaryColor }}>
                    {price.suffix}
                  </span>
                )}
              </div>
              <div className="mt-1 h-4 text-body-sm" style={{ color: secondaryColor }}>
                {price.note}
              </div>

              <p className="mt-2 text-body" style={{ color: secondaryColor }}>
                {PLAN_TAGLINE[planId]}
              </p>

              <ul className="mt-5 space-y-2.5">
                {planFeatures(plan).map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-body" style={{ color: featureColor }}>
                    <Check className="h-4 w-4 shrink-0" style={{ color: checkColor }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-6">
                <PlanCta planId={planId} popular={popular} onInk={isInk} isCurrent={isCurrent} currentPlanId={currentPlanId} onSelect={selectPlan} pending={pending} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlanCta({
  planId,
  popular,
  onInk,
  isCurrent,
  currentPlanId,
  onSelect,
  pending,
}: {
  planId: PlanName;
  popular: boolean;
  onInk: boolean;
  isCurrent: boolean;
  currentPlanId: PlanName;
  onSelect: (planId: PlanName) => void;
  pending: boolean;
}) {
  // Both branches ride the Button primitive. Hand-rolled, these were 40px/600
  // and 42px/600 — two more heights and a weight the dashboard uses nowhere
  // else, sitting under a header full of 40px/500 buttons.
  if (isCurrent) {
    return (
      <Button variant="ghost" disabled className="w-full">
        Current plan
      </Button>
    );
  }

  const isUpgrade = PLAN_ORDER.indexOf(planId) > PLAN_ORDER.indexOf(currentPlanId);
  const label = isUpgrade ? "Upgrade" : "Downgrade";

  return (
    <Button
      variant={popular ? "primary" : "ghost"}
      onClick={() => onSelect(planId)}
      disabled={pending}
      // The BUSINESS card is painted on ink, so a light ghost button would
      // vanish into it — it borrows the card's own hairline instead. The
      // background and hover are CLASSES, not an inline style: an inline
      // `backgroundColor: transparent` beats the hover class in every state,
      // which left this CTA with no hover feedback at all.
      className={cn(
        "w-full",
        !popular && onInk && "tw:border-white/45 tw:bg-transparent tw:text-white tw:hover:bg-white/10",
      )}
    >
      {pending ? "Opening…" : label}
    </Button>
  );
}
