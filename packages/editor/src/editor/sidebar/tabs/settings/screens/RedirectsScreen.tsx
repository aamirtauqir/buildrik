/**
 * RedirectsScreen — list/create/delete URL redirects.
 * Server-side rows (Prisma Redirect table); reads via tRPC siteDetail.redirects.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { createBuildrikApiClient } from "@/services/api-client";
import {
  Field,
  Input,
  SCREEN_EMPTY,
  SCREEN_ERROR,
  SCREEN_NOTICE,
  Screen,
  Section,
  Select,
} from "../shared";
import type { ScreenProps } from "../types";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { Button } from "@/editor/chrome-ui";

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

// A redirect target is either a same-site path (single leading slash) or an
// absolute http(s) URL. Everything else — javascript:/data: schemes,
// protocol-relative "//host", bare domains, free text — is rejected before it
// can be persisted and later served to a visitor.
function isValidRedirectTarget(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
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
    if (!isValidRedirectTarget(trimmedTo)) {
      const msg = "To URL must be a path (/new-page) or full URL (https://example.com/new).";
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
          <div className={SCREEN_EMPTY}>
            Open this site from the dashboard to manage redirects.
          </div>
        </Section>
      </Screen>
    );
  }

  return (
    <Screen>
      <div role="status" className={SCREEN_NOTICE}>
        <strong className="tw:font-semibold">Saved, not yet live.</strong>{" "}
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
            <div role="alert" className={SCREEN_ERROR}>{submitError}</div>
          )}
          <Button type="submit" disabled={submitting} className={ADD_BTN}>
            {submitting ? "Adding…" : "Add redirect"}
          </Button>
        </form>
      </Section>

      <Section title={`Active redirects${rows.length ? ` (${rows.length})` : ""}`}>
        {loading && <div className={SCREEN_EMPTY}>Loading…</div>}
        {!loading && loadError && (
          <div role="alert" className={SCREEN_ERROR}>{loadError}</div>
        )}
        {!loading && !loadError && rows.length === 0 && (
          <div className={SCREEN_EMPTY}>No redirects yet. Add one above.</div>
        )}
        {!loading && rows.length > 0 && (
          <ul className={LIST}>
            {rows.map((r) => (
              <li key={r.id} className={ROW}>
                <div className={PATH_COL}>
                  <div className={`${MONO_CELL} tw:text-[var(--bk-ink)]`}>{r.fromPath}</div>
                  <div className={`${MONO_CELL} tw:text-[var(--bk-ink-muted)]`}>→</div>
                  <div className={`${MONO_CELL} tw:text-[var(--bk-ink-soft)]`}>{r.toUrl}</div>
                </div>
                <div className="tw:flex tw:flex-none tw:items-center tw:gap-2">
                  <span className={TYPE_BADGE}>{r.type}</span>
                  <Button
                    color="light"
                    size="xs"
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    aria-label={`Delete redirect from ${r.fromPath}`}
                    className="tw:px-2 tw:py-1 tw:rounded tw:border tw:border-[var(--bk-border-medium)] tw:bg-transparent tw:text-[11px] tw:font-medium tw:text-[var(--bk-error)]"
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

const ADD_BTN = "tw:mt-2 tw:px-3.5 tw:py-2 tw:rounded-md tw:text-xs tw:font-semibold";
const LIST = "tw:flex tw:flex-col tw:gap-1.5 tw:list-none tw:m-0 tw:p-0";
const ROW =
  "tw:flex tw:items-center tw:justify-between tw:gap-3 tw:px-2.5 tw:py-2 tw:rounded-md " +
  "tw:border tw:border-[var(--bk-border-medium)] tw:bg-[var(--bk-bg-subtle)]";
const PATH_COL = "tw:flex tw:flex-1 tw:items-center tw:gap-2 tw:min-w-0";
const MONO_CELL =
  "tw:whitespace-nowrap tw:overflow-hidden tw:text-ellipsis tw:text-[11px] " +
  "tw:[font-family:var(--bk-font-mono)]";
const TYPE_BADGE =
  "tw:px-1.5 tw:py-0.5 tw:rounded tw:border tw:border-[var(--bk-border-medium)] " +
  "tw:bg-[var(--bk-bg-panel)] tw:text-[10px] tw:font-semibold tw:tracking-[0.04em] " +
  "tw:text-[var(--bk-ink)] tw:[font-family:var(--bk-font-mono)]";
