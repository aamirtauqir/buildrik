/**
 * OverviewScreen — the landing screen of Settings, 2L9 B8-S01 238:9980.
 *
 * The site's state first when it is not the ordinary one (archived; its
 * workspace scheduled for deletion — plan #10 / M3), then the `Site` card: a
 * row each for where the site is live, its languages and its search
 * readiness, each with the way to the screen that changes it ("Domains ›",
 * "Languages ›", "SEO ›"). The board's Pro-trial card is not drawn: the
 * product has no trial (authority code:no-trial, memory plans-free-pro-trial).
 * Facts come from `siteDetail.settingsOverview`.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { LoadCard, SET_BTN, SET_CARD, Screen } from "../shared";
import type { SettingsNavId } from "../types";
import type { SettingsOverview } from "@buildrik/shared/schemas/site-detail";

/** The one read this screen makes — B's procedure, the brief's contract. */
function fetchOverview(siteId: string): Promise<SettingsOverview> {
  return getBuildrikClient(DASHBOARD_URL).siteDetail.settingsOverview.query({ siteId });
}

// ─── Row facts — the schema's facts, in the board's words ───────────────────

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** `Deutsch` — the language in its own name, else the code. */
function nativeName(locale: string): string {
  const language = locale.split(/[-_]/)[0];
  try {
    const name = new Intl.DisplayNames([language], { type: "language" }).of(language);
    if (name && name !== language) return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    /* an unknown code reads as itself */
  }
  return locale;
}

/** B8-S01 "English (default), Deutsch": the default locale first, marked. */
export function languagesLine(codes: readonly string[]): string {
  const [first, ...rest] = codes;
  if (!first) return "No languages";
  return [`${nativeName(first)} (default)`, ...rest.map(nativeName)].join(", ");
}

/** B8-S01 "2 pages without a description". */
export function searchLine(missing: number): string {
  return missing === 0 ? "Every page has a description" : `${plural(missing, "page")} without a description`;
}

// ─── Layout ──────────────────────────────────────────────────────────────────

/* B8-S01 `Card / Site`: 720 wide, 16 in, a 14/600 title, then 49-tall rows 10
   apart — the label in 240, the fact in 284, a 140 link at the right. */
const CARD = `${SET_CARD} tw:flex tw:w-full tw:max-w-180 tw:flex-col tw:gap-2.5 tw:p-4`;
const CARD_TITLE = "tw:m-0 tw:text-[length:var(--bk-text-14)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const ROW = "tw:flex tw:min-h-12 tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)]";
const ROW_LABEL = "tw:w-60 tw:shrink-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const ROW_FACT = "tw:min-w-0 tw:flex-1 tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const ROW_LINK = "tw:h-8 tw:w-35 tw:shrink-0 tw:justify-start tw:px-0 tw:text-[length:var(--bk-text-13)] tw:font-normal tw:no-underline tw:hover:underline";

export interface OverviewScreenProps {
  projectId?: string | null;
  /** The site's name as the editor has it — the state strip's subject. */
  siteName: string;
  /** A row's link ("Domains ›") — the same nav the sidebar makes. */
  onOpenScreen: (id: SettingsNavId) => void;
}

/* 8137:216346: 16 in, 12 down, a 4 radius, 13/20 ink; the action under the line. */
const STATE_NOTICE =
  "tw:flex tw:flex-col tw:items-start tw:gap-2 tw:rounded-[var(--bk-radius-sm)] tw:px-4 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";

const LOAD_TITLE = "Overview";
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
          state={failed ? "error" : "loading"}
          errorLine={LOAD_ERROR}
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </Screen>
    );
  }

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
      <section className={CARD} aria-label="Site" data-testid="set-ov-site">
        <h3 className={CARD_TITLE}>Site</h3>
        <div className="tw:flex tw:flex-col tw:gap-2.5">
          {(
            [
              { id: "live", label: "Live at", fact: data.domains.primary ?? "No custom domain", screen: "domains", link: "Domains ›" },
              { id: "languages", label: "Languages", fact: languagesLine(data.localization.codes), screen: "localization", link: "Languages ›" },
              { id: "search", label: "Search", fact: searchLine(data.seo.pagesWithoutDescription), screen: "seo", link: "SEO ›" },
            ] as const
          ).map((row) => (
            <div key={row.id} className={ROW} data-testid={`set-ov-row-${row.id}`}>
              <span className={ROW_LABEL}>{row.label}</span>
              <span className={ROW_FACT} data-testid={`set-ov-fact-${row.id}`}>
                {row.fact}
              </span>
              <Button
                type="button"
                variant="link"
                size="xs"
                className={ROW_LINK}
                onClick={() => onOpenScreen(row.screen)}
                data-testid={`set-ov-open-${row.id}`}
              >
                {row.link}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </Screen>
  );
};
