/**
 * FormsScreen — VISITORS › Form submissions (2L9 page 06: B8-S13 238:13598,
 * GAP-FM01–FM10 272:21156…272:23770, Unspam/Unarchive 272:27190…272:28506).
 *
 * Three views — Inbox · Spam · Archived — and a form filter ("Form: All
 * forms" or one form), which work together: the count line ("Inbox · 24
 * submissions") and the list follow both. Rows are selectable; the selection
 * bar deletes them ("Delete n", asks first — a submission is a visitor's own
 * data and the delete has no undo) or moves them back to the Inbox (Unspam /
 * Unarchive). A row's name opens its fields (marking it read), with Mark spam
 * / Archive. `Configure in Inspector` needs one form chosen: it leaves
 * Settings with that form selected on its page (the form is configured on the
 * element — Q-B1 / S4 Q1: no "Add form" here). Rows come from
 * `forms.listBlocks` + `forms.listSubmissions`, 20 a page, newest first.
 *
 * Bulk actions run one mutation per row (`deleteSubmission`,
 * `updateSubmission`); the rows that fail stay selected (FM10). Export CSV
 * exports every row matching the view and the form filter, selected or not
 * (GAP-FM-Export-*: Preparing CSV → CSV ready / Couldn't export).
 *
 * A FormBlock row is created when a page with a Form is PUBLISHED: the
 * publish worker points every action-less <form> at
 * /api/public/forms/<siteId>/<elementId> and upserts the row under that id
 * (lib/publish-forms.ts) — so `blockId` IS the form element's id, and that
 * is what Configure selects. Submissions older than 365 days are purged by
 * the dashboard cron (`api/cron/form-submission-purge`).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import { LoadCard, SET_BTN, SET_CARD, SCREEN_EMPTY, SCREEN_SUCCESS, Screen, SaveErrorBanner, Select } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { EVENTS } from "@/shared/constants/events";
import { locateComment } from "@/editor/sidebar/tabs/review/locate";
import { Button, Checkbox, ConfirmDialog, Modal } from "@/editor/chrome-ui";

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
/** `20 Oct` — the board's received stamp (238:13598), local date. */
export function receivedAt(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_KEYS = ["name", "full name", "fullname", "full_name", "your name"];
const MESSAGE_KEYS = ["message", "subject", "comments", "comment"];
const field = (data: Record<string, unknown>, keys: string[]) => {
  const hit = Object.entries(data).find(([k, v]) => keys.includes(k.toLowerCase()) && typeof v === "string" && v.trim());
  return hit ? String(hit[1]).trim() : null;
};
const emailOf = (data: Record<string, unknown>) => {
  const email = Object.values(data).find((v) => typeof v === "string" && EMAIL.test(v.trim()));
  return typeof email === "string" ? email.trim() : null;
};

/** Who sent it (238:13598 "Mara Lenz · Contact"): a name field, else the first email-looking field, else the first value. */
export function fromOf(data: Record<string, unknown>): string {
  return field(data, NAME_KEYS) ?? emailOf(data) ?? firstValue(data);
}

/** The row's second line: the message (or subject), else the first other value. */
function messageOf(data: Record<string, unknown>): string {
  const from = fromOf(data);
  const message =
    field(data, MESSAGE_KEYS) ??
    Object.values(data).find((v) => typeof v === "string" && v.trim() && v.trim() !== from && v.trim() !== emailOf(data));
  return message ? String(message).slice(0, 120) : "";
}

function firstValue(data: Record<string, unknown>): string {
  const first = Object.values(data)[0];
  return first ? String(first).slice(0, 80) : "(empty)";
}

type View = "inbox" | "spam" | "archived";
const VIEWS: { id: View; label: string }[] = [
  { id: "inbox", label: "Inbox" },
  { id: "spam", label: "Spam" },
  { id: "archived", label: "Archived" },
];
const VIEW_LABEL: Record<View, string> = { inbox: "Inbox", spam: "Spam", archived: "Archived" };
const VIEW_FILTER: Record<View, { isSpam: boolean; isArchived: boolean }> = {
  inbox: { isSpam: false, isArchived: false },
  spam: { isSpam: true, isArchived: false },
  archived: { isSpam: false, isArchived: true },
};
const ALL_FORMS = "";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The delete dialog's three faces (GAP-FM07 confirm · FM08 pending · FM10 failed). */
type DeleteDialog = { phase: "confirm" | "pending" | "failed"; ids: string[] } | null;

export const FormsScreen: React.FC<ScreenProps> = ({ composer, projectId, onDirtyChange, onLoadStateChange }) => {
  const [forms, setForms] = React.useState<FormBlockRow[]>([]);
  const [formsState, setFormsState] = React.useState<"loading" | "ready" | "error">(projectId ? "loading" : "ready");
  const [attempt, setAttempt] = React.useState(0);

  const [view, setView] = React.useState<View>("inbox");
  const [formFilter, setFormFilter] = React.useState<string>(ALL_FORMS);
  const [page, setPage] = React.useState(1);
  const [submissions, setSubmissions] = React.useState<SubmissionsPage | null>(null);
  const [subsLoading, setSubsLoading] = React.useState(false);
  const [subsError, setSubsError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  /* FM09 / Unspam·Unarchive acknowledged: what the last bulk action did. */
  const [ack, setAck] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = React.useState<DeleteDialog>(null);
  const [moveFailed, setMoveFailed] = React.useState<string[] | null>(null);
  const [moving, setMoving] = React.useState(false);
  /* GAP-FM-Export: the export's own dialog — preparing, ready (with what it held) or failed. */
  const [exportState, setExportState] = React.useState<{ phase: "preparing" | "failed" } | { phase: "ready"; count: number } | null>(null);

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
        ...(formFilter ? { formBlockId: formFilter } : {}),
        ...VIEW_FILTER[view],
      });
      setSubmissions(result as SubmissionsPage);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to load submissions.");
    } finally {
      setSubsLoading(false);
    }
  }, [projectId, formsState, forms.length, page, formFilter, view]);

  React.useEffect(() => {
    void loadSubs();
  }, [loadSubs]);

  /* A new view or form is a new list: page 1, nothing selected, no stale receipt. */
  const changeList = (next: { view?: View; form?: string }) => {
    if (next.view !== undefined) setView(next.view);
    if (next.form !== undefined) setFormFilter(next.form);
    setPage(1);
    setSelected(new Set());
    setExpandedId(null);
    setAck(null);
    setActionError(null);
  };

  const update = async (id: string, patch: { isRead?: boolean; isSpam?: boolean; isArchived?: boolean }) => {
    setActionError(null);
    try {
      await getClient().forms.updateSubmission.mutate({ id, ...patch });
      await loadSubs();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to update submission.");
    }
  };

  /** Runs `act` per id; returns the ids that failed. */
  const runEach = async (ids: string[], act: (id: string) => Promise<unknown>) => {
    const results = await Promise.allSettled(ids.map(act));
    return ids.filter((_, i) => results[i].status === "rejected");
  };

  const deleteSelected = async (ids: string[]) => {
    setDeleteDialog({ phase: "pending", ids });
    setAck(null);
    const failed = await runEach(ids, (id) => getClient().forms.deleteSubmission.mutate({ id }));
    const done = ids.length - failed.length;
    setSelected(new Set(failed));
    if (failed.length > 0) setDeleteDialog({ phase: "failed", ids: failed });
    else setDeleteDialog(null);
    if (done > 0) {
      setAck(`${plural(done, "submission")} permanently deleted.`);
      // The last rows of a later page: step back so the user lands on content.
      const remaining = Math.max(0, (submissions?.total ?? 0) - done);
      const lastPage = Math.max(1, Math.ceil(remaining / PER_PAGE));
      if (page > lastPage) setPage(lastPage);
      else await loadSubs();
    }
  };

  /* Unspam / Unarchive (272:27190…272:28506): back to the Inbox, no confirm. */
  const moveToInbox = async (ids: string[]) => {
    setMoving(true);
    setMoveFailed(null);
    setAck(null);
    const patch = view === "spam" ? { isSpam: false } : { isArchived: false };
    const failed = await runEach(ids, (id) => getClient().forms.updateSubmission.mutate({ id, ...patch }));
    const done = ids.length - failed.length;
    setMoving(false);
    setSelected(new Set(failed));
    if (failed.length > 0) setMoveFailed(failed);
    if (done > 0) {
      setAck(`${plural(done, "submission")} moved from ${VIEW_LABEL[view]} to Inbox.`);
      await loadSubs();
    }
  };

  const exportCsv = async () => {
    if (!projectId) return;
    setActionError(null);
    setExportState({ phase: "preparing" });
    try {
      const csv = await getClient().forms.exportSubmissions.query({
        siteId: projectId,
        ...(formFilter ? { formBlockId: formFilter } : {}),
        ...VIEW_FILTER[view],
        format: "csv",
      });
      if (!csv) {
        setExportState(null);
        setActionError("No submissions to export.");
        return;
      }
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "form-submissions.csv";
      a.click();
      URL.revokeObjectURL(url);
      /* The export and the list share one filter, so the list's total is the file's row count. */
      setExportState({ phase: "ready", count: submissions?.total ?? 0 });
    } catch {
      setExportState({ phase: "failed" });
    }
  };

  /* Configure in Inspector: the form's page, then the element, then a panel
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
          <h3 className={TITLE}>Submissions · All forms</h3>
          <p className={MUTED_13}>Publish a page with a Form block and its submissions arrive here.</p>
          <div className={SCREEN_EMPTY}>No forms yet.</div>
        </section>
      </Screen>
    );
  }

  const formById = new Map(forms.map((f) => [f.id, f]));
  const chosenForm = formFilter ? formById.get(formFilter) : undefined;
  const scopeName = chosenForm?.name ?? "All forms";
  const totalPages = submissions ? Math.max(1, Math.ceil(submissions.total / PER_PAGE)) : 1;
  const rows = submissions?.data ?? [];
  const nameOf = (s: SubmissionRow) => fromOf(s.data);
  const formNameOf = (s: SubmissionRow) => formById.get(s.formBlockId)?.name ?? s.formBlock?.name ?? "Form";
  const selectedIds = rows.filter((s) => selected.has(s.id)).map((s) => s.id);
  const count = selectedIds.length;
  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  const namesOf = (ids: string[]) => {
    const names = ids.map((id) => rows.find((r) => r.id === id)).filter(Boolean).map((r) => nameOf(r!));
    return names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  };
  const where = `${scopeName} · ${VIEW_LABEL[view]}`;

  const dialog = (() => {
    if (!deleteDialog) return null;
    const n = deleteDialog.ids.length;
    if (deleteDialog.phase === "failed") {
      return {
        title: "Couldn’t delete the submissions",
        message: `${n === 1 ? "The submission is" : n === 2 ? "Both submissions are" : `${n} submissions are`} still in ${where}. Your selection is kept.`,
        confirmLabel: "Try again",
      };
    }
    if (deleteDialog.phase === "pending") {
      return {
        title: `Deleting ${plural(n, "submission")}…`,
        message: `${namesOf(deleteDialog.ids)} ${n === 1 ? "remains" : "remain"} listed until deletion is confirmed. No Undo is offered for permanent deletion.`,
        confirmLabel: `Delete ${n} permanently`,
      };
    }
    return {
      title: `Delete ${plural(n, "submission")} permanently?`,
      message: `${namesOf(deleteDialog.ids)} will be removed from ${where}. This cannot be undone.`,
      confirmLabel: `Delete ${n} permanently`,
    };
  })();

  return (
    <Screen>
      {actionError ? <SaveErrorBanner message={actionError} /> : null}

      {/* The three views (238:13598): the current one filled, the others outlined. */}
      <div className="tw:flex tw:gap-2" role="group" aria-label="Submission views" data-testid="set-forms-views">
        {VIEWS.map((v) => (
          <Button
            key={v.id}
            type="button"
            size="xs"
            variant={view === v.id ? undefined : "secondary"}
            className={`${SET_BTN} tw:w-28`}
            aria-pressed={view === v.id}
            onClick={() => changeList({ view: v.id })}
            data-testid={`set-forms-view-${v.id}`}
          >
            {v.label}
          </Button>
        ))}
      </div>

      <div className="tw:flex tw:items-center tw:gap-3">
        <Select
          aria-label="Filter submissions by form"
          className="tw:w-60"
          value={formFilter}
          onChange={(e) => changeList({ form: e.target.value })}
          data-testid="set-forms-filter"
        >
          <option value={ALL_FORMS}>Form: All forms</option>
          {forms.map((f) => (
            <option key={f.id} value={f.id}>{`Form: ${f.name}`}</option>
          ))}
        </Select>
        <span className={INK_13} role="status" data-testid="set-forms-count">
          {submissions ? `${VIEW_LABEL[view]} · ${plural(submissions.total, "submission")}` : VIEW_LABEL[view]}
        </span>
        <span className="tw:flex-1" />
        <Button
          type="button"
          size="xs"
          variant="secondary"
          className={SET_BTN}
          onClick={() => void exportCsv()}
          disabled={exportState?.phase === "preparing" || subsLoading || !submissions || submissions.total === 0}
          data-testid="set-forms-export"
        >
          Export CSV
        </Button>
        <Button
          type="button"
          size="xs"
          variant="secondary"
          className={SET_BTN}
          disabled={!chosenForm || !composer}
          onClick={() => configure(chosenForm)}
          data-testid="set-forms-configure"
        >
          {chosenForm ? "Configure in Inspector" : "Choose a form to configure"}
        </Button>
      </div>
      {!chosenForm ? (
        <p className={MUTED_12} data-testid="set-forms-configure-hint">
          Select a single form before configuring it in Inspector.
        </p>
      ) : null}

      {ack ? (
        <div className={SCREEN_SUCCESS} role="status" data-testid="set-forms-ack">
          {ack}
        </div>
      ) : null}

      <section className="tw:flex tw:flex-col tw:gap-4" data-testid="set-card-submissions" aria-busy={subsLoading}>
        <h3 className={LABEL}>{`Submissions · ${scopeName}`}</h3>
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
            {view === "inbox"
              ? "No submissions yet. They appear here as visitors send your forms."
              : `Nothing in ${VIEW_LABEL[view]}.`}
          </div>
        ) : null}
        {!subsLoading && rows.length > 0 ? (
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-4 tw:p-0" aria-label="Form submissions" data-testid="set-forms-table">
            {rows.map((s) => {
              const open = expandedId === s.id;
              const who = nameOf(s);
              return (
                <li key={s.id} className={ROW_CARD} data-testid={`set-forms-row-${s.id}`}>
                  <div className={ROW}>
                    <label className="tw:flex tw:min-w-0 tw:items-center tw:gap-3 tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]">
                      <Checkbox
                        checked={selected.has(s.id)}
                        onChange={(e) => toggle(s.id, e.target.checked)}
                        data-testid={`set-forms-select-${s.id}`}
                      />
                      <span className="tw:truncate">{`Select ${who}`}</span>
                    </label>
                    <Button
                      type="button"
                      size="xs"
                      variant="link"
                      className={FROM_BTN}
                      aria-expanded={open}
                      onClick={() => {
                        setExpandedId(open ? null : s.id);
                        if (!s.isRead) void update(s.id, { isRead: true });
                      }}
                      data-testid={`set-forms-open-${s.id}`}
                    >
                      <span className="tw:truncate">{`${who} · ${formNameOf(s)}`}</span>
                    </Button>
                    <div className="tw:flex tw:min-w-0 tw:flex-col">
                      <span className="tw:truncate tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]">
                        {messageOf(s.data)}
                      </span>
                      <span className={MUTED_12} data-testid={`set-forms-status-${s.id}`}>
                        {`${receivedAt(s.createdAt)} · ${VIEW_LABEL[view]}${view === "inbox" && !s.isRead ? " · New" : ""}`}
                      </span>
                    </div>
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
                      {view === "inbox" ? (
                        <div className="tw:flex tw:gap-1">
                          <Button type="button" size="xs" variant="ghost" className={GHOST} onClick={() => void update(s.id, { isSpam: true })}>
                            Mark spam
                          </Button>
                          <Button type="button" size="xs" variant="ghost" className={GHOST} onClick={() => void update(s.id, { isArchived: true })}>
                            Archive
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : null}

        {rows.length > 0 ? (
          <div className="tw:flex tw:items-center tw:gap-3" data-testid="set-forms-selection">
            <span className={`${INK_13} tw:w-60`} role="status" data-testid="set-forms-selected">
              {`${count} selected`}
            </span>
            <Button
              type="button"
              size="xs"
              variant="secondary"
              className={`${SET_BTN} tw:w-32`}
              disabled={count === 0}
              onClick={() => setDeleteDialog({ phase: "confirm", ids: selectedIds })}
              data-testid="set-forms-delete"
            >
              {`Delete ${count}`}
            </Button>
            {view !== "inbox" ? (
              <Button
                type="button"
                size="xs"
                variant="secondary"
                className={SET_BTN}
                disabled={count === 0 || moving}
                onClick={() => void moveToInbox(selectedIds)}
                data-testid="set-forms-move"
              >
                {moving ? `${view === "spam" ? "Unspam" : "Unarchive"} ${plural(count, "submission")}…` : view === "spam" ? "Unspam" : "Unarchive"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {submissions && rows.length > 0 ? (
          <div className="tw:flex tw:items-center tw:gap-2">
            <span className={MUTED_12} data-testid="set-forms-showing">
              {`Showing ${rows.length} of ${submissions.total} · sorted newest first`}
            </span>
            {submissions.total > PER_PAGE ? (
              <>
                <span className="tw:flex-1" />
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
              </>
            ) : null}
          </div>
        ) : null}
      </section>

      <p className={`${MUTED_12} tw:mt-auto`} data-testid="set-forms-retention">
        Submissions are kept 365 days, then permanently deleted.
      </p>

      <ConfirmDialog
        open={dialog !== null}
        onClose={() => {
          if (deleteDialog?.phase !== "pending") setDeleteDialog(null);
        }}
        onConfirm={() => {
          if (deleteDialog && deleteDialog.phase !== "pending") void deleteSelected(deleteDialog.ids);
        }}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        confirmLabel={dialog?.confirmLabel ?? ""}
        busy={deleteDialog?.phase === "pending"}
        tone="destructive"
        width="sm"
        testId="set-forms-delete-dialog"
      />
      <Modal
        open={exportState?.phase === "preparing" || exportState?.phase === "ready"}
        onClose={() => setExportState(null)}
        title={exportState?.phase === "ready" ? "CSV ready" : "Preparing CSV…"}
        width="sm"
        testId="set-forms-export-dialog"
        footer={
          exportState?.phase === "ready" ? (
            <Button type="button" size="xs" variant="secondary" className={SET_BTN} onClick={() => setExportState(null)}>
              Back to submissions
            </Button>
          ) : null
        }
      >
        <p className={MUTED_13} role="status" data-testid="set-forms-export-line">
          {exportState?.phase === "ready"
            ? `${plural(exportState.count, "submission")} · ${scopeName} · ${VIEW_LABEL[view]}. Your selection and filters are unchanged.`
            : `${scopeName} · ${VIEW_LABEL[view]} · ${plural(submissions?.total ?? 0, "submission")}. All matching rows will be exported, including those not selected.`}
        </p>
      </Modal>
      <ConfirmDialog
        open={exportState?.phase === "failed"}
        onClose={() => setExportState(null)}
        onConfirm={() => void exportCsv()}
        title="Couldn’t export submissions"
        message="No CSV was created. Your filters and selection are kept."
        confirmLabel="Try again"
        width="sm"
        testId="set-forms-export-failed"
      />
      <ConfirmDialog
        open={moveFailed !== null}
        onClose={() => setMoveFailed(null)}
        onConfirm={() => {
          const ids = moveFailed ?? [];
          setMoveFailed(null);
          void moveToInbox(ids);
        }}
        title={moveFailed && moveFailed.length > 1 ? "Couldn’t move the submissions" : "Couldn’t move the submission"}
        message={`${moveFailed && moveFailed.length > 1 ? "The submissions are" : "The submission is"} still in ${VIEW_LABEL[view]}. Your selection is kept.`}
        confirmLabel="Try again"
        width="sm"
        testId="set-forms-move-failed"
      />
    </Screen>
  );
};

/* The empty card keeps the settings card. */
const CARD = `${SET_CARD} tw:flex tw:flex-col tw:gap-4 tw:p-6`;
const TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-16)] tw:font-semibold tw:leading-6 tw:tracking-[-0.16px] tw:text-[var(--bk-ink)]";
/* 238:13598: "Submissions · Contact" — a 13/600 label over the rows. */
const LABEL = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]";
const INK_13 = "tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink)]";
const MUTED_13 = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5 tw:text-[var(--bk-ink-muted)]";
const MUTED_12 = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const GHOST = `${SET_BTN} tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`;
/* 238:13598: each submission is its own bordered row, 64 tall —
   checkbox + "Select …" · "{from} · {form}" · message over "{date} · {view}". */
const ROW_CARD = "tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-4";
const ROW = "tw:grid tw:min-h-16 tw:grid-cols-[240px_200px_minmax(0,1fr)] tw:items-center tw:gap-x-6";
const FROM_BTN = "tw:max-w-full tw:justify-start tw:px-0 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:text-[var(--bk-ink)]";
const DETAIL = "tw:mb-4 tw:flex tw:flex-col tw:gap-2 tw:rounded-[var(--bk-radius-md)] tw:bg-[var(--bk-bg-subtle)] tw:p-3";
const DL = "tw:m-0 tw:grid tw:grid-cols-[minmax(80px,25%)_1fr] tw:gap-x-2 tw:gap-y-1 tw:p-0";
const DT = "tw:text-[length:var(--bk-text-11)] tw:uppercase tw:tracking-[0.04em] tw:text-[var(--bk-ink-muted)]";
const DD = "tw:m-0 tw:break-words tw:text-[length:var(--bk-text-13)] tw:text-[var(--bk-ink)]";
