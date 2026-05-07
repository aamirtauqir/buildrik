/**
 * RedirectsScreen — list/create/delete URL redirects.
 * Server-side rows (Prisma Redirect table); reads via tRPC siteDetail.redirects.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@buildrik/shared";
import { Field, Input, Screen, Section, Select } from "../shared";
import type { ScreenProps } from "../types";

interface Redirect {
  id: string;
  siteId: string;
  fromPath: string;
  toUrl: string;
  type: string;
  createdAt: string | Date;
}

const DASHBOARD_URL = import.meta.env.VITE_DASHBOARD_URL || "http://localhost:3000";

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

export const RedirectsScreen: React.FC<ScreenProps> = ({ projectId }) => {
  const [rows, setRows] = React.useState<Redirect[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [fromPath, setFromPath] = React.useState("");
  const [toUrl, setToUrl] = React.useState("");
  const [type, setType] = React.useState<"301" | "302">("301");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!projectId) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const list = await getClient().siteDetail.redirects.list.query({ siteId: projectId });
      setRows(list as Redirect[]);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load redirects.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setSubmitError(null);

    const trimmedFrom = fromPath.trim();
    const trimmedTo = toUrl.trim();
    if (!trimmedFrom.startsWith("/")) {
      setSubmitError("From path must start with / (e.g. /old-page)");
      return;
    }
    if (!trimmedTo) {
      setSubmitError("To URL is required.");
      return;
    }

    setSubmitting(true);
    try {
      await getClient().siteDetail.redirects.create.mutate({
        siteId: projectId,
        fromPath: trimmedFrom,
        toUrl: trimmedTo,
        type,
      });
      setFromPath("");
      setToUrl("");
      setType("301");
      await reload();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add redirect.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!projectId) return;
    try {
      await getClient().siteDetail.redirects.delete.mutate({ id });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to delete redirect.");
    }
  };

  if (!projectId) {
    return (
      <Screen>
        <Section title="Redirects">
          <div style={emptyStyles}>
            Open this site from the dashboard to manage redirects.
          </div>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <Section
        title="Add redirect"
        desc="Send visitors from an old URL to a new one. 301 (permanent) preserves SEO; 302 (temporary) signals a short-term move."
      >
        <form onSubmit={handleAdd}>
          <Field label="From path" hint="Must start with / (e.g. /old-page or /blog/legacy-post)">
            <Input
              value={fromPath}
              onChange={(e) => setFromPath(e.target.value)}
              placeholder="/old-page"
              disabled={submitting}
            />
          </Field>
          <Field label="To URL" hint="Absolute (https://example.com/new) or path (/new-page)">
            <Input
              value={toUrl}
              onChange={(e) => setToUrl(e.target.value)}
              placeholder="/new-page"
              disabled={submitting}
            />
          </Field>
          <Field label="Type">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as "301" | "302")}
              disabled={submitting}
            >
              <option value="301">301 — Permanent</option>
              <option value="302">302 — Temporary</option>
            </Select>
          </Field>
          {submitError && (
            <div role="alert" style={errorStyles}>{submitError}</div>
          )}
          <button type="submit" disabled={submitting} style={addButtonStyles}>
            {submitting ? "Adding…" : "Add redirect"}
          </button>
        </form>
      </Section>

      <Section title={`Active redirects${rows.length ? ` (${rows.length})` : ""}`}>
        {loading && <div style={emptyStyles}>Loading…</div>}
        {!loading && loadError && (
          <div role="alert" style={errorStyles}>{loadError}</div>
        )}
        {!loading && !loadError && rows.length === 0 && (
          <div style={emptyStyles}>No redirects yet. Add one above.</div>
        )}
        {!loading && rows.length > 0 && (
          <ul style={listStyles}>
            {rows.map((r) => (
              <li key={r.id} style={rowStyles}>
                <div style={pathColStyles}>
                  <div style={fromColStyles}>{r.fromPath}</div>
                  <div style={arrowStyles}>→</div>
                  <div style={toColStyles}>{r.toUrl}</div>
                </div>
                <div style={metaColStyles}>
                  <span style={typeBadgeStyles}>{r.type}</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    style={deleteBtnStyles}
                    aria-label={`Delete redirect from ${r.fromPath}`}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Screen>
  );
};

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
  marginBottom: 8,
  padding: "8px 10px",
  font: "500 11.5px var(--bd-font)",
  color: "var(--bd-error)",
  background: "rgba(220, 38, 38, 0.06)",
  border: "1px solid rgba(220, 38, 38, 0.25)",
  borderRadius: 6,
};

const addButtonStyles: React.CSSProperties = {
  marginTop: 8,
  padding: "8px 14px",
  font: "600 12px var(--bd-font)",
  color: "#fff",
  background: "var(--bd-accent)",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const listStyles: React.CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const rowStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 10px",
  background: "var(--bd-bg-sub)",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 6,
};

const pathColStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  flex: 1,
};

const fromColStyles: React.CSSProperties = {
  fontFamily: "var(--bd-font-mono)",
  fontSize: 11,
  color: "var(--bd-fg-strong)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const arrowStyles: React.CSSProperties = {
  fontFamily: "var(--bd-font-mono)",
  fontSize: 11,
  color: "var(--bd-fg-muted)",
};

const toColStyles: React.CSSProperties = {
  fontFamily: "var(--bd-font-mono)",
  fontSize: 11,
  color: "var(--bd-fg-secondary)",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const metaColStyles: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const typeBadgeStyles: React.CSSProperties = {
  padding: "2px 6px",
  fontFamily: "var(--bd-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.04em",
  color: "var(--bd-fg-strong)",
  background: "var(--bd-bg-default)",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 4,
};

const deleteBtnStyles: React.CSSProperties = {
  padding: "4px 8px",
  font: "500 11px var(--bd-font)",
  color: "var(--bd-fg-secondary)",
  background: "transparent",
  border: "1px solid var(--bd-border-default)",
  borderRadius: 4,
  cursor: "pointer",
};
