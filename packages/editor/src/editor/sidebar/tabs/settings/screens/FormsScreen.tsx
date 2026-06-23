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
import { Button } from "@/editor/shared/vibcoder/Button";
import { Field, Screen, Section, Select } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

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
          <div style={emptyStyles}>Open this site from the dashboard to manage forms.</div>
        </Section>
      </Screen>
    );
  }

  if (formsLoading) {
    return (
      <Screen>
        <Section title="Forms">
          <div style={emptyStyles}>Loading forms…</div>
        </Section>
      </Screen>
    );
  }

  if (formsError) {
    return (
      <Screen>
        <Section title="Forms">
          <div role="alert" style={errorStyles}>{formsError}</div>
        </Section>
      </Screen>
    );
  }

  if (forms.length === 0) {
    return (
      <Screen>
        <Section title="Forms" desc="No form blocks on this site yet. Drop a Form block onto a page in the canvas to start collecting submissions.">
          <div style={emptyStyles}>No forms yet.</div>
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
        <div style={filterRowStyles} role="tablist" aria-label="Submission filter">
          {(["inbox", "unread", "spam", "archived"] as const).map((f) => (
            <Button
              key={f}
              type="button"
              variant="ghost"
              size="sm"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              style={filter === f ? filterChipActiveStyles : filterChipStyles}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </Section>

      <Section title={`Submissions${submissions ? ` (${submissions.total})` : ""}`}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={handleExport}
            disabled={exporting || subsLoading || !submissions || submissions.total === 0}
          >
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
        {subsLoading && <div style={emptyStyles}>Loading…</div>}
        {!subsLoading && subsError && (
          <div role="alert" style={errorStyles}>{subsError}</div>
        )}
        {!subsLoading && !subsError && submissions && submissions.data.length === 0 && (
          <div style={emptyStyles}>No submissions in {filter}.</div>
        )}
        {!subsLoading && submissions && submissions.data.length > 0 && (
          <ul style={listStyles}>
            {submissions.data.map((s) => {
              const isExpanded = expandedId === s.id;
              return (
                <li key={s.id} style={s.isRead ? rowStyles : rowUnreadStyles}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : s.id);
                      if (!s.isRead) void handleUpdate(s.id, { isRead: true });
                    }}
                    style={rowButtonStyles}
                    aria-expanded={isExpanded}
                  >
                    <div style={summaryRowStyles}>
                      <span style={s.isRead ? subjectReadStyles : subjectUnreadStyles}>
                        {summarize(s.data)}
                      </span>
                      <span style={timestampStyles}>{formatTime(s.createdAt)}</span>
                    </div>
                    {s.sourceUrl && <div style={sourceStyles}>{s.sourceUrl}</div>}
                  </Button>
                  {isExpanded && (
                    <div style={detailStyles}>
                      <dl style={dlStyles}>
                        {Object.entries(s.data).map(([k, v]) => (
                          <React.Fragment key={k}>
                            <dt style={dtStyles}>{k}</dt>
                            <dd style={ddStyles}>{String(v)}</dd>
                          </React.Fragment>
                        ))}
                      </dl>
                      <div style={actionsStyles}>
                        {!s.isSpam && (
                          <Button variant="ghost" size="sm" type="button" onClick={() => handleUpdate(s.id, { isSpam: true })} style={actionBtnStyles}>
                            Mark spam
                          </Button>
                        )}
                        {s.isSpam && (
                          <Button variant="ghost" size="sm" type="button" onClick={() => handleUpdate(s.id, { isSpam: false })} style={actionBtnStyles}>
                            Not spam
                          </Button>
                        )}
                        {!s.isArchived && (
                          <Button variant="ghost" size="sm" type="button" onClick={() => handleUpdate(s.id, { isArchived: true })} style={actionBtnStyles}>
                            Archive
                          </Button>
                        )}
                        {s.isArchived && (
                          <Button variant="ghost" size="sm" type="button" onClick={() => handleUpdate(s.id, { isArchived: false })} style={actionBtnStyles}>
                            Unarchive
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" type="button" onClick={() => handleDelete(s.id)} style={deleteBtnStyles}>
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
          <div style={paginationStyles}>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || subsLoading}
              style={pageBtnStyles}
            >
              ← Prev
            </Button>
            <span style={pageLabelStyles}>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || subsLoading}
              style={pageBtnStyles}
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

const emptyStyles: React.CSSProperties = {
  padding: "12px 14px",
  fontSize: 12,
  color: "var(--bd-fg-muted)",
  background: "var(--bd-bg-sub)",
  border: "1px dashed var(--bd-border-default)",
  borderRadius: 6,
};

const errorStyles: React.CSSProperties = {
  marginTop: 4,
  padding: "8px 10px",
  font: "500 11.5px var(--bd-font)",
  color: "var(--bd-error)",
  background: "rgba(220, 38, 38, 0.06)",
  border: "1px solid rgba(220, 38, 38, 0.25)",
  borderRadius: 6,
};

const filterRowStyles: React.CSSProperties = {
  display: "flex",
  gap: 4,
  marginTop: 8,
  flexWrap: "wrap",
};

const filterChipBaseStyles: React.CSSProperties = {
  padding: "4px 10px",
  font: "500 11px var(--bd-font)",
  background: "transparent",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 999,
  cursor: "pointer",
  color: "var(--bd-fg-secondary)",
};

const filterChipStyles: React.CSSProperties = filterChipBaseStyles;

const filterChipActiveStyles: React.CSSProperties = {
  ...filterChipBaseStyles,
  background: "var(--bd-accent-tint)",
  color: "var(--bd-accent)",
  borderColor: "var(--bd-accent)",
};

const listStyles: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const rowBaseStyles: React.CSSProperties = {
  background: "var(--bd-bg-sub)",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 6,
  overflow: "hidden",
};

const rowStyles: React.CSSProperties = rowBaseStyles;

const rowUnreadStyles: React.CSSProperties = {
  ...rowBaseStyles,
  borderLeft: "3px solid var(--bd-accent)",
};

const rowButtonStyles: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "8px 10px",
  textAlign: "left",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  font: "inherit",
};

const summaryRowStyles: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

const subjectReadStyles: React.CSSProperties = {
  fontSize: 12,
  color: "var(--bd-fg-secondary)",
  fontWeight: 500,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const subjectUnreadStyles: React.CSSProperties = {
  ...subjectReadStyles,
  color: "var(--bd-fg-strong)",
  fontWeight: 600,
};

const timestampStyles: React.CSSProperties = {
  fontFamily: "var(--bd-font-mono)",
  fontSize: 10,
  color: "var(--bd-fg-muted)",
  flexShrink: 0,
};

const sourceStyles: React.CSSProperties = {
  marginTop: 2,
  fontFamily: "var(--bd-font-mono)",
  fontSize: 10,
  color: "var(--bd-fg-muted)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const detailStyles: React.CSSProperties = {
  padding: "8px 10px 10px",
  borderTop: "1px solid var(--bd-border-default)",
  background: "var(--bd-bg-default)",
};

const dlStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(80px, 25%) 1fr",
  rowGap: 4,
  columnGap: 8,
  margin: 0,
  padding: 0,
};

const dtStyles: React.CSSProperties = {
  fontFamily: "var(--bd-font-mono)",
  fontSize: 10,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--bd-fg-muted)",
  paddingTop: 2,
};

const ddStyles: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  color: "var(--bd-fg-strong)",
  wordBreak: "break-word",
};

const actionsStyles: React.CSSProperties = {
  display: "flex",
  gap: 4,
  marginTop: 10,
  flexWrap: "wrap",
};

const actionBtnStyles: React.CSSProperties = {
  padding: "4px 8px",
  font: "500 11px var(--bd-font)",
  color: "var(--bd-fg-secondary)",
  background: "transparent",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 4,
  cursor: "pointer",
};

const deleteBtnStyles: React.CSSProperties = {
  ...actionBtnStyles,
  color: "var(--bd-error)",
  borderColor: "rgba(220, 38, 38, 0.4)",
};

const paginationStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  marginTop: 10,
};

const pageBtnStyles: React.CSSProperties = {
  padding: "4px 10px",
  font: "500 11px var(--bd-font)",
  color: "var(--bd-fg-secondary)",
  background: "var(--bd-bg-default)",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 4,
  cursor: "pointer",
};

const pageLabelStyles: React.CSSProperties = {
  fontFamily: "var(--bd-font-mono)",
  fontSize: 11,
  color: "var(--bd-fg-muted)",
};
