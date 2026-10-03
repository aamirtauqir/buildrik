/**
 * FormsScreen — VISITORS › Form submissions (8136:216977 inbox; states
 * 4418:130583 loading … 4418:131093 inbox-empty; delete 4418:131840).
 *
 * One inbox for every form on the site (`Submissions · All Forms`): FORM ·
 * FROM · RECEIVED · STATUS, a red `Delete` (asks first — a submission is a
 * visitor's own data and the delete has no undo) and `Configure in Inspector
 * ›`, which leaves Settings with that form selected on its page (the form is
 * configured on the element — Q-B1 / S4 Q1: no "Add form" here). The FROM
 * cell opens the submission's fields (marking it read), with Mark spam /
 * Archive. `Export CSV` above the notice downloads every form's submissions
 * (`forms.exportSubmissions`). Rows come from `forms.listBlocks` +
 * `forms.listSubmissions` (inbox: not spam, not archived), 20 a page.
 *
 * A FormBlock row is created when a page with a Form is PUBLISHED: the
 * publish worker points every action-less <form> at
 * /api/public/forms/<siteId>/<elementId> and upserts the row under that id
 * (lib/publish-forms.ts) — so `blockId` IS the form element's id, and that
 * is what Configure selects.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import { LoadCard, SET_BTN, SET_CARD, SCREEN_EMPTY, Screen, SaveErrorBanner, pillClass, type PillTone } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { EVENTS } from "@/shared/constants/events";
import { locateComment } from "@/editor/sidebar/tabs/review/locate";
import { Button, ConfirmDialog } from "@/editor/chrome-ui";

interface FormBlockRow {
  id: string;
  /** The form element's id on its page (the published endpoint's key). */
  blockId: string;
  pageId: string | null;
  name: string;
  isActive: boolean;
  _count: { submissions: number };
}

interface SubmissionRow {
  id: string;
  formBlockId: string;
  siteId: string;
  data: Record<string, unknown>;
  sourceUrl: string | null;
  isRead: boolean;
  isSpam: boolean;
  isArchived: boolean;
  createdAt: string | Date;
  formBlock?: { name: string };
}

interface SubmissionsPage {
  data: SubmissionRow[];
  total: number;
  page: number;
  perPage: number;
}

const PER_PAGE = 20;
const CARD_LINE = "What visitors sent through your forms.";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** `2 Jul, 19:41` — the board's received stamp, local time. */
export function receivedAt(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${hh}:${mm}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** FROM: the first field that holds an email address, else the submission's summary. */
export function fromOf(data: Record<string, unknown>): string {
  const email = Object.values(data).find((v) => typeof v === "string" && EMAIL.test(v.trim()));
  return typeof email === "string" ? email.trim() : summarize(data);
}

const STATUS: (s: SubmissionRow) => { label: string; tone: PillTone } = (s) =>
  s.isSpam ? { label: "Spam", tone: "error" } : s.isRead ? { label: "Read", tone: "success" } : { label: "New", tone: "neutral" };

export const FormsScreen: React.FC<ScreenProps> = ({ composer, projectId, onDirtyChange, onLoadStateChange }) => {
  const [forms, setForms] = React.useState<FormBlockRow[]>([]);
  const [formsState, setFormsState] = React.useState<"loading" | "ready" | "error">(projectId ? "loading" : "ready");
  const [attempt, setAttempt] = React.useState(0);

  const [page, setPage] = React.useState(1);
  const [submissions, setSubmissions] = React.useState<SubmissionsPage | null>(null);
  const [subsLoading, setSubsLoading] = React.useState(false);
  const [subsError, setSubsError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<SubmissionRow | null>(null);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    onDirtyChange?.(false);
  }, [onDirtyChange]);

  const reportRef = React.useRef(onLoadStateChange);
  reportRef.current = onLoadStateChange;

  // The forms, once per site (and per Try again).
  React.useEffect(() => {
    if (!projectId) {
      setForms([]);
      setFormsState("ready");
      return;
    }
    let stale = false;
    setFormsState("loading");
    reportRef.current?.("loading");
    getClient()
      .forms.listBlocks.query({ siteId: projectId })
      .then((list) => {
        if (stale) return;
        setForms(list as FormBlockRow[]);
        setFormsState("ready");
        reportRef.current?.("ready");
      })
      .catch(() => {
        if (stale) return;
        setFormsState("error");
        reportRef.current?.("error");
      });
    return () => {
      stale = true;
    };
  }, [projectId, attempt]);

  const loadSubs = React.useCallback(async () => {
    if (!projectId || formsState !== "ready" || forms.length === 0) {
      setSubmissions(null);
      return;
    }
    setSubsLoading(true);
    setSubsError(null);
    try {
      const result = await getClient().forms.listSubmissions.query({
        siteId: projectId,
        page,
        perPage: PER_PAGE,
        isArchived: false,
        isSpam: false,
      });
      setSubmissions(result as SubmissionsPage);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to load submissions.");
    } finally {
      setSubsLoading(false);
    }
  }, [projectId, formsState, forms.length, page]);

  React.useEffect(() => {
    void loadSubs();
  }, [loadSubs]);

  const update = async (id: string, patch: { isRead?: boolean; isSpam?: boolean; isArchived?: boolean }) => {
    setActionError(null);
    try {
      await getClient().forms.updateSubmission.mutate({ id, ...patch });
      await loadSubs();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update submission.");
    }
  };

  const remove = async (id: string) => {
    setActionError(null);
    try {
      await getClient().forms.deleteSubmission.mutate({ id });
      // The last row of a later page: step back so the user lands on content.
      const remaining = Math.max(0, (submissions?.total ?? 0) - 1);
      const lastPage = Math.max(1, Math.ceil(remaining / PER_PAGE));
      if (page > lastPage) setPage(lastPage);
      else await loadSubs();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to delete submission.");
    }
  };

  const exportCsv = async () => {
    if (!projectId) return;
    setActionError(null);
    setExporting(true);
    try {
      const csv = await getClient().forms.exportSubmissions.query({ siteId: projectId, format: "csv" });
      if (!csv) {
        setActionError("No submissions to export.");
        return;
      }
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "form-submissions.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to export submissions.");
    } finally {
      setExporting(false);
    }
  };

  /* Configure in Inspector ›: the form's page, then the element, then a panel
     that shows the canvas — Settings is full-page, so leaving it is the move. */
  const configure = (form: FormBlockRow | undefined) => {
    if (!composer || !form) return;
    const outcome = locateComment(composer, { pageId: form.pageId, targetSelector: form.blockId });
    if (outcome === "gone") {
      setActionError(`${form.name} is no longer on its page. Publish again to refresh this list.`);
      return;
    }
    composer.emit(EVENTS.UI_SWITCH_TAB, { tab: "layers" });
  };

  if (!projectId) {
    return (
      <Screen>
        <div className={SCREEN_EMPTY}>Open this site from the dashboard to manage forms.</div>
      </Screen>
    );
  }

  if (formsState !== "ready") {
    return (
      <Screen>
        <LoadCard
          title="Form submissions"
          line={CARD_LINE}
          state={formsState}
          errorLine="Couldn't load your forms. Check your connection, then try again."
          onRetry={() => setAttempt((n) => n + 1)}
        />
      </Screen>
    );
  }

  if (forms.length === 0) {
    return (
      <Screen>
        {/* No FormBlock row exists before the first publish — see the header. */}
        <section className={CARD} data-testid="set-forms-empty">
          <h3 className={TITLE}>Submissions · All Forms</h3>
          <p className={MUTED_13}>Publish a page with a Form block and its submissions arrive here.</p>
          <div className={SCREEN_EMPTY}>No forms yet.</div>
        </section>
      </Screen>
    );
  }

  const formById = new Map(forms.map((f) => [f.id, f]));
  const totalPages = submissions ? Math.max(1, Math.ceil(submissions.total / PER_PAGE)) : 1;
  const rows = submissions?.data ?? [];

  return (
    <Screen>
      {actionError ? <SaveErrorBanner message={actionError} /> : null}
      <div className="tw:flex tw:h-8 tw:items-center">
        <Button
          type="button"
          size="xs"
          variant="ghost"
          className={GHOST}
          onClick={() => void exportCsv()}
          disabled={exporting || subsLoading || !submissions || submissions.total === 0}
          data-testid="set-forms-export"
        >
          {exporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>
      <div className={NOTICE} role="note" data-testid="set-forms-notice">
        Submissions are live records. Restoring a draft does not change this inbox.
      </div>

      <section className={CARD} data-testid="set-card-submissions">
        <h3 className={TITLE}>Submissions · All Forms</h3>
        {subsLoading ? <div className={SCREEN_EMPTY}>Loading…</div> : null}
        {!subsLoading && subsError ? (
          <div role="alert" className={`${SCREEN_EMPTY} tw:flex tw:items-center tw:gap-3`}>
            <span>{subsError}</span>
            <Button type="button" size="xs" variant="ghost" className={GHOST} onClick={() => void loadSubs()} data-testid="subs-error-retry">
              Retry
            </Button>
          </div>
        ) : null}
        {!subsLoading && !subsError && submissions && rows.length === 0 ? (
          <div className={SCREEN_EMPTY} data-testid="set-forms-inbox-empty">
            No submissions yet. They appear here as visitors send your forms.
          </div>
        ) : null}
        {!subsLoading && rows.length > 0 ? (
          <div role="table" aria-label="Form submissions" className="tw:w-full" data-testid="set-forms-table">
            <div role="row" className={HEAD}>
              <span role="columnheader">Form</span>
              <span role="columnheader">From</span>
              <span role="columnheader">Received</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Actions</span>
              <span role="columnheader">Configuration</span>
            </div>
            {rows.map((s) => {
              const form = formById.get(s.formBlockId);
              const status = STATUS(s);
              const open = expandedId === s.id;
              return (
                <div key={s.id} role="rowgroup" data-testid={`set-forms-row-${s.id}`}>
                  <div role="row" className={ROW}>
                    <span role="cell" className="tw:truncate">
                      {form?.name ?? s.formBlock?.name ?? "Form"}
                    </span>
                    <span role="cell" className="tw:min-w-0">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className={FROM_BTN}
                        aria-expanded={open}
                        onClick={() => {
                          setExpandedId(open ? null : s.id);
                          if (!s.isRead) void update(s.id, { isRead: true });
                        }}
                        data-testid={`set-forms-open-${s.id}`}
                      >
                        <span className="tw:truncate">{fromOf(s.data)}</span>
                      </Button>
                    </span>
                    <span role="cell" className="tw:text-[var(--bk-ink-soft)]">
                      {receivedAt(s.createdAt)}
                    </span>
                    <span role="cell">
                      <span className={pillClass(status.tone)} data-testid={`set-forms-status-${s.id}`}>
                        {status.label}
                      </span>
                    </span>
                    <span role="cell" className="tw:flex tw:justify-end">
                      <Button
                        type="button"
                        size="xs"
                        variant="danger"
                        className={DELETE_BTN}
                        onClick={() => setPendingDelete(s)}
                        data-testid={`set-forms-delete-${s.id}`}
                      >
                        Delete
                      </Button>
                    </span>
                    <span role="cell">
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className={CONFIGURE}
                        disabled={!form || !composer}
                        onClick={() => configure(form)}
                        data-testid={`set-forms-configure-${s.id}`}
                      >
                        Configure in Inspector ›
                      </Button>
                    </span>
                  </div>
                  {open ? (
                    <div className={DETAIL} data-testid={`set-forms-detail-${s.id}`}>
                      <dl className={DL}>
                        {Object.entries(s.data).map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt className={DT}>{k}</dt>
                            <dd className={DD}>{String(v)}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                      {s.sourceUrl ? <div className={MUTED_12}>Sent from {s.sourceUrl}</div> : null}
                      <div className="tw:flex tw:gap-1">
                        <Button type="button" size="xs" variant="ghost" className={GHOST} onClick={() => void update(s.id, { isSpam: true })}>
                          Mark spam
                        </Button>
                        <Button type="button" size="xs" variant="ghost" className={GHOST} onClick={() => void update(s.id, { isArchived: true })}>
                          Archive
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}
        {submissions && submissions.total > PER_PAGE ? (
          <div className="tw:flex tw:items-center tw:justify-center tw:gap-2">
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={GHOST}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || subsLoading}
            >
              ← Prev
            </Button>
            <span className={MUTED_12}>
              Page {page} of {totalPages}
            </span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              className={GHOST}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || subsLoading}
            >
              Next →
            </Button>
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          const target = pendingDelete;
          setPendingDelete(null);
          if (target) void remove(target.id);
        }}
        title="Delete this submission?"
        message={
          pendingDelete
            ? `"${summarize(pendingDelete.data)}" is a visitor's own message to you. Deleting removes it from the server for good — no copy is kept anywhere and it can't be recovered. Export CSV first if you might need it.`
            : ""
        }
        confirmLabel="Delete submission"
        tone="destructive"
      />
    </Screen>
  );
};

function summarize(data: Record<string, unknown>): string {
  const keys = ["email", "name", "subject", "message"];
  for (const key of keys) {
    if (data[key]) return String(data[key]).slice(0, 80);
  }
  const firstEntry = Object.values(data)[0];
  return firstEntry ? String(firstEntry).slice(0, 80) : "(empty)";
}

/* 8136:216977: the card — 24 in, 16 between rows, title 16/600. */
const CARD = `${SET_CARD} tw:flex tw:flex-col tw:gap-4 tw:p-6`;
const TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";
const MUTED_13 = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const MUTED_12 = "tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* The info notice: accent tint, 16/12 in, a 4 radius, 13/20 ink. */
const NOTICE =
  "tw:rounded-[var(--bk-radius-sm)] tw:bg-[var(--bk-accent-tint)] tw:px-4 tw:py-3 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const GHOST = `${SET_BTN} tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`;
/* FORM 136 · FROM 228 · RECEIVED 144 · STATUS 84 · ACTIONS 80 · CONFIGURATION 188, 12 apart. */
const COLS = "tw:grid tw:grid-cols-[136px_228px_144px_84px_80px_188px] tw:items-center tw:gap-x-3";
const HEAD =
  `${COLS} tw:border-b tw:border-[var(--bk-border)] tw:pb-1 tw:text-[length:var(--bk-text-11)] tw:font-medium tw:uppercase ` +
  "tw:leading-4 tw:tracking-[0.08em] tw:text-[var(--bk-ink-muted)]";
const ROW = `${COLS} tw:py-1.5 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]`;
const FROM_BTN =
  "tw:h-auto tw:max-w-full tw:justify-start tw:border-0 tw:bg-transparent tw:p-0 tw:text-[length:var(--bk-text-13)] tw:font-normal " +
  "tw:leading-5 tw:text-[var(--bk-ink-soft)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:enabled:hover:underline tw:focus:ring-0 " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const DELETE_BTN = `${SET_BTN} tw:w-20`;
const CONFIGURE =
  "tw:h-auto tw:justify-start tw:border-0 tw:bg-transparent tw:p-0 tw:text-[length:var(--bk-text-12)] tw:font-medium tw:leading-5 " +
  "tw:text-[var(--bk-accent)] tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-accent)] tw:enabled:hover:underline tw:focus:ring-0 " +
  "tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";
const DETAIL = "tw:mb-2 tw:flex tw:flex-col tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-bg-subtle)] tw:p-3";
const DL = "tw:m-0 tw:grid tw:grid-cols-[minmax(80px,25%)_1fr] tw:gap-x-2 tw:gap-y-1 tw:p-0";
const DT = "tw:text-[length:var(--bk-text-11)] tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const DD = "tw:m-0 tw:break-words tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]";
