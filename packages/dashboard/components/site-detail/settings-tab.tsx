"use client";

import { SOCIAL_NETWORKS, type SocialNetwork } from "@buildrik/shared/schemas/site-detail";
import { SummaryCard, SummaryNotice, SummaryRow } from "./settings-summary";

/**
 * Site tab · Settings — read-only (Settings Phase B, PD-1, plan row #50).
 *
 * The name, URL slug, icons, password and custom code are edited in the
 * editor's Site settings (General · Access · Custom code). This tab shows what
 * is stored and opens the matching editor screen from each card. The password
 * is never shown — only whether one is set (`hasPublishedPassword`).
 */

const NETWORK_LABELS: Record<SocialNetwork, string> = {
  twitter: "Twitter / X",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  youtube: "YouTube",
  github: "GitHub",
};

interface SettingsTabProps {
  site: {
    id: string;
    name: string;
    slug: string;
    headCode: string | null;
    bodyCode: string | null;
    socialLinks: unknown;
    hasPublishedPassword: boolean;
    touchIcon: string | null;
    favicon: string | null;
    defaultLocale?: string | null;
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** `3 lines` / `Not set` — custom code is summarised, never echoed. */
const codeSummary = (code: string | null) => {
  const lines = code?.trim() ? code.trim().split(/\r?\n/).length : 0;
  return lines === 0 ? "" : `${lines} ${lines === 1 ? "line" : "lines"}`;
};

export function SettingsTab({ site }: SettingsTabProps) {
  const social = isRecord(site.socialLinks) ? site.socialLinks : {};
  const links = SOCIAL_NETWORKS.filter((n) => typeof social[n] === "string" && social[n]);

  return (
    <div className="space-y-6">
      <SummaryNotice>These settings are edited in the editor&rsquo;s Site settings. This is what is stored now.</SummaryNotice>

      <SummaryCard title="General" siteId={site.id} screen="general">
        <SummaryRow label="Site name" value={site.name} />
        <SummaryRow label="URL slug" value={site.slug ? <span className="font-mono">{site.slug}</span> : ""} />
        <SummaryRow label="Language" value={site.defaultLocale ?? ""} />
        <SummaryRow label="Favicon" value={site.favicon ?? ""} />
        <SummaryRow label="Touch icon" value={site.touchIcon ?? ""} />
      </SummaryCard>

      <SummaryCard title="Social profiles" siteId={site.id} screen="seo">
        {links.length === 0 ? (
          <SummaryRow label="Profiles" value="" empty="None set" />
        ) : (
          links.map((n) => <SummaryRow key={n} label={NETWORK_LABELS[n]} value={String(social[n])} />)
        )}
      </SummaryCard>

      <SummaryCard title="Access" siteId={site.id} screen="access">
        <SummaryRow label="Site password" value={site.hasPublishedPassword ? "A password is set" : ""} empty="Off" />
      </SummaryCard>

      <SummaryCard title="Custom code" siteId={site.id} screen="custom-code">
        <SummaryRow label="Head code" value={codeSummary(site.headCode)} />
        <SummaryRow label="Body code" value={codeSummary(site.bodyCode)} />
      </SummaryCard>
    </div>
  );
}
