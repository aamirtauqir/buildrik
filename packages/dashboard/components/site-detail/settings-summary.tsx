"use client";

import type { ReactNode } from "react";
import { ButtonLink, SectionCard } from "@/components/dashboard/primitives";
import { getEditorHref, useUnifiedEditorFlag } from "@/components/editor-route/unified-flag";

/**
 * Settings Phase B (PD-1, plan rows #50–53): the site's Settings, SEO, Domains
 * and Redirects are edited in ONE place — the editor's Site settings. These
 * dashboard tabs show the values read-only, and every card's
 * "Edit in Site settings ›" opens the editor on the matching screen through
 * the `?settings=<screen>` deep link (BE-11, `useDeepLink`).
 */

/** The editor screens a dashboard summary may open (`SettingsScreenId`). */
export type SiteSettingsScreen = "general" | "seo" | "domains" | "redirects" | "access" | "custom-code";

/** The editor, opened on one Site settings screen. */
export function siteSettingsHref(siteId: string, screen: SiteSettingsScreen, unified: boolean): string {
  const editor = getEditorHref(siteId, unified);
  return `${editor}${editor.includes("?") ? "&" : "?"}settings=${screen}`;
}

export function EditInSiteSettings({ siteId, screen }: { siteId: string; screen: SiteSettingsScreen }) {
  const unified = useUnifiedEditorFlag();
  return (
    <ButtonLink
      href={siteSettingsHref(siteId, screen, unified)}
      variant="ghost"
      size="sm"
      data-testid={`edit-in-site-settings-${screen}`}
    >
      Edit in Site settings ›
    </ButtonLink>
  );
}

/** The strip at the top of a read-only tab: where these values are edited. */
export function SummaryNotice({ children }: { children: ReactNode }) {
  return (
    <p
      className="rounded-lg px-4 py-3 text-body"
      style={{ backgroundColor: "var(--color-primary-subtle)", color: "var(--color-text-primary)" }}
      data-testid="settings-summary-notice"
    >
      {children}
    </p>
  );
}

/** A titled card of read-only rows, with its door into the editor. */
export function SummaryCard({
  title,
  siteId,
  screen,
  children,
}: {
  title: string;
  siteId: string;
  screen: SiteSettingsScreen;
  children: ReactNode;
}) {
  return (
    <SectionCard title={title} actions={<EditInSiteSettings siteId={siteId} screen={screen} />}>
      <dl className="divide-y">
        {children}
      </dl>
    </SectionCard>
  );
}

/** One label / value row; an empty value reads as `empty`, muted. */
export function SummaryRow({ label, value, empty = "Not set" }: { label: string; value: ReactNode; empty?: string }) {
  const blank = value === null || value === undefined || value === "";
  return (
    <div className="grid grid-cols-[180px_1fr] items-start gap-4 py-2.5 first:pt-0 last:pb-0" style={{ borderColor: "var(--color-border-default)" }}>
      <dt className="text-body-sm" style={{ color: "var(--color-text-secondary)" }}>
        {label}
      </dt>
      <dd className="min-w-0 break-words text-body" style={{ color: blank ? "var(--color-text-muted)" : "var(--color-text-primary)" }}>
        {blank ? empty : value}
      </dd>
    </div>
  );
}
