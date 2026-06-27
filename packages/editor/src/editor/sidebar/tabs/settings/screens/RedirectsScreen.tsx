/**
 * RedirectsScreen — list/create/delete URL redirects.
 * Server-side rows (Prisma Redirect table); reads via tRPC siteDetail.redirects.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import { Button } from "@/editor/shared/vibcoder/Button";
import { Field, Input, Screen, Section, Select } from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

interface Redirect {
  id: string;
  siteId: string;
  fromPath: string;
  toUrl: string;
  type: string;
  createdAt: string | Date;
}

let _client: ReturnType<typeof createBuildrikApiClient> | null = null;
function getClient() {
  if (!_client) _client = createBuildrikApiClient(DASHBOARD_URL);
  return _client;
}

export const RedirectsScreen: React.FC<ScreenProps> = ({
  projectId,
  onDirtyChange,
  registerSaveHandler,
}) => {
  const [rows, setRows] = React.useState<Redirect[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const [fromPath, setFromPath] = React.useState("");
  const [toUrl, setToUrl] = React.useState("");
  const [type, setType] = React.useState<"301" | "302">("301");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  // Form is dirty whenever the user has typed *anything* into either input.
  // Type defaulting to "301" doesn't count — it only means "redirect kind."
  const dirty = fromPath.trim().length > 0 || toUrl.trim().length > 0;

  React.useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);

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
      // Drop stale rows on reload failure — showing outdated data alongside an
      // error banner lets users act on rows that may no longer exist server-side.
      setRows([]);
      setLoadError(e instanceof Error ? e.message : "Failed to load redirects.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  const submitDraft = React.useCallback(async () => {
    if (!projectId) return;
    setSubmitError(null);

    const trimmedFrom = fromPath.trim();
    const trimmedTo = toUrl.trim();
    if (!trimmedFrom.startsWith("/")) {
      const msg = "From path must start with / (e.g. /old-page)";
      setSubmitError(msg);
      throw new Error(msg);
    }
    if (!trimmedTo) {
      const msg = "To URL is required.";
      setSubmitError(msg);
      throw new Error(msg);
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
      const msg = err instanceof Error ? err.message : "Failed to add redirect.";
      setSubmitError(msg);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [projectId, fromPath, toUrl, type, reload]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    void submitDraft().catch(() => {
      /* error already surfaced via submitError state */
    });
  };

  // Register submitDraft as the central savebar's save handler whenever the
  // form has draft content. Lets visitors submit either via the inline
  // "Add redirect" button or via the shared savebar without losing the draft.
  React.useEffect(() => {
    if (!registerSaveHandler) return;
    registerSaveHandler(dirty ? submitDraft : null);
    return () => registerSaveHandler(null);
  }, [registerSaveHandler, dirty, submitDraft]);

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
      <div role="status" style={noticeStyles}>
        <strong style={{ fontWeight: 600 }}>Saved, not yet live.</strong>{" "}
        Redirect rules are stored but aren't served on your published site yet —
        visitors hitting the old URL won't be forwarded until deployment wiring
        ships. Your rules are safe and will apply automatically once it's live.
      </div>
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
          <Button type="submit" variant="primary" disabled={submitting} style={addButtonStyles}>
            {submitting ? "Adding…" : "Add redirect"}
          </Button>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label={`Delete redirect from ${r.fromPath}`}
                    style={{ color: "var(--bd-error)" }}
                  >
                    Delete
                  </Button>
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

const noticeStyles: React.CSSProperties = {
  marginBottom: 12,
  padding: "10px 12px",
  fontSize: 12,
  lineHeight: 1.5,
  color: "var(--bd-fg-secondary)",
  background: "var(--bd-bg-sub)",
  border: "1px solid var(--bd-border-default)",
  borderLeft: "3px solid var(--bd-accent)",
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
