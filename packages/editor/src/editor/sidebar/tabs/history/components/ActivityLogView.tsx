/**
 * ActivityLogView — site-scoped activity log (B6, code-gap plan).
 *
 * Reads rows from the dashboard via ActivityService; renders them as a
 * list with a 4-filter chip row (All · Edits · Comments · Publish). The
 * SAME shape as the dashboard Activity log the Sidebar SiteMenu deep-links
 * into today — the editor mirror keeps the same vocabulary.
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
import type { ActivityLogViewProps } from "../types";
import {
  ActivityReadError,
  fetchRecentActivity,
  type ActivityEntry,
  type ActivityFilter,
} from "@/services/ActivityService";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

type LoadState = "loading" | "ready" | "empty" | "error" | "permission" | "unavailable";

const FILTER_LIST: ActivityFilter[] = ["all", "edits", "comments", "publish"];

const FILTER_LABEL: Record<ActivityFilter, string> = {
  all: "All",
  edits: "Edits",
  comments: "Comments",
  publish: "Publish",
};

/* Reuse HistoryTab's chip style verbatim — chips live in one form across
   History, not two forms that drift. The same `tw:` strings live in
   HistoryTab.tsx; mirror them here rather than extracting, since the
   Saves filter chips and the Activity filter chips are siblings living
   in the same header band visually. (Plan-follower note: M1 chips vs
   B6 chips share intent — chip over a list, accent on active.) */
const FILTER_ROW =
  "tw:flex tw:gap-[var(--bk-space-4)] tw:pt-[var(--bk-space-8)] tw:px-[var(--bk-space-12)]";
const FILTER_CHIP =
  "tw:px-[var(--bk-space-8)] tw:py-[var(--bk-space-4)] tw:text-[12px] " +
  "tw:h-6 tw:leading-4 tw:font-normal tw:[font-family:inherit] tw:text-[var(--bk-ink-soft)] " +
  "tw:bg-transparent tw:border tw:border-[var(--bk-border)] tw:rounded-full " +
  "tw:cursor-pointer tw:[transition:color_150ms_ease-out,background-color_150ms_ease-out,border-color_150ms_ease-out] " +
  "tw:hover:text-[var(--bk-ink)] tw:focus-visible:outline-none " +
  "tw:focus-visible:shadow-[var(--bk-shadow-focus)]";
const FILTER_CHIP_ACTIVE =
  "tw:font-medium tw:text-[var(--bk-accent-on)] tw:bg-[var(--bk-accent)] tw:border-[var(--bk-accent)]";

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
/* The row's clickable body: ghost, left-aligned, the row's own two lines. */
const ROW_OPEN =
  "tw:h-auto tw:w-full tw:flex-col tw:items-stretch tw:gap-[var(--bk-space-2)] tw:border-transparent tw:bg-transparent " +
  "tw:p-0 tw:text-left tw:font-normal tw:hover:bg-transparent tw:disabled:opacity-100";

const LIST_CLASS = "tw:flex tw:flex-col tw:gap-[var(--bk-space-4)] tw:px-[var(--bk-space-12)]";
const ROW_CLASS =
  "tw:flex tw:flex-col tw:gap-[var(--bk-space-2)] tw:rounded-md tw:border tw:border-[var(--bk-border)] " +
  "tw:px-3 tw:py-2 tw:bg-transparent";
const ROW_META =
  "tw:flex tw:items-center tw:gap-[var(--bk-space-4)] tw:text-[11px] tw:text-[var(--bk-ink-muted)]";
const ROW_SUMMARY = "tw:text-[13px] tw:text-[var(--bk-ink)] tw:m-0 tw:whitespace-pre-wrap";
const ROW_DEEP_LINK =
  "tw:text-[12px] tw:text-[var(--bk-accent)] tw:no-underline tw:hover:underline tw:self-start";

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
        className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)]"
      >
        <EmptyState
          title="No site selected"
          body="Open this site from the dashboard to see its activity log."
        />
      </section>
    );
  }

  return (
    <>
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
        className="tw:flex-1 tw:min-h-0 tw:overflow-y-auto tw:flex tw:flex-col tw:pb-[var(--bk-space-16)]"
      >
        {state === "loading" && (
          <div className={LIST_CLASS} data-testid="activity-loading">
            <SkeletonListItem />
            <SkeletonListItem />
            <SkeletonListItem />
          </div>
        )}

        {state === "empty" && (
          <div className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)]" data-testid="activity-empty">
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
          <div className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)]" data-testid="activity-error">
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
            className="tw:px-[var(--bk-space-12)] tw:py-[var(--bk-space-16)]"
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
          <ul className={LIST_CLASS} data-testid="activity-rows">
            {rows.map((r) => (
              <li key={r.id} className={ROW_CLASS} data-kind={r.kind}>
                <Button
                  color="light"
                  size="xs"
                  disabled={!onOpenRow}
                  onClick={() => onOpenRow?.(r.kind)}
                  aria-label={`${ROW_KIND_LABEL[r.kind]}: ${r.summary} — ${OPEN_IN[r.kind]}`}
                  className={ROW_OPEN}
                  data-testid="activity-row-open"
                >
                <div className={ROW_META}>
                  <span data-testid="activity-kind">{ROW_KIND_LABEL[r.kind]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{r.actorName ?? "Unknown"}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={typeof r.createdAt === "string" ? r.createdAt : r.createdAt.toISOString()}>
                    {formatDate(r.createdAt)}
                  </time>
                </div>
                <p className={ROW_SUMMARY}>{r.summary}</p>
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
    </>
  );
};

function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default ActivityLogView;
