/**
 * OverviewScreen — the landing screen of Settings, drawn to the Phase B
 * Overview boards 8137:216346 / 8137:216089 (IA §25).
 *
 * The site's state first when it is not the ordinary one (archived; its
 * workspace scheduled for deletion — plan #10 / M3), a NEEDS ATTENTION card
 * (hidden when nothing needs it), then one card per nav group (8137:216346):
 * the group's title over a line naming its screens. Each name opens its screen
 * — the same navigation the sidebar makes — and carries that screen's one-line
 * summary, composed from `siteDetail.settingsOverview`, as its description.
 *
 * The pane header (`Settings` · `<site> · everything on this page…` · the
 * Search field) and the footer (`Pick a section…` · `Done`) are the shell's.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { LoadCard, SET_BTN, SET_CARD, Screen } from "../shared";
import {
  SETTINGS_NAV,
  SETTINGS_NAV_GROUP_ORDER,
  SETTINGS_NAV_GROUPS,
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
    case "access":
      return `${o.access.passwordSet ? "Password on" : "No password"} · ${plural(o.access.shareLinks, "share link")}`;
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
    case "danger-zone":
      return o.site.archived ? "Archived · hidden from the Sites list" : "Archive, transfer or delete";
    case "webhooks": {
      if (!o.webhooks.endpoints) return "No webhook endpoints";
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

/* 8137:216346 / 8137:216089 "Overview group cards": two 536 cards a row, 16
   apart, in sidebar order. Each is a 16/24 title over a 13/20 muted line naming
   the group's screens; each name opens its screen. The workspace doors close
   the grid as a seventh card of the same shape (the board stops at six). */
const CARD_TITLES: Partial<Record<SettingsNavGroupId, string>> = { workspace: "Workspace" };

/* The board's line for Danger zone names the screen's actions, not a screen. */
const LINE_OVERRIDES: Partial<Record<SettingsNavId, string>> = { "danger-zone": "Archive · Transfer · Delete site" };

const CARD_TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";

/* An inline name in the card's line: 13/20 muted, no box — the flowbite link
   Button's height, padding and accent colour replaced per property. */
const LINE_LINK =
  "tw:inline tw:h-auto tw:min-h-0 tw:rounded-[var(--bk-radius-sm)] tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 " +
  "tw:text-[var(--bk-ink-muted)] tw:no-underline tw:hover:text-[var(--bk-accent)] tw:hover:underline " +
  "tw:focus:ring-0 tw:focus:shadow-none tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export interface OverviewScreenProps {
  projectId?: string | null;
  /** The site's name as the editor has it — the state strip's subject. */
  siteName: string;
  /** A row's `›` / an attention row's `Open ›` — the same nav the sidebar makes. */
  onOpenScreen: (id: SettingsNavId) => void;
}

/* 8137:216346: 16 in, 12 down, a 4 radius, 13/20 ink; the action under the line. */
const STATE_NOTICE =
  "tw:flex tw:flex-col tw:items-start tw:gap-2 tw:rounded-[var(--bk-radius-sm)] tw:px-4 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";

const LOAD_TITLE = "Overview";
const LOAD_LINE = "Where every setting stands.";
const LOAD_ERROR = "Couldn't load the overview. Check your connection, then try again.";

export const OverviewScreen: React.FC<OverviewScreenProps> = ({ projectId, siteName, onOpenScreen }) => {
  const [data, setData] = React.useState<SettingsOverview | null>(null);
  const [unarchiving, setUnarchiving] = React.useState(false);
  const [unarchiveError, setUnarchiveError] = React.useState<string | null>(null);
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

  const workspaceDeletion = data.site.workspaceDeletionAt ? new Date(data.site.workspaceDeletionAt) : null;

  const unarchive = () => {
    if (!projectId) return;
    setUnarchiving(true);
    setUnarchiveError(null);
    getBuildrikClient(DASHBOARD_URL)
      .sites.unarchive.mutate({ id: projectId })
      .then(() => setAttempt((n) => n + 1))
      .catch((e: unknown) => setUnarchiveError(e instanceof Error ? e.message : "Couldn't unarchive the site."))
      .finally(() => setUnarchiving(false));
  };

  return (
    <Screen>
      {/* 8137:216346 (M3): an archived site says so, with Unarchive. */}
      {data.site.archived ? (
        <section className={`${STATE_NOTICE} tw:bg-[var(--bk-accent-tint)]`} aria-label="Site state" data-testid="set-ov-state">
          <p className="tw:m-0">{`${siteName} is archived. The live site stays up.`}</p>
          <Button type="button" size="xs" className={`${SET_BTN} tw:h-7 tw:px-3`} disabled={unarchiving} onClick={unarchive} data-testid="set-ov-unarchive">
            Unarchive
          </Button>
          {unarchiveError ? <p className="tw:m-0 tw:text-[var(--bk-error)]" role="alert">{unarchiveError}</p> : null}
        </section>
      ) : null}
      {/* The workspace's own deletion (PD-5) — 8137:216089's strip, said of the workspace. */}
      {workspaceDeletion ? (
        <section className={`${STATE_NOTICE} tw:bg-[var(--bk-warning-tint)]`} aria-label="Workspace state" data-testid="set-ov-workspace-deletion">
          <p className="tw:m-0">
            {`${data.site.name}'s workspace is pending deletion. It permanently deletes on ${workspaceDeletion.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}, with every site in it.`}
          </p>
        </section>
      ) : null}
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

      <div className="tw:grid tw:grid-cols-2 tw:gap-4" data-testid="set-ov-groups">
        {SETTINGS_NAV_GROUP_ORDER.map((group) => {
          const navs = SETTINGS_NAV.filter((n) => n.group === group);
          return (
            <section
              key={group}
              className={`${SET_CARD} tw:flex tw:min-w-0 tw:flex-col tw:gap-2 tw:p-6 tw:[box-shadow:var(--bk-shadow-raised)]`}
              aria-label={CARD_TITLES[group] ?? SETTINGS_NAV_GROUPS[group]}
              data-testid={`set-ov-group-${group}`}
            >
              <h3 className={CARD_TITLE}>{CARD_TITLES[group] ?? SETTINGS_NAV_GROUPS[group]}</h3>
              <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid={`set-ov-line-${group}`}>
                {navs.map((nav, i) => (
                  <React.Fragment key={nav.id}>
                    {i > 0 ? <span aria-hidden>{" · "}</span> : null}
                    <Button
                      type="button"
                      variant="link"
                      className={LINE_LINK}
                      title={summaryLine(nav.id, data)}
                      aria-description={summaryLine(nav.id, data)}
                      onClick={() => onOpenScreen(nav.id)}
                      data-testid={`set-ov-row-${nav.id}`}
                    >
                      {LINE_OVERRIDES[nav.id] ?? nav.title}
                    </Button>
                    {attentionFor(nav.id) ? (
                      <span
                        className="tw:ml-1 tw:inline-block tw:size-1.5 tw:rounded-full tw:bg-[var(--bk-warning)] tw:align-middle"
                        role="img"
                        aria-label="Needs attention"
                        data-testid={`set-ov-dot-${nav.id}`}
                      />
                    ) : null}
                  </React.Fragment>
                ))}
              </p>
            </section>
          );
        })}
      </div>
    </Screen>
  );
};
