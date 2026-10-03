import { Building2, Shield, Bell, Users, Gauge, Activity, CreditCard, Globe, LayoutGrid, KeyRound, Sparkles, User, UserCircle, Trash2, type LucideIcon } from "lucide-react";

export type SettingsSection = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the workspace has the agency layer, matching the sidebar. */
  agencyOnly?: boolean;
};

/** Single source of truth for the Settings section list. The index renders it as
 *  the design's directory of cards; the layout reads it back to title a sub-page
 *  and point its back link home. Add a section here and both follow.
 *
 *  Grouped per Settings Phase B §25 (#47): WORKSPACE · CONNECTIONS · BILLING ·
 *  PERSONAL ("Only affects you") · DANGER ZONE. Security moved to Personal (it
 *  is your sign-in, not the workspace's), Transfer ownership to Danger zone,
 *  Plans folded into Plan & billing and AI credits into Usage & credits.
 *
 *  The design also draws an "Add-ons" card. This app has no route for it, so it
 *  is absent rather than shipped as a dead link. */
export const SETTINGS_GROUPS: { label: string; note?: string; items: SettingsSection[] }[] = [
  {
    label: "Workspace",
    items: [
      { label: "General & branding", description: "Name, URL, logo & accent color", href: "/dashboard/settings/workspace", icon: Building2 },
      { label: "Team", description: "Members, roles & seats", href: "/dashboard/settings/team", icon: Users },
    ],
  },
  {
    label: "Connections",
    items: [
      { label: "Apps & integrations", description: "Vercel, webhooks & external tools", href: "/dashboard/settings/integrations", icon: LayoutGrid },
      { label: "Domains", description: "Every site's connected domains & DNS", href: "/dashboard/settings/domains", icon: Globe },
      { label: "Workspace API tokens", description: "Tokens for scripts & integrations", href: "/dashboard/settings/api-tokens", icon: KeyRound },
    ],
  },
  {
    label: "Billing",
    items: [
      { label: "Plan & billing", description: "Your plan, invoices & payment method", href: "/dashboard/settings/billing", icon: CreditCard },
      { label: "Usage & credits", description: "Bandwidth, storage & AI credits", href: "/dashboard/settings/usage", icon: Activity },
    ],
  },
  {
    label: "Personal",
    note: "Only affects you",
    items: [
      { label: "Profile", description: "Your name and avatar", href: "/dashboard/settings/profile", icon: UserCircle },
      { label: "Account & sign-in", description: "Email, password & connected logins", href: "/dashboard/settings/account", icon: User },
      { label: "Security", description: "2FA & active sessions", href: "/dashboard/settings/security", icon: Shield },
      { label: "Notifications", description: "Emails, digests & alerts", href: "/dashboard/settings/notifications", icon: Bell },
    ],
  },
  {
    label: "Danger zone",
    items: [
      { label: "Transfer or delete", description: "Transfer ownership; deletion happens 30 days later, cancel any time before", href: "/dashboard/settings/danger", icon: Trash2 },
    ],
  },
];

/** Routes that still exist but are not cards of their own: Plans is the
 *  comparison Plan & billing opens (and the sidebar's upgrade link), AI credits
 *  now sit inside Usage & credits. Listed so a deep link is still titled. */
const SETTINGS_SUB_PAGES: SettingsSection[] = [
  { label: "Plans", description: "Compare & change your plan", href: "/dashboard/settings/plans", icon: Gauge },
  { label: "AI credits", description: "Model provider & credit usage", href: "/dashboard/settings/ai", icon: Sparkles },
];

export const SETTINGS_SECTIONS: SettingsSection[] = [...SETTINGS_GROUPS.flatMap((g) => g.items), ...SETTINGS_SUB_PAGES];

/** The sections that live under /dashboard/settings. Every entry is a settings
 *  route now that the agency cross-links (Reviews, Partner) have moved out to the
 *  Agency section — the filter stays as a guard against a future cross-domain
 *  link sneaking into settings-active detection. */
export const SETTINGS_OWN_HREFS: string[] = SETTINGS_SECTIONS
  .map((s) => s.href)
  .filter((h) => h.startsWith("/dashboard/settings/"));

/** Longest-prefix match so a nested route (…/integrations/vercel-team-picker)
 *  still resolves to its section. */
export function findSettingsSection(pathname: string): SettingsSection | undefined {
  return SETTINGS_SECTIONS
    .filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
