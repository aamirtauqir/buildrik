"use client";

import Link from "next/link";
import { ChevronRight, Building2, Shield, Bell, Users, Gauge, Activity, CreditCard, Globe, MessageSquare, Star, LayoutGrid, KeyRound, Sparkles, User, UserCircle, Trash2, type LucideIcon } from "lucide-react";
import { trpc } from "@lib/trpc/client";
import { IconChip } from "@/components/dashboard/primitives";

type Entry = { label: string; description: string; href: string; icon: LucideIcon; agencyOnly?: boolean };

/** Settings index = the design's directory of section cards. Every card points at
 *  a route that exists — the design also draws an "Add-ons" card, which this app
 *  has no route for, so it is omitted rather than shipped as a dead link. The
 *  workspace form this index used to render now lives at
 *  /dashboard/settings/workspace, reached from the first card. */
const GROUPS: { label: string; items: Entry[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "Workspace & branding", description: "Name, URL, logo & accent color", href: "/dashboard/settings/workspace", icon: Building2 },
      { label: "Security", description: "2FA, active sessions & sign-in", href: "/dashboard/settings/security", icon: Shield },
      { label: "Notifications", description: "Emails, digests & alerts", href: "/dashboard/settings/notifications", icon: Bell },
      { label: "Team", description: "Members, roles & seats", href: "/dashboard/settings/team", icon: Users },
    ],
  },
  {
    label: "Plan & billing",
    items: [
      { label: "Plans", description: "Compare & change your plan", href: "/dashboard/settings/plans", icon: Gauge },
      { label: "Usage & AI credits", description: "Bandwidth, storage & credits", href: "/dashboard/settings/usage", icon: Activity },
      { label: "Billing", description: "Invoices & payment method", href: "/dashboard/settings/billing", icon: CreditCard },
    ],
  },
  {
    label: "Sites & clients",
    items: [
      { label: "Domains", description: "Connected domains & DNS", href: "/dashboard/settings/domains", icon: Globe },
      { label: "Review & comments", description: "Client sign-off queue", href: "/dashboard/agency/reviews", icon: MessageSquare, agencyOnly: true },
      { label: "Partner program", description: "Referrals & partner tier", href: "/dashboard/agency/partner", icon: Star, agencyOnly: true },
      { label: "Apps & Integrations", description: "Connect external tools", href: "/dashboard/settings/integrations", icon: LayoutGrid },
    ],
  },
  {
    label: "Developer",
    items: [
      { label: "API tokens", description: "Personal access tokens", href: "/dashboard/settings/api-tokens", icon: KeyRound },
      { label: "AI & credits", description: "Model provider & credit usage", href: "/dashboard/settings/ai", icon: Sparkles },
    ],
  },
  {
    label: "Personal",
    items: [
      { label: "Account", description: "Email, password & sessions", href: "/dashboard/settings/account", icon: User },
      { label: "Profile", description: "Your name and avatar", href: "/dashboard/settings/profile", icon: UserCircle },
    ],
  },
  {
    label: "Danger zone",
    items: [
      { label: "Delete workspace", description: "Permanently remove this workspace", href: "/dashboard/settings/danger", icon: Trash2 },
    ],
  },
];

function SettingsCard({ entry }: { entry: Entry }) {
  const Icon = entry.icon;
  return (
    <Link
      href={entry.href}
      className="flex items-center gap-3.5 rounded-xl border px-[18px] py-4 transition-colors hover:border-[var(--color-border-strong)]"
      style={{ borderColor: "var(--color-border-default)", backgroundColor: "var(--color-bg-surface)" }}
    >
      <IconChip>
        <Icon className="h-5 w-5" />
      </IconChip>
      <div className="min-w-0 flex-1">
        <p className="text-section-title" style={{ color: "var(--color-text-primary)" }}>{entry.label}</p>
        <p className="mt-0.5 text-[13px]" style={{ color: "var(--color-text-secondary)" }}>{entry.description}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
    </Link>
  );
}

export default function SettingsIndexPage() {
  // Reviews and the partner program live behind the agency layer; hiding those
  // cards keeps every card on this page a destination the user can actually open.
  const features = trpc.features.list.useQuery(undefined, { staleTime: 60_000 });
  const agency = !!features.data?.agency_layer;

  return (
    <div className="flex flex-col gap-8">
      {GROUPS.map((group) => {
        const items = group.items.filter((i) => !i.agencyOnly || agency);
        if (items.length === 0) return null;
        return (
          <section key={group.label}>
            <h2 className="mb-3 text-eyebrow font-semibold uppercase tracking-wide" style={{ color: "var(--color-text-muted)" }}>
              {group.label}
            </h2>
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
              {items.map((item) => (
                <SettingsCard key={item.href} entry={item} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
