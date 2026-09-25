/**
 * OverviewScreen — Clone 3397:32915, the landing screen of Settings.
 *
 * A NEEDS ATTENTION card (hidden when nothing needs it) and one card per nav
 * group, each row being the section's icon, its title, a one-line summary
 * composed from `siteDetail.settingsOverview`, and `›` (or `↗` for the two
 * dashboard rows). A row click is the same navigation the sidebar makes.
 *
 * The pane header (`Settings` · `<site> · everything on this page…` · the
 * Search field) and the footer (`Pick a section…` · `Done`) are the shell's.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { ArrowUpRight, ChevronRight, TriangleAlert } from "lucide-react";
import { Button } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { LoadCard, SET_CARD, SET_EYEBROW, Screen } from "../shared";
import {
  SETTINGS_NAV,
  SETTINGS_NAV_GROUPS,
  WORKSPACE_LINKS,
  type SettingsNavDef,
  type SettingsNavGroupId,
} from "../constants";
import type { SettingsNavId } from "../types";
import type { SettingsOverview } from "@buildrik/shared/schemas/site-detail";

/** The one read this screen makes — B's procedure, the brief's contract. */
function fetchOverview(siteId: string): Promise<SettingsOverview> {
  return getBuildrikClient(DASHBOARD_URL).siteDetail.settingsOverview.query({ siteId });
}

// ─── Summary lines — the schema's facts, in the frame's words ───────────────

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** `English (en-US)` — the language's own name plus the locale as stored. */
function localeLabel(locale: string): string {
  const language = locale.split(/[-_]/)[0];
  let name: string | undefined;
  try {
    name = new Intl.DisplayNames(["en"], { type: "language" }).of(language);
  } catch {
    name = undefined;
  }
  return name && name !== language ? `${name} (${locale})` : locale;
}

function localeName(locale: string): string {
  return localeLabel(locale).replace(/ \(.*\)$/, "");
}

const PROVIDER_LABELS: Record<string, string> = {
  ga: "GA4",
  ga4: "GA4",
  googleAnalytics: "GA4",
  gtm: "GTM",
  googleTagManager: "GTM",
  facebookPixel: "Meta Pixel",
  metaPixel: "Meta Pixel",
  pixel: "Meta Pixel",
  clarity: "Clarity",
  plausible: "Plausible",
  posthog: "PostHog",
};

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function planLabel(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
}

export function summaryLine(id: SettingsNavId, o: SettingsOverview): string {
  switch (id) {
    case "general":
      return `${o.general.siteName || o.site.name} · ${localeLabel(o.general.language || o.site.defaultLocale)}`;
    case "localization": {
      const base = plural(o.localization.locales, "locale");
      return o.localization.notStarted.length
        ? `${base} · ${joinNames(o.localization.notStarted.map(localeName))} not started`
        : base;
    }
    case "seo":
      return `Indexing ${o.seo.allowIndexing ? "allowed" : "blocked"} · robots.txt ${o.seo.robotsTxtSet ? "set" : "default"}`;
    case "domains":
      if (!o.domains.primary) return "No custom domain";
      return o.domains.pendingDns
        ? `${o.domains.primary} · ${o.domains.pendingDns} DNS pending`
        : `${o.domains.primary} · DNS verified`;
    case "redirects":
      return `${plural(o.redirects.rules, "rule")} · ${plural(o.redirects.suggestions, "suggestion")}`;
    case "analytics": {
      const [first] = o.analytics.providers;
      if (!first) return "No provider";
      return `${PROVIDER_LABELS[first] ?? first} ${o.analytics.receiving ? "receiving data" : "not receiving yet"}`;
    }
    case "forms":
      return `${plural(o.forms.forms, "form")} · ${plural(o.forms.submissions, "submission")}`;
    case "custom-code": {
      const set = [o.customCode.head && "Head", o.customCode.body && "body", o.customCode.css && "CSS"].filter(
        (s): s is string => Boolean(s),
      );
      return set.length ? `${joinNames(set)} set` : "None set";
    }
    case "headers": {
      const on = [o.headers.csp && "CSP", o.headers.hsts && "HSTS"].filter((s): s is string => Boolean(s));
      return on.length ? `${joinNames(on)} on` : "Defaults";
    }
    case "integrations":
      return `${o.integrations.connected} connected · ${o.integrations.available} available`;
    case "webhooks": {
      if (!o.webhooks.endpoints) return "No endpoints";
      const last =
        o.webhooks.lastDelivery === null
          ? "no deliveries yet"
          : `last delivery ${o.webhooks.lastDelivery === "ok" ? "ok" : "failed"}`;
      return `${plural(o.webhooks.endpoints, "endpoint")} · ${last}`;
    }
    case "members":
      return `${o.members.used} of ${o.members.seats} seats used`;
    case "billing":
      return `${planLabel(o.billing.plan)} · $${o.billing.priceMonthly} / month`;
    default:
      return SETTINGS_NAV.find((n) => n.id === id)?.subtitle ?? "";
  }
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/** 4418:128917's two columns — the frame's card order, not the sidebar's. */
const OVERVIEW_COLUMNS: SettingsNavGroupId[][] = [
  ["site-setup", "seo-publishing"],
  ["visitors", "advanced", "workspace"],
];

/* 4418:128917: a 52 row, 16 in — two 14/20 lines and the › at the far right. */
const ROW_CLASS =
  "tw:flex tw:h-13 tw:w-full tw:items-center tw:justify-start tw:gap-3 tw:rounded-[var(--bk-radius-sm)] tw:border-0 " +
  "tw:bg-transparent tw:px-4 tw:py-1.5 tw:text-left tw:font-normal tw:no-underline tw:text-[var(--bk-ink)] " +
  "tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

const RowBody: React.FC<{ nav: SettingsNavDef; line: string; attention: boolean; external?: boolean }> = ({
  nav,
  line,
  attention,
  external,
}) => {
  return (
    <>
      <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
        <span className="tw:truncate tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]">
          {nav.title}
          {external ? <ArrowUpRight size={12} className="tw:ml-1 tw:inline tw:align-[-1px]" aria-hidden /> : null}
        </span>
        <span
          className="tw:truncate tw:text-[length:var(--bk-text-14)] tw:leading-5 tw:text-[var(--bk-ink)]"
          data-testid={`set-ov-row-line-${nav.id}`}
        >
          {line}
        </span>
      </span>
      {attention ? (
        <span
          className="tw:size-1.5 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-warning)]"
          role="img"
          aria-label="Needs attention"
        />
      ) : null}
      {external ? (
        <ArrowUpRight size={14} className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" aria-hidden />
      ) : (
        <ChevronRight size={14} className="tw:shrink-0 tw:text-[var(--bk-ink-muted)]" aria-hidden />
      )}
    </>
  );
};

export interface OverviewScreenProps {
  projectId?: string | null;
  /** A row's `›` / an attention row's `Open ›` — the same nav the sidebar makes. */
  onOpenScreen: (id: SettingsNavId) => void;
}

const LOAD_TITLE = "Overview";
const LOAD_LINE = "Where every setting stands.";
const LOAD_ERROR = "Couldn't load the overview. Check your connection, then try again.";

export const OverviewScreen: React.FC<OverviewScreenProps> = ({ projectId, onOpenScreen }) => {
  const [data, setData] = React.useState<SettingsOverview | null>(null);
  const [failed, setFailed] = React.useState(false);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!projectId) {
      setFailed(true);
      return;
    }
    let cancelled = false;
    setData(null);
    setFailed(false);
    fetchOverview(projectId)
      .then((o) => {
        if (!cancelled) setData(o);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, attempt]);

  if (!data) {
    return (
      <Screen>
        <LoadCard
          title={LOAD_TITLE}
          line={LOAD_LINE}
          state={failed ? "error" : "loading"}
          errorLine={LOAD_ERROR}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </Screen>
    );
  }

  const attentionFor = (id: SettingsNavId) => data.attention.some((a) => a.section === id);
  const isNavId = (s: string): s is SettingsNavId => SETTINGS_NAV.some((n) => n.id === s);

  return (
    <Screen>
      {data.attention.length ? (
        <section
          className="tw:flex tw:flex-col tw:gap-2 tw:rounded-[var(--bk-radius-lg)] tw:border tw:border-[var(--bk-yellow-100)] tw:bg-[var(--bk-warning-tint)] tw:p-3"
          aria-label="Needs attention"
          data-testid="set-ov-attention"
        >
          <div className="tw:flex tw:items-center tw:gap-2 tw:px-1">
            <TriangleAlert size={14} className="tw:text-[var(--bk-warning)]" aria-hidden />
            <span className="tw:text-[length:var(--bk-text-11)] tw:font-semibold tw:uppercase tw:leading-4 tw:tracking-[0.06em] tw:text-[var(--bk-warning)]">
              Needs attention
            </span>
            <span className="tw:rounded-full tw:bg-[var(--bk-warning)] tw:px-1.5 tw:text-[length:var(--bk-text-11)] tw:font-semibold tw:leading-4 tw:text-[var(--bk-accent-on)]">
              {data.attention.length}
            </span>
          </div>
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0">
            {data.attention.map((item, i) => (
              <li
                key={`${item.kind}-${i}`}
                className="tw:flex tw:items-center tw:gap-3 tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:px-3 tw:py-2"
                data-testid={`set-ov-attention-${i}`}
              >
                <span className="tw:size-1.5 tw:shrink-0 tw:rounded-full tw:bg-[var(--bk-warning)]" aria-hidden />
                <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-0.5">
                  <span className="tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-4 tw:text-[var(--bk-ink)]">
                    {item.title}
                  </span>
                  <span className="tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
                    {item.detail}
                  </span>
                </span>
                <Button
                  type="button"
                  variant="link"
                  className="tw:text-[length:var(--bk-text-12)] tw:font-medium"
                  disabled={!isNavId(item.section)}
                  onClick={() => {
                    if (isNavId(item.section)) onOpenScreen(item.section);
                  }}
                  data-testid={`set-ov-attention-open-${i}`}
                >
                  Open ›
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="tw:flex tw:items-start tw:gap-8">
        {OVERVIEW_COLUMNS.map((column) => (
        <div key={column[0]} className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-6">
        {column.map((group) => (
          <section
            key={group}
            className={`${SET_CARD} tw:flex tw:flex-col tw:gap-2 tw:px-6 tw:py-5`}
            aria-label={SETTINGS_NAV_GROUPS[group]}
            data-testid={`set-ov-group-${group}`}
          >
            <h3 className={`${SET_EYEBROW} tw:m-0`}>{SETTINGS_NAV_GROUPS[group]}</h3>
            <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:p-0">
              {SETTINGS_NAV.filter((n) => n.group === group).map((nav) => (
                <li key={nav.id}>
                  {nav.kind === "external" ? (
                    <a
                      href={`${DASHBOARD_URL}${WORKSPACE_LINKS[nav.id] ?? "/dashboard"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={ROW_CLASS}
                      data-testid={`set-ov-row-${nav.id}`}
                    >
                      <RowBody nav={nav} line={summaryLine(nav.id, data)} attention={attentionFor(nav.id)} external />
                    </a>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      className={ROW_CLASS}
                      onClick={() => onOpenScreen(nav.id)}
                      data-testid={`set-ov-row-${nav.id}`}
                    >
                      <RowBody nav={nav} line={summaryLine(nav.id, data)} attention={attentionFor(nav.id)} />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
        </div>
        ))}
      </div>
    </Screen>
  );
};
