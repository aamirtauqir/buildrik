/**
 * FormsScreen — submissions inbox.
 * Picks a form block, lists submissions paginated, lets admin
 * mark read/spam/archived or delete.
 *
 * Server-side rows (Prisma FormBlock + FormSubmission); reads via
 * tRPC formsRouter (forms.listBlocks / forms.listSubmissions / etc.).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import { Field, Screen, Section, Select } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Button } from "@/editor/chrome-ui";

interface FormBlockRow {
  id: string;
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

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

type Filter = "inbox" | "unread" | "spam" | "archived";

export const FormsScreen: React.FC<ScreenProps> = ({ projectId }) => {
  const [forms, setForms] = React.useState<FormBlockRow[]>([]);
  const [selectedFormId, setSelectedFormId] = React.useState<string>("");
  const [formsLoading, setFormsLoading] = React.useState(true);
  const [formsError, setFormsError] = React.useState<string | null>(null);

  const [filter, setFilter] = React.useState<Filter>("inbox");
  const [page, setPage] = React.useState(1);
  const [submissions, setSubmissions] = React.useState<SubmissionsPage | null>(null);
  const [subsLoading, setSubsLoading] = React.useState(false);
  const [subsError, setSubsError] = React.useState<string | null>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  // Reset form selection when the site changes — keeping a stale formBlockId
  // from the previous site sends `{ siteId: new, formBlockId: oldSiteForm }`
  // and silently returns an empty inbox.
  React.useEffect(() => {
    setSelectedFormId("");
  }, [projectId]);

  // Initial form-blocks load.
  React.useEffect(() => {
    if (!projectId) {
      setForms([]);
      setFormsLoading(false);
      return;
    }
    setFormsLoading(true);
    setFormsError(null);
    getClient()
      .forms.listBlocks.query({ siteId: projectId })
      .then((list) => {
        const rows = list as FormBlockRow[];
        setForms(rows);
        // Reconcile selection: pick first form when nothing is selected, OR when
        // the previous selection isn't valid for this site (post-projectId reset).
        if (rows.length > 0) {
          setSelectedFormId((prev) =>
            prev && rows.some((r) => r.id === prev) ? prev : rows[0].id,
          );
        }
      })
      .catch((e) => setFormsError(e instanceof Error ? e.message : "Failed to load forms."))
      .finally(() => setFormsLoading(false));
  }, [projectId]);

  // Submissions load whenever form/filter/page changes.
  const loadSubs = React.useCallback(async () => {
    if (!projectId || !selectedFormId) {
      setSubmissions(null);
      return;
    }
    setSubsLoading(true);
    setSubsError(null);
    try {
      const page1 = await getClient().forms.listSubmissions.query({
        siteId: projectId,
        formBlockId: selectedFormId,
        page,
        perPage: PER_PAGE,
        ...(filter === "unread" ? { isRead: false, isArchived: false, isSpam: false } : {}),
        ...(filter === "spam" ? { isSpam: true } : {}),
        ...(filter === "archived" ? { isArchived: true } : {}),
        ...(filter === "inbox" ? { isArchived: false, isSpam: false } : {}),
      });
      setSubmissions(page1 as SubmissionsPage);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to load submissions.");
    } finally {
      setSubsLoading(false);
    }
  }, [projectId, selectedFormId, filter, page]);

  React.useEffect(() => {
    void loadSubs();
  }, [loadSubs]);

  // When form/filter changes, reset to page 1.
  React.useEffect(() => {
    setPage(1);
    setExpandedId(null);
  }, [selectedFormId, filter]);

  const handleUpdate = async (id: string, patch: { isRead?: boolean; isSpam?: boolean; isArchived?: boolean }) => {
    try {
      await getClient().forms.updateSubmission.mutate({ id, ...patch });
      // Filtering is server-side — patching a row in place leaves stale entries in
      // the list (e.g. an "unread" tab still shows a row that was just marked read,
      // a "spam" toggle keeps the row visible in the inbox until next refresh).
      // Refetch keeps the visible set honest with the current filter.
      await loadSubs();
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to update submission.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await getClient().forms.deleteSubmission.mutate({ id });
      // After deleting the last row of the current page, page index can exceed
      // the new totalPages. Step back one page in that case so the user lands
      // somewhere with content. Otherwise refetch the current page.
      const remainingTotal = Math.max(0, (submissions?.total ?? 0) - 1);
      const newTotalPages = Math.max(1, Math.ceil(remainingTotal / PER_PAGE));
      if (page > newTotalPages) {
        setPage(newTotalPages);
      } else {
        await loadSubs();
      }
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to delete submission.");
    }
  };

  // #22 S-tier wire (2026-06-24): the server `forms.exportSubmissions` query
  // existed but no UI called it. Pull the CSV for the selected form (full
  // dataset, not the current page) and trigger a browser download.
  const handleExport = async () => {
    if (!projectId) return;
    setSubsError(null);
    setExporting(true);
    try {
      const csv = await getClient().forms.exportSubmissions.query({
        siteId: projectId,
        formBlockId: selectedFormId || undefined,
        format: "csv",
      });
      if (!csv) {
        setSubsError("No submissions to export.");
        return;
      }
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const formName = forms.find((f) => f.id === selectedFormId)?.name ?? "submissions";
      a.href = url;
      a.download = `${formName.replace(/[^a-z0-9_-]+/gi, "-").toLowerCase()}-submissions.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setSubsError(e instanceof Error ? e.message : "Failed to export submissions.");
    } finally {
      setExporting(false);
    }
  };

  if (!projectId) {
    return (
      <Screen>
        <Section title="Forms">
          <div className={EMPTY}>Open this site from the dashboard to manage forms.</div>
        </Section>
      </Screen>
    );
  }

  if (formsLoading) {
    return (
      <Screen>
        <Section title="Forms">
          <div className={EMPTY}>Loading forms…</div>
        </Section>
      </Screen>
    );
  }

  if (formsError) {
    return (
      <Screen>
        <Section title="Forms">
          <div role="alert" className={ERROR_BOX}>{formsError}</div>
        </Section>
      </Screen>
    );
  }

  if (forms.length === 0) {
    return (
      <Screen>
        <Section title="Forms" desc="No form blocks on this site yet. Drop a Form block onto a page in the canvas to start collecting submissions.">
          <div className={EMPTY}>No forms yet.</div>
        </Section>
      </Screen>
    );
  }

  const totalPages = submissions ? Math.max(1, Math.ceil(submissions.total / PER_PAGE)) : 1;

  return (
    <Screen>
      <Section title="Form" desc="Select a form to view its submissions inbox.">
        <Field label="Form">
          <Select value={selectedFormId} onChange={(e) => setSelectedFormId(e.target.value)}>
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} ({f._count.submissions})
              </option>
            ))}
          </Select>
        </Field>
        <div className={FILTER_ROW} role="tablist" aria-label="Submission filter">
          {(["inbox", "unread", "spam", "archived"] as const).map((f) => (
            <Button
              key={f}
              type="button"
              size="xs"
              color={filter === f ? undefined : "light"}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={CHIP}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </Section>

      <Section title={`Submissions${submissions ? ` (${submissions.total})` : ""}`}>
        <div className="tw:flex tw:justify-end tw:mb-2">
          <Button
            color="light"
            size="xs"
            type="button"
            onClick={handleExport}
            disabled={exporting || subsLoading || !submissions || submissions.total === 0} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
        {subsLoading && <div className={EMPTY}>Loading…</div>}
        {!subsLoading && subsError && (
          <div role="alert" className={ERROR_BOX}>{subsError}</div>
        )}
        {!subsLoading && !subsError && submissions && submissions.data.length === 0 && (
          <div className={EMPTY}>No submissions in {filter}.</div>
        )}
        {!subsLoading && submissions && submissions.data.length > 0 && (
          <ul className={LIST}>
            {submissions.data.map((s) => {
              const isExpanded = expandedId === s.id;
              return (
                <li key={s.id} className={`${ROW} ${s.isRead ? "tw:border-l-gray-300" : "tw:border-l-blue-700"}`}>
                  <Button
                    type="button"
                    color="light"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : s.id);
                      if (!s.isRead) void handleUpdate(s.id, { isRead: true });
                    }}
                    className={ROW_BTN}
                    aria-expanded={isExpanded}
                  >
                    <div className={SUMMARY_ROW}>
                      <span className={`${SUBJECT} ${s.isRead ? "tw:text-[var(--bk-ink-soft)] tw:font-medium" : "tw:text-gray-900 tw:font-semibold"}`}>
                        {summarize(s.data)}
                      </span>
                      <span className={MONO_MICRO}>{formatTime(s.createdAt)}</span>
                    </div>
                    {s.sourceUrl && <div className={SOURCE}>{s.sourceUrl}</div>}
                  </Button>
                  {isExpanded && (
                    <div className={DETAIL}>
                      <dl className={DL}>
                        {Object.entries(s.data).map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt className={DT}>{k}</dt>
                            <dd className={DD}>{String(v)}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                      <div className={ACTIONS}>
                        {!s.isSpam && (
                          <Button color="light" size="xs" type="button" onClick={() => handleUpdate(s.id, { isSpam: true })} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                            Mark spam
                          </Button>
                        )}
                        {s.isSpam && (
                          <Button color="light" size="xs" type="button" onClick={() => handleUpdate(s.id, { isSpam: false })} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                            Not spam
                          </Button>
                        )}
                        {!s.isArchived && (
                          <Button color="light" size="xs" type="button" onClick={() => handleUpdate(s.id, { isArchived: true })} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                            Archive
                          </Button>
                        )}
                        {s.isArchived && (
                          <Button color="light" size="xs" type="button" onClick={() => handleUpdate(s.id, { isArchived: false })} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                            Unarchive
                          </Button>
                        )}
                        <Button color="light" size="xs" type="button" onClick={() => handleDelete(s.id)} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900">
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {submissions && submissions.total > PER_PAGE && (
          <div className={PAGINATION}>
            <Button
              color="light"
              size="xs"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || subsLoading} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              ← Prev
            </Button>
            <span className={PAGE_LABEL}>
              Page {page} of {totalPages}
            </span>
            <Button
              color="light"
              size="xs"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || subsLoading} className="tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900"
            >
              Next →
            </Button>
          </div>
        )}
      </Section>
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

function formatTime(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "—";
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return d.toLocaleDateString();
}

/* `filterChipStyles` and `rowStyles` were aliases of their own base with no
   difference at all — a read/unread and active/idle distinction that existed in
   the names and nowhere in the values. Both states are real class ternaries
   now, so the difference is in the pixels rather than only the identifier. */
const EMPTY =
  "tw:px-3.5 tw:py-3 tw:text-xs tw:text-gray-500 tw:bg-gray-50 tw:border tw:border-dashed tw:border-gray-300 tw:rounded-md";
const ERROR_BOX =
  "tw:mt-1 tw:px-2.5 tw:py-2 tw:text-[11.5px] tw:font-medium tw:[font-family:var(--bk-font-ui)] " +
  "tw:text-[var(--bk-error)] tw:bg-[var(--bk-error-tint)] tw:border tw:border-red-200 tw:rounded-md";
const FILTER_ROW = "tw:flex tw:gap-1 tw:mt-2 tw:flex-wrap";
const CHIP = "tw:px-2.5 tw:py-1 tw:text-[11px] tw:font-medium tw:rounded-full";
const LIST = "tw:list-none tw:p-0 tw:m-0 tw:flex tw:flex-col tw:gap-1";
const ROW = "tw:bg-gray-50 tw:border tw:border-gray-300 tw:rounded-md tw:overflow-hidden tw:border-l-[3px]";
const ROW_BTN =
  "tw:block tw:w-full tw:px-2.5 tw:py-2 tw:text-left tw:bg-transparent tw:border-0 tw:cursor-pointer tw:font-inherit";
const SUMMARY_ROW = "tw:flex tw:justify-between tw:items-center tw:gap-2";
const SUBJECT = "tw:text-xs tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis";
const MONO_MICRO = "tw:[font-family:var(--bk-font-mono)] tw:text-[10px] tw:text-gray-500 tw:flex-none";
const SOURCE =
  "tw:mt-0.5 tw:[font-family:var(--bk-font-mono)] tw:text-[10px] tw:text-gray-500 tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis";
const DETAIL = "tw:px-2.5 tw:pt-2 tw:pb-2.5 tw:border-t tw:border-gray-300 tw:bg-white";
const DL = "tw:grid tw:[grid-template-columns:minmax(80px,25%)_1fr] tw:gap-x-2 tw:gap-y-1 tw:m-0 tw:p-0";
const DT =
  "tw:[font-family:var(--bk-font-mono)] tw:text-[10px] tw:uppercase tw:tracking-[0.04em] tw:text-gray-500 tw:pt-0.5";
const DD = "tw:m-0 tw:text-xs tw:text-gray-900 tw:break-words";
const ACTIONS = "tw:flex tw:gap-1 tw:mt-2.5 tw:flex-wrap";
const PAGINATION = "tw:flex tw:items-center tw:justify-center tw:gap-2 tw:mt-2.5";
const PAGE_LABEL = "tw:[font-family:var(--bk-font-mono)] tw:text-[11px] tw:text-gray-500";
