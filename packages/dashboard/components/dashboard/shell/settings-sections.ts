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
 *  The design also draws an "Add-ons" card. This app has no route for it, so it
 *  is absent rather than shipped as a dead link. */
export const SETTINGS_GROUPS: { label: string; items: SettingsSection[] }[] = [
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
      // Named for both halves of the page it opens. It was "Delete workspace",
      // which is one of the two things behind this card — the page also deletes
      // your account and exports your data — and it made the destination read
      // "Delete workspace" three times: the H1, the card title, the button.
      { label: "Delete workspace or account", description: "Permanent, and not reversible", href: "/dashboard/settings/danger", icon: Trash2 },
    ],
  },
];

export const SETTINGS_SECTIONS: SettingsSection[] = SETTINGS_GROUPS.flatMap((g) => g.items);

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
