/**
 * PublishHistory (P1) — the published-version list + republish (contract §5).
 *
 * A republish ("Republish v5 as v7", the v3 IA's word for rollback — G1-052,
 * owner decision 8 keeps the code's admin-only rule) is a NEW publish of a
 * stored version, never a mutation of history. The latest COMPLETED is the
 * live version (no republish of what is serving). Older versions republish if
 * their payload is still retained (the 20-most-recent keep it); pruned ones
 * are shown disabled with the reason. The action sits ON THE ROW — the
 * version picker it replaced (board 184:2) was a second screen for a choice
 * the list already makes visible.
 *
 * Load honours DF5: a failed load shows "couldn't load · Retry", never the empty
 * "no versions" state (fetchPublishHistory throws).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { AlertCircle, Check, CheckCircle2, Info, MoreHorizontal } from "lucide-react";
import { ConfirmDialog, EmptyState, Menu, MenuItem, Modal, Popover, Progress, Spinner, Button, Tooltip, VersionRow } from "@/editor/chrome-ui";
import { useEditorRole } from "./hooks/useEditorRole";
import { formatRelativeTime } from "@/shared/utils/relativeTime";
import { domainOf } from "@/editor/sidebar/tabs/publish/usePublishSnapshot";
import { roleAtLeast } from "@/services/RoleService";
import {
  fetchPublishHistory,
  fetchSitePublishState,
  rollbackToVersion,
  type PublishHistoryRow,
} from "../../services/PublishService";

export interface PublishHistoryProps {
  siteId: string;
  /**
   * Called with the id of the job the server created, so the shell can poll
   * the rollback the user just started.
   *
   * It used to take no argument, and nothing downstream had a job to watch —
   * so the three rollback boards were driven off `uiState`, which is
   * "published" for any already-live site with nothing in flight. The confirm
   * announced "Rolled back — v5 is live" the instant it was clicked, on a
   * rollback that had not reached the server. Observed live 2026-08-17: the
   * success modal at T+0s, and no new row in publish_build_jobs.
   */
  onRollbackStarted?: (jobId: string) => void;
  /** A row's "Compare" — opens the one Compare (B8) on the version before it
   *  and this one. Omitted = no Compare on the rows. */
  onCompare?: (from: { id: string; version: number }, to: { id: string; version: number }) => void;
  /** The details overlay's "Compare with current" (board 6881:70883). */
  onCompareWithCurrent?: (row: { id: string; version: number }) => void;
  /** The site name the details overlay leads with. */
  siteName?: string;
  /**
   * The shell's publish job, as far as this panel needs it. Three boards run
   * off one state: 184:37 "Rolling back…" (a bar while it publishes), 184:45
   * "Rolled back" (the green confirmation naming the new live version), and
   * 453:4064 "Rollback failed". The job lives in usePublishJob; this panel
   * knows which version was asked for and pairs the two. Omitted = no feed,
   * and the panel keeps its notice line only.
   */
  rollbackJob?: { state: "publishing" | "published" | "failed"; progress: number } | null;

}

type LoadState = "loading" | "ready" | "error";

/* Board 949:4474 runs "2h ago · 2d ago · 1w ago · 2w ago". This was a local
   day-granularity function that collapsed everything under 24h to "today" —
   so a publish two hours old and one twenty-three hours old read the same,
   in the one list whose whole job is telling versions apart in time. It was
   also a fourth inline copy of a helper whose own docstring says it replaced
   the other three. */
function relTime(iso: string | Date | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  return formatRelativeTime(then, { fallback: "weeks", justNowLabel: "just now" });
}

/* The version line is chrome-ui's VersionRow — Figma 240:6, whose own header
   names "Publish history" as a surface it was drawn for. */
/* 4418:74024: the LIVE banner runs full-bleed, the rows follow at a 56 pitch
   with no gap between them. */
const WRAP = "tw:flex tw:flex-col tw:min-w-0";
/* Board 949:4474's live banner — green tint block above the list. */
const LIVE_BANNER =
  "tw:rounded-none tw:bg-[var(--bk-success-tint)] tw:px-4 tw:py-2.5 tw:mb-2 tw:flex tw:flex-col tw:gap-1";
const LIVE_TITLE =
  "tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:font-semibold tw:text-[var(--bk-success-text)]";
const LIVE_DOT = "tw:size-2 tw:rounded-full tw:bg-[var(--bk-success)]";
const LIVE_META = "tw:text-xs tw:text-[var(--bk-ink-soft)]";
/* Board 949:4474 closes the list with the rule that makes a republish safe to
   try. It sits under the rows, not in a tooltip on each one. */
const FOOTER_NOTE = "tw:mt-2 tw:px-4 tw:text-xs tw:text-[var(--bk-ink-muted)]";
/* 4418:74024 — the time sits at the row's right, 11/16 muted. */
const ROW_TIME = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* The ⋯ shows on hover or focus, as 4418:74024 draws the rows bare. */
const ROW_MORE =
  "tw:opacity-0 tw:group-hover:opacity-100 tw:focus-visible:opacity-100 tw:aria-expanded:opacity-100 tw:size-6 tw:p-0 tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink-soft)] tw:hover:text-[var(--bk-ink)]";
/* 6881:71292 draws the menu items at a 30 pitch. */
const ROW_MENU_ITEM = "tw:h-[30px] tw:px-2.5";
const MENU_REASON = "tw:px-3 tw:pb-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* The Modal body already insets 24 (117a5a13e); the v3 boards (4418:73440,
   73462, 6881:70883) align the body text with the title, so no extra inset. */
const MODAL_INSET = "tw:px-0";
/* 184:29 — the sentence is ink-MUTED and 13/20; the body's own face is
   ink-soft, which is right for a paragraph and a shade too present for the
   line that explains a consequence. */
const CONFIRM_BODY = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
/* Board 184:24's info block — the accent-tinted box under the sentence. 52
   tall: 8 of lead, a 12/18 line, 2, an 11/16 line, 8. */
const INFO_BOX = "tw:mt-3 tw:rounded-lg tw:bg-[var(--bk-accent-tint)] tw:px-3 tw:py-2";
const INFO_TITLE = "tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-accent-text)]";
const INFO_META = "tw:m-0 tw:mt-0.5 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* Boards 184:45 / 453:4064 both open on a 32px status disc, centred. */
const STATUS_DISC_WRAP = "tw:flex tw:justify-center tw:mb-3.5";
const STATUS_DISC =
  "tw:flex tw:size-10 tw:items-center tw:justify-center tw:rounded-full tw:text-white";
const NOTICE = "tw:text-xs tw:text-[var(--bk-ink-muted)]";
/* Board 184:44 — the caption under the rollback progress bar. */
const PROGRESS_CAPTION = "tw:mt-2 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
/* Boards 184:52 / 453:4071 — the one sentence naming the outcome, 13/20, in
   ink (success) or error-text (failure), REGULAR weight in both. 184:53 /
   453:4072 are its footnote at 11/16, ink-muted and ink-soft respectively. */
const OUTCOME_LEAD = "tw:text-center tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const OUTCOME_SUB = "tw:mt-4 tw:text-center tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const OUTCOME_LEAD_ERROR =
  "tw:text-center tw:text-[13px] tw:leading-5 tw:font-normal tw:text-[var(--bk-error-text)]";
const OUTCOME_REASON =
  "tw:mt-2 tw:text-center tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]";


export const PublishHistory: React.FC<PublishHistoryProps> = ({
  siteId,
  onRollbackStarted,
  onCompare,
  onCompareWithCurrent,
  siteName,
  rollbackJob = null,
}) => {
  // P6 permissions boards: republish is admin-scoped (owner decision 8) —
  // non-admins see the row action disabled with "Ask an admin", never hidden.
  const canRollback = roleAtLeast(useEditorRole(), "ADMIN") !== false;
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<PublishHistoryRow[]>([]);
  const [confirm, setConfirm] = React.useState<PublishHistoryRow | null>(null);
  /* Board 6881:70883 — the deploy a row click is inspecting. */
  const [details, setDetails] = React.useState<PublishHistoryRow | null>(null);
  const [rowMenu, setRowMenu] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  /* Board 453:4064 answers a failed rollback with a MODAL, not a line of grey
     text under the header — and its copy carries the one fact the user needs
     first: the live site did not change. `failed` holds the version that was
     attempted plus the live version, because the board names both ("v5 could
     not be re-published. Your live site is unchanged — still v6."). */
  const [failed, setFailed] = React.useState<{ target: number; live?: number; reason: string } | null>(null);
  /** The versions a rollback is re-publishing, for boards 184:37 / 184:45. */
  const [rollingBack, setRollingBack] = React.useState<{ target: number; live?: number } | null>(null);
  /** Board 184:45 — set when the shell reports the rollback job finished. */
  const [rolledBack, setRolledBack] = React.useState<{ target: number; newLive: number; previous?: number } | null>(null);

  /* Board 949:4474's banner names the live DOMAIN, which the history rows do
     not carry. Best-effort and separate from `state`: a domain we cannot read
     costs the banner one clause, and must not turn the whole list into the
     load-error board. */
  const [liveDomain, setLiveDomain] = React.useState<string | null>(null);
  /* null = the site state has not answered yet. Distinct from false, so
     nothing renders a liveness claim in either direction while loading. */
  const [isPublished, setIsPublished] = React.useState<boolean | null>(null);

  /* Board 184:24 names three versions: the target, the one live now, and the
     number the re-publish will take. The first comes from the row; these two
     are derived here — and they answer DIFFERENT questions, which is why they
     no longer share a name. The newest row gives the next version NUMBER,
     true whether or not anything is serving. Whether a version is LIVE is a
     fact about the site, and its only source is the published URL: a
     COMPLETED job at index 0 survives an unpublish, so the old "index 0 is
     live by construction" made this banner announce a draft site as up while
     the panel two clicks away said it had never been published. Null until
     the site state answers, so nothing claims liveness either way midflight. */
  const latestVersion = rows[0]?.version;
  const nextVersion = latestVersion !== undefined ? latestVersion + 1 : "…";
  const liveVersion = isPublished ? latestVersion : undefined;

  const load = React.useCallback(async () => {
    setState("loading");
    try {
      setRows(await fetchPublishHistory(siteId));
      setState("ready");
    } catch {
      setState("error");
    }
    try {
      const { publishedUrl } = await fetchSitePublishState(siteId);
      setLiveDomain(domainOf(publishedUrl));
      setIsPublished(Boolean(publishedUrl));
    } catch {
      /* A failed read leaves liveness UNKNOWN. Setting false here would
         assert "not published" on a network blip and take the banner off a
         site that is up — the same lie as the old hardcoded true, pointing
         the other way. */
      setLiveDomain(null);
    }
  }, [siteId]);

  React.useEffect(() => { void load(); }, [load]);

  /* The rollback is not done when rollbackToVersion resolves — that only
     STARTS the job. The drawn end states (184:45 rolled back, 453:4064
     failed) belong to the job finishing, which the shell polls. */
  React.useEffect(() => {
    if (!rollingBack || !rollbackJob) return;
    if (rollbackJob.state === "published") {
      setRolledBack({
        target: rollingBack.target,
        newLive: (rollingBack.live ?? rollingBack.target) + 1,
        previous: rollingBack.live,
      });
      setRollingBack(null);
      setNotice(null);
      void load();
    } else if (rollbackJob.state === "failed") {
      setFailed({
        target: rollingBack.target,
        live: rollingBack.live,
        /* 453:4072's own sentence. This path had a second wording of its own
           ("The re-publish did not finish…"), so the same failure read
           differently depending on whether the request threw or the JOB
           failed — and only the throw path matched the board. One sentence,
           the board's. */
        reason: "Nothing was overwritten. Retry the republish, or pick a different version.",
      });
      setRollingBack(null);
      setNotice(null);
    }
  }, [rollbackJob, rollingBack, load]);

  const doRollback = async () => {
    const target = confirm;
    setConfirm(null);
    if (!target) return;
    try {
      setRollingBack({ target: target.version, live: rows[0]?.version });
      const { jobId } = await rollbackToVersion(siteId, target.id);
      setNotice(`Republishing version ${target.version} — publishing a new version…`);
      /* Hand the shell the job the server just created. Until this carried an
         id there was nothing to poll, and the outcome boards read a stale
         "published" that predated the click. */
      onRollbackStarted?.(jobId);
      await load();
      /* rollbackToVersion resolving means the job STARTED, not finished.
         Clearing the in-flight marker here made the progress modal
         unreachable, and clearing it "only when no feed exists" was wrong
         too: onRollbackStarted is what makes the shell begin polling, so the
         feed legitimately arrives a tick AFTER this line. The marker is
         consumed by the effect above, on the job's first terminal state. */
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      /* The three outcomes the service can actually produce (publish.service:
         NOT_ROLLBACKABLE, an in-progress CONFLICT, anything else). The board
         draws one modal; the reason line is what differs. */
      setRollingBack(null);
      setFailed({
        target: target.version,
        live: rows[0]?.version,
        reason: /PRECONDITION|rolled back to/i.test(msg)
          ? "That version's snapshot is no longer stored, so it cannot be re-published."
          : /CONFLICT|in progress/i.test(msg)
            ? "A publish is already running. Wait for it to finish, then try again."
            : "Nothing was overwritten. Retry the republish, or pick a different version.",
      });
    }
  };

  if (state === "loading") {
    return <EmptyState icon={<Spinner size="lg" />} body="Loading versions…" />;
  }
  if (state === "error") {
    return (
      <EmptyState
        icon={<AlertCircle size={24} aria-hidden="true" />}
        title="Couldn't load publish history"
        action={<Button color="light" size="xs" onClick={() => void load()}>Retry</Button>}
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 size={24} aria-hidden="true" />}
        title="No published versions yet"
        body="Publish this site and each version shows up here — you can republish any of the last 20."
      />
    );
  }

  return (
    <div className={WRAP}>
      {/* Board 949:4474 opens on WHAT IS LIVE, not on a list header. The
          board's banner also names the publisher ("by Ali"); no column on
          publish_build_jobs carries one, so that clause is absent rather than
          invented — the SHAPE is the contract, the sample is not.

          The "Published versions" header this replaced was a third label for
          a destination the tab strip and the sub-tab already name. */}
      {/* Hidden only when the site is KNOWN not to be serving. When the read
          failed we still show the version and when it went out — both true of
          the deploy itself — and drop the green LIVE claim, which is the one
          part an unread site state cannot support. */}
      {rows[0] && isPublished !== false && (
        <div className={LIVE_BANNER}>
          <div className={LIVE_TITLE}>
            {isPublished && <span className={LIVE_DOT} aria-hidden="true" />}
            {isPublished ? "LIVE · " : ""}v{rows[0].version}
          </div>
          <div className={LIVE_META}>
            {liveDomain ? `${liveDomain} · ` : ""}
            published {relTime(rows[0].completedAt)}
          </div>
        </div>
      )}
      {notice && <div className={NOTICE}>{notice}</div>}
      {rows.map((r, i) => {
        const isLive = i === 0 && Boolean(isPublished);
        // rolledBackFrom is a job id — map it to that version's number for the label.
        const fromVersion = r.rolledBackFrom
          ? rows.find((x) => x.id === r.rolledBackFrom)?.version
          : undefined;
        /* Decision #19: disabled-with-reason, never hidden — aria-disabled
           (not `disabled`), and the menu says why beneath the item. */
        const why = !canRollback
          ? "Ask an admin to republish"
          : r.rollbackable
            ? null
            : "This version's snapshot is no longer stored";
        const prev = rows[i + 1];
        return (
          <VersionRow
            key={r.id}
            data-version-row
            data-version={r.version}
            className="tw:group"
            /* Board 4418:74024: a deploy row opens its details overlay
               (6881:70883). The row's own ⋯ stays its own. */
            interactive
            onClick={(e: React.MouseEvent) => {
              if ((e.target as HTMLElement).closest("button")) return;
              setDetails(r);
            }}
            /* 4418:74024 writes the row "v6 · live" behind a green dot, the
               time at the right, and no chip. */
            title={isLive ? `v${r.version} · live` : `v${r.version}`}
            state={isLive ? "live" : undefined}
            /* Titles sit in one column past the live dot's slot (4418:74024). */
            leading={isLive ? undefined : <span className="tw:size-2 tw:flex-none" aria-hidden="true" />}
            meta={fromVersion !== undefined ? `↩ from v${fromVersion}` : ""}
            actions={
              <>
                <span className={ROW_TIME}>{relTime(r.completedAt)}</span>
                {/* Board 6881:71292 — every action lives in the row's ⋯:
                    View details · Compare with current · Republish vN…
                    "Compare with vN-1" stays as a fourth item: it is the
                    row's older Compare, and parity never drops a capability. */}
                <Popover
                  open={rowMenu === r.id}
                  onClose={() => setRowMenu(null)}
                  placement="bottom-end"
                  label={`v${r.version} actions`}
                  trigger={
                    <Button
                      color="light"
                      size="xs"
                      className={ROW_MORE}
                      aria-label={`v${r.version} actions`}
                      aria-haspopup="menu"
                      aria-expanded={rowMenu === r.id}
                      onClick={() => setRowMenu((v) => (v === r.id ? null : r.id))}
                      data-testid={`publish-row-menu-${r.version}`}
                    >
                      <MoreHorizontal size={14} aria-hidden="true" />
                    </Button>
                  }
                >
                  <Menu label={`v${r.version} actions`}>
                    <MenuItem
                      className={ROW_MENU_ITEM}
                      onClick={() => {
                        setRowMenu(null);
                        setDetails(r);
                      }}
                    >
                      View details
                    </MenuItem>
                    {onCompareWithCurrent ? (
                      <MenuItem
                        className={ROW_MENU_ITEM}
                        onClick={() => {
                          setRowMenu(null);
                          onCompareWithCurrent({ id: r.id, version: r.version });
                        }}
                      >
                        Compare with current
                      </MenuItem>
                    ) : null}
                    {onCompare && prev ? (
                      <MenuItem
                        className={ROW_MENU_ITEM}
                        aria-label={`Compare v${prev.version} to v${r.version}`}
                        onClick={() => {
                          setRowMenu(null);
                          onCompare({ id: prev.id, version: prev.version }, { id: r.id, version: r.version });
                        }}
                      >
                        Compare with v{prev.version}
                      </MenuItem>
                    ) : null}
                    {/* The live version carries no republish: republishing
                        what is serving changes nothing. */}
                    {!isLive ? (
                      <MenuItem
                        aria-disabled={why ? "true" : undefined}
                        className={why ? `${ROW_MENU_ITEM} tw:cursor-not-allowed tw:text-[var(--bk-ink-disabled)] tw:hover:bg-transparent` : ROW_MENU_ITEM}
                        onClick={
                          why
                            ? undefined
                            : () => {
                                setRowMenu(null);
                                setConfirm(r);
                              }
                        }
                        data-testid={`publish-republish-${r.version}`}
                      >
                        Republish v{r.version}…
                      </MenuItem>
                    ) : null}
                    {!isLive && why ? (
                      <p className={MENU_REASON} data-testid={`publish-republish-why-${r.version}`}>
                        {why}
                      </p>
                    ) : null}
                  </Menu>
                </Popover>
              </>
            }
          />
        );
      })}

      {/* Board 949:4474 states the rule that makes a republish safe to try,
          once, under the list. Both halves matter: nothing is lost, AND a
          republish is itself a deploy. */}
      <p className={`${FOOTER_NOTE} tw:flex tw:items-center tw:gap-1`}>
        Every publish is restorable. Republishing a version redeploys it as a new one.
        {/* Board 7293:80948 — the notes ⓘ. */}
        <Tooltip
          content={
            <>
              Republish an available version to create a new deployment.
              <br />
              The last 20 published versions are retained.
            </>
          }
        >
          <span tabIndex={0} role="img" aria-label="About published versions" data-testid="publish-history-notes-info">
            <Info size={12} aria-hidden="true" />
          </span>
        </Tooltip>
      </p>

      <Modal
        open={details !== null}
        onClose={() => setDetails(null)}
        kind="form"
        testId="publish-version-details"
        title="Published version"
        footer={
          <div className="tw:flex tw:justify-end tw:gap-2">
            <Button color="light" size="xs" className="tw:border-transparent tw:bg-transparent" onClick={() => setDetails(null)}>
              Close
            </Button>
            {onCompareWithCurrent && details ? (
              <Button
                color="light"
                size="xs"
                onClick={() => {
                  onCompareWithCurrent({ id: details.id, version: details.version });
                  setDetails(null);
                }}
              >
                Compare with current
              </Button>
            ) : null}
            {details && !(rows[0]?.id === details.id && isPublished) && canRollback && details.rollbackable ? (
              <Button
                size="xs"
                onClick={() => {
                  setConfirm(details);
                  setDetails(null);
                }}
              >
                Republish v{details.version}…
              </Button>
            ) : null}
          </div>
        }
      >
        <div className={MODAL_INSET}>
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            {[siteName, liveDomain].filter(Boolean).join(" · ")}
          </p>
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            Inspect this deploy before republishing it. Your current draft stays unchanged.
          </p>
          <p className="tw:m-0 tw:mt-4 tw:text-[13px] tw:text-[var(--bk-ink)]">Selected deploy</p>
          <p className="tw:m-0 tw:mt-2 tw:text-[13px] tw:text-[var(--bk-ink)]" data-testid="publish-version-details-line">
            {details ? `v${details.version} · published ${relTime(details.completedAt)}` : ""}
          </p>
        </div>
      </Modal>

      {/* Board 184:37 — "Rolling back…", a determinate bar, and the caption
          naming both versions. Rendered only while the shell reports a job in
          flight; without a progress feed the panel keeps its notice line. */}
      {/* `question`, not `form`: 184:39 is a modal/440 and `form` is the 560.
          The width is the board's, and it was 120px wide of nobody's. */}
      <Modal
        open={rollingBack !== null && rollbackJob?.state === "publishing"}
        onClose={() => setRollingBack(null)}
        kind="question"
        width="sm"
        testId="publish-rollback-progress"
        title={
          rollingBack?.live !== undefined
            ? `Republishing v${rollingBack.target} as v${rollingBack.live + 1}…`
            : "Republishing…"
        }
      >
        <div className={MODAL_INSET}>
          {/* 184:42 draws the track bg-subtle with a 4 radius and 184:43 fills it
              --color/accent. flowbite's own defaults are gray-200, a full pill,
              and `bg-primary-600` — which resolves to `var(--bk-blue-600)` (blue-600), one
              step off the single accent `var(--bk-blue-700)` this product allows. Measured,
              not assumed: the fill read rgb(28,100,242) before this.
              `className` lands on the TRACK and `data-testid` on the root — the
              two reach different elements (Progress.js:41) — and `theme.color`
              has to be overridden rather than `theme.bar`, because the color
              class is twMerged AFTER bar and would win. */}
          <Progress
            progress={rollbackJob?.progress ?? 0}
            size="sm"
            data-testid="publish-rollback-bar"
            className="tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)]"
            theme={{ bar: "tw:rounded-[4px]", color: { default: "tw:bg-[var(--bk-accent)]" } }}
          />
          {/* 184:44 is 12/18 ink-muted — the modal body's own 13/ink-soft is the
              paragraph face, and this is a caption under a bar. */}
          <p className={PROGRESS_CAPTION} data-testid="publish-rollback-caption">
            Publishing v{rollingBack?.target} as v
            {rollingBack?.live !== undefined ? rollingBack.live + 1 : "…"}
          </p>
        </div>
      </Modal>

      {/* Board 184:45 — the green confirmation. It names what is live now AND
          that the version it replaced is still rollable, which is the whole
          reassurance: a rollback here never destroys anything. */}
      <Modal
        open={rolledBack !== null}
        onClose={() => setRolledBack(null)}
        kind="question"
        width="sm"
        closeButton
        testId="publish-rolledback"
        title="Version republished"
        footer={
          <div className="tw:flex tw:w-full tw:justify-center">
            <Button onClick={() => setRolledBack(null)}>Close</Button>
          </div>
        }
      >
        {/* Board 184:45 leads with a green check disc. The outcome of a
            rollback is the one thing a user scans for before reading a word,
            and the modal had no such mark at all. */}
        <div className={STATUS_DISC_WRAP}>
          <span className={`${STATUS_DISC} tw:bg-[var(--bk-success)]`} aria-hidden="true">
            <Check size={16} strokeWidth={2.5} />
          </span>
        </div>
        <div className={MODAL_INSET}>
        {/* 184:52 is 13/20 in INK — the modal body paints ink-soft, which is
            right for a paragraph and wrong for the one sentence naming what is
            live now. */}
        <p className={OUTCOME_LEAD} data-testid="publish-rolledback-lead">
          v{rolledBack?.newLive} is live — a re-publish of v{rolledBack?.target}.
        </p>
        {rolledBack?.previous !== undefined && (
          <p className={OUTCOME_SUB} data-testid="publish-rolledback-sub">
            v{rolledBack.previous} remains in History. Live v{rolledBack.newLive} names v{rolledBack.target} as its source.
          </p>
        )}
        </div>
      </Modal>

      {/* Board 453:4064 — the failure modal. "Try again" reopens the confirm
          for the same version rather than firing a second rollback straight
          from an error dialog: after a failure the user should see what they
          are re-attempting. */}
      <ConfirmDialog
        open={failed !== null}
        testId="publish-rollback-failed"
        onClose={() => setFailed(null)}
        onConfirm={() => {
          const again = rows.find((r) => r.version === failed?.target) ?? null;
          setFailed(null);
          setConfirm(again);
        }}
        title="Republish failed"
        message={
          <>
            {/* Board 453:4064's red warning disc — the counterpart of the
                green one on 184:45, and read the same way: outcome first. */}
            <div className={STATUS_DISC_WRAP}>
              <span className={`${STATUS_DISC} tw:bg-[var(--bk-error)]`} aria-hidden="true">
                <AlertCircle size={16} />
              </span>
            </div>
            {/* 453:4071 is 13/20 error-text at Inter REGULAR, and 453:4072
                drops to 11/16 ink-soft. Both were the body's own type: the
                lead was bolded and the reason was a second 13px line, so the
                two sentences read as one weight-graded block instead of a
                headline and its footnote. */}
            <div className={MODAL_INSET}>
              <p className={OUTCOME_LEAD_ERROR} data-testid="publish-rollback-failed-lead">
                v{failed?.target} could not be re-published. Your live site is unchanged
                {failed?.live !== undefined ? ` — still v${failed.live}` : ""}.
              </p>
              <p className={OUTCOME_REASON} data-testid="publish-rollback-failed-reason">{failed?.reason}</p>
            </div>
          </>
        }
        confirmLabel="Try again"
        cancelLabel="Close"
      />

      {/* Board 184:24. Every sentence names a VERSION NUMBER, and that is the
          point of the board: "This re-publishes that version as a new one …
          your current draft is untouched" was the old copy, and it is vague
          exactly where the user is anxious — which version replaces which,
          and what happens to the one that is live right now. It also said
          "draft", which is not what a rollback touches.

          The panel knows all three numbers: the target, the live one, and the
          number the re-publish will take. */}
      <ConfirmDialog
        open={confirm !== null}
        testId="publish-rollback-confirm"
        width="sm"
        closeButton
        onClose={() => setConfirm(null)}
        onConfirm={() => void doRollback()}
        title={confirm ? `Republish v${confirm.version} as v${nextVersion}?` : "Republish?"}
        message={
          <>
            <div className={MODAL_INSET}>
            <p className={CONFIRM_BODY} data-testid="publish-rollback-confirm-body">
              This publishes v{confirm?.version} again as v{nextVersion}.
              {liveVersion !== undefined
                ? ` Your current v${liveVersion} stays in history`
                : " Your current version stays in history"}{" "}
              — nothing is deleted or rewritten.
            </p>
            {/* Board 4418:73440's info block, in its words: the live version
                stays in history, and the new entry carries its source. That
                is the fact that makes a rollback safe to try. */}
            <div className={INFO_BOX} data-testid="publish-rollback-info">
              <p className={INFO_TITLE} data-testid="publish-rollback-info-title">Your current published version remains in history.</p>
              <p className={INFO_META} data-testid="publish-rollback-info-meta">
                v{nextVersion} will name v{confirm?.version} as its source.
              </p>
            </div>
            </div>
          </>
        }
        /* Board 184:24's button is `var(--bk-yellow-500)` — `--bk-warning`, measured off the
           board. Not red: the modal spends its whole body saying nothing is
           deleted or rewritten, and then a red button would contradict it.
           Re-publishing an older version over a live site is a decision, not
           a deletion. */
        tone="warning"
        confirmLabel={confirm ? `Republish v${confirm.version}` : "Republish"}
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default PublishHistory;
