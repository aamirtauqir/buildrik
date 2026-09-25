/**
 * ActivityLogView — site-scoped activity log (B6, code-gap plan), the body of
 * the Activity panel (board 4418:140587; its own panel since the owner's
 * 2026-09-25 ruling — it was a fourth tab inside History).
 *
 * Reads rows from the dashboard via ActivityService; renders them as a
 * list with a 4-filter chip row (All · Edits · Comments · Publish).
 *
 * State machine:
 *   loading   on mount + filter change
 *   error        a retryable failure → Retry
 *   empty        service returned []
 *   ready        rows render
 *   permission   UNAUTHORIZED / FORBIDDEN — retrying will not fix it
 *   unavailable  NOT_FOUND: `activity.recent` is not on the dashboard yet
 *                (needs-dashboard). Also not retryable.
 * The last two offer "Open in dashboard" (DASHBOARD_URL, the same door the
 * site menu used before this tab existed). Never a permanently blank tab —
 * decision #31.
 *
 * `role="status"` + `aria-live="polite"` on the list region so a screen
 * reader announces the new row set after a filter change without re-reading
 * every row.
 *
 * No raw `<button>/<input>/<select>/<textarea>` (Gate 24) — chips route
 * through chrome-ui's Button, and the deep-link is a plain `<a>` styled
 * with `tw:` only.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, EmptyState, SkeletonListItem } from "@/editor/chrome-ui";
import {
  ActivityReadError,
  fetchRecentActivity,
  type ActivityEntry,
  type ActivityFilter,
} from "@/services/ActivityService";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export interface ActivityLogViewProps {
  /** Site the rows are scoped to. Null = opened without a project; the view
   *  renders a banner and not a query. */
  siteId: string | null;
  /** A row opens its subject in the editor — comments in Review, publishes
   *  in History › Published, edits in History › Session. */
  onOpenRow?: (kind: "edit" | "comment" | "publish") => void;
}

type LoadState = "loading" | "ready" | "empty" | "error" | "permission" | "unavailable";

const FILTER_LIST: ActivityFilter[] = ["all", "edits", "comments", "publish"];

const FILTER_LABEL: Record<ActivityFilter, string> = {
  all: "All",
  edits: "Edits",
  comments: "Comments",
  publish: "Publish",
};

/* Board 4418:140587: the body is inset 16 with 12 between blocks; the chips
   are 24-tall, 4px-radius, 11/16 medium — gray-100 fill + border at rest,
   the accent filled when active. */
const BODY = "tw:flex tw:flex-1 tw:min-h-0 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:p-4";
const FILTER_ROW = "tw:flex tw:gap-1.5";
const FILTER_CHIP =
  "tw:h-6 tw:min-h-0 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] " +
  "tw:bg-[var(--bk-gray-100)] tw:px-[11px] tw:py-0 tw:text-[11px] tw:leading-4 tw:font-medium " +
  "tw:text-[var(--bk-gray-700)] tw:hover:text-[var(--bk-ink)] tw:focus:ring-0 " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)]";
const FILTER_CHIP_ACTIVE =
  "tw:bg-[var(--bk-accent)] tw:text-[var(--bk-accent-on)] tw:hover:bg-[var(--bk-accent)] tw:hover:text-[var(--bk-accent-on)]";

const ROW_KIND_LABEL: Record<ActivityEntry["kind"], string> = {
  edit: "Edit",
  comment: "Comment",
  publish: "Publish",
};

/** Where a row opens, said to screen readers (the row itself is the button). */
const OPEN_IN: Record<ActivityEntry["kind"], string> = {
  edit: "open in Session",
  comment: "open in Review",
  publish: "open in Published",
};
/* Board 4418:140587's row: an 80 pitch (12 above, 24 below), the subject 14/20 over
   "who · when" 12/18, both ink, with an accent › at the right. No card. */
const ROW_OPEN =
  "tw:relative tw:h-auto tw:w-full tw:flex-col tw:items-stretch tw:gap-1.5 tw:rounded-none tw:border-0 " +
  "tw:bg-transparent tw:pt-3 tw:pb-6 tw:pl-0 tw:pr-10 tw:text-left tw:font-normal tw:hover:bg-[var(--bk-bg-subtle)] " +
  "tw:focus:ring-0 tw:focus-visible:shadow-[var(--bk-shadow-focus)] tw:disabled:opacity-100";
const ROW_TITLE = "tw:m-0 tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)] tw:whitespace-pre-wrap";
const ROW_META = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
const ROW_CHEVRON =
  "tw:absolute tw:left-[234px] tw:top-[22px] tw:text-[16px] tw:leading-none tw:font-medium tw:text-[var(--bk-accent)]";
const ROW_DEEP_LINK =
  "tw:text-[12px] tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline tw:self-start";
const STATE_BOX = "tw:py-4";

/** A row's `actionUrl` is written for the dashboard — often relative
 *  ("?page=page-1") — so it resolves against the site's dashboard page, never
 *  against the editor's own URL (QA 2026-09-24: the link reopened the editor). */
function dashboardHref(actionUrl: string, siteId: string): string {
  return new URL(actionUrl, `${DASHBOARD_URL}/dashboard/sites/${siteId}`).toString();
}

export const ActivityLogView: React.FC<ActivityLogViewProps> = ({ siteId, onOpenRow }) => {
  const [filter, setFilter] = React.useState<ActivityFilter>("all");
  const [state, setState] = React.useState<LoadState>("loading");
  const [rows, setRows] = React.useState<ActivityEntry[]>([]);

  const fetchSeq = React.useRef(0);

  const load = React.useCallback(
    async (next: ActivityFilter) => {
      const seq = ++fetchSeq.current;
      setState("loading");
      if (!siteId) return;
      try {
        const r = await fetchRecentActivity(siteId, next);
        if (seq !== fetchSeq.current) return; // stale
        setRows(r);
        setState(r.length === 0 ? "empty" : "ready");
      } catch (e) {
        if (seq !== fetchSeq.current) return;
        const reason = e instanceof ActivityReadError ? e.reason : "failed";
        setState(reason === "unauthorized" ? "permission" : reason === "unavailable" ? "unavailable" : "error");
      }
    },
    [siteId],
  );

  React.useEffect(() => {
    void load(filter);
  }, [filter, load]);

  // Cleanup on unmount: drop any in-flight response silently (the seq ref
  // already does this on the next load — but a focus-then-leave can leave
  // the state stale until the next filter click).
  React.useEffect(() => {
    return () => {
      fetchSeq.current++;
    };
  }, []);

  const handleRetry = React.useCallback(() => {
    void load(filter);
  }, [filter, load]);

  const handleOpen = React.useCallback((url: string) => {
    // Codebase convention: window.open with noopener/noreferrer — no
    // useShell().openExternal here, the topbar / SiteMenu follow the
    // same pattern.
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (!siteId) {
    return (
      <section
        role="status"
        aria-live="polite"
        data-testid="activity-no-site"
        className="tw:p-4"
      >
        <EmptyState
          title="No site selected"
          body="Open this site from the dashboard to see its activity log."
        />
      </section>
    );
  }

  return (
    <div className={BODY}>
      <div className={FILTER_ROW} role="group" aria-label="Activity filter">
        {FILTER_LIST.map((f) => (
          <Button
            key={f}
            type="button"
            aria-pressed={filter === f}
            className={`${FILTER_CHIP}${filter === f ? ` ${FILTER_CHIP_ACTIVE}` : ""}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABEL[f]}
          </Button>
        ))}
      </div>

      <section
        role="status"
        aria-live="polite"
        data-testid="activity-list"
        data-state={state}
        className="tw:flex tw:flex-col"
      >
        {state === "loading" && (
          <div className="tw:flex tw:flex-col tw:gap-1" data-testid="activity-loading">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        )}

        {state === "empty" && (
          <div className={STATE_BOX} data-testid="activity-empty">
            <EmptyState
              title="Nothing here yet"
              body={
                filter === "all"
                  ? "When someone edits, comments, or publishes, it will show up here."
                  : `No ${filter} activity yet.`
              }
            />
          </div>
        )}

        {state === "error" && (
          <div className={STATE_BOX} data-testid="activity-error">
            <EmptyState
              title="Couldn't load activity"
              body="Something went wrong on our side. Retry, or reopen Activity in a moment."
              action={
                <Button type="button" size="xs" onClick={handleRetry}>
                  Retry
                </Button>
              }
            />
          </div>
        )}

        {(state === "permission" || state === "unavailable") && (
          <div
            className={STATE_BOX}
            data-testid={`activity-${state}`}
          >
            <EmptyState
              title={state === "permission" ? "Can't show activity in the editor" : "Activity isn't in the editor yet"}
              body={
                state === "permission"
                  ? "Open the activity log in the dashboard to see who edited, commented, or published."
                  : "The activity log lives in the dashboard for now — it opens in a new tab."
              }
              action={
                <Button
                  type="button"
                  size="xs"
                  onClick={() => handleOpen(`${DASHBOARD_URL}/dashboard/sites/${siteId}#activity-log`)}
                >
                  Open in dashboard
                </Button>
              }
            />
          </div>
        )}

        {state === "ready" && (
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:p-0" data-testid="activity-rows">
            {rows.map((r) => (
              <li key={r.id} className="tw:flex tw:flex-col" data-kind={r.kind}>
                <Button
                  color="light"
                  size="xs"
                  disabled={!onOpenRow}
                  onClick={() => onOpenRow?.(r.kind)}
                  aria-label={`${ROW_KIND_LABEL[r.kind]}: ${r.summary} — ${OPEN_IN[r.kind]}`}
                  className={ROW_OPEN}
                  data-testid="activity-row-open"
                >
                  <p className={ROW_TITLE} data-testid="activity-row-title">{r.summary}</p>
                  <span className={ROW_META} data-testid="activity-row-meta">
                    {r.actorName ?? "Unknown"} ·{" "}
                    <time dateTime={typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString()}>
                      {formatWhen(r.createdAt)}
                    </time>
                  </span>
                  <span className={ROW_CHEVRON} aria-hidden="true">
                    ›
                  </span>
                </Button>
                {r.actionUrl && (
                  <a
                    href={dashboardHref(r.actionUrl, siteId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={ROW_DEEP_LINK}
                    data-testid="activity-dashboard-link"
                  >
                    View in dashboard
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

/** Board 4418:140587 stamps rows "Today 14:32" / "Yesterday 17:30"; older
 *  rows carry their date. */
function formatWhen(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (day === today) return `Today ${time}`;
  if (day === today - 86_400_000) return `Yesterday ${time}`;
  return `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })}, ${time}`;
}

export default ActivityLogView;
