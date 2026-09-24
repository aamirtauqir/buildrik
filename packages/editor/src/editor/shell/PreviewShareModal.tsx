/**
 * PreviewShareModal — B1 / G1-022 (SH-43, SH-87). Board 4418:165739 ("Share
 * preview" · Preview link · Open ↗ · Copy link) → 6930:82841 ("Link copied").
 *
 * Two doors open it: the site menu's "Share preview link" row and the preview
 * overlay's Share button. Sharing no longer leaves the editor.
 *
 * The link is a real draft share link from the dashboard's own procedures —
 * `siteDetail.sharing.list` is reused when it holds a link a client can open
 * (not expired, no password), otherwise `siteDetail.sharing.create` mints one
 * with the dashboard modal's default name. The URL is `/share/<token>`, the
 * route the dashboard serves; a site id is not a token.
 *
 * Copy is the board's: "current saved design". Owner decision 2026-09-24:
 * `/share/<token>` renders the saved draft (a server lane makes it so).
 *
 * Password and expiry stay in the dashboard's modal — the board carries
 * neither.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, useToast } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";

export interface PreviewShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  siteId: string;
  /** Title and subtitle name what is shared (board 4418:165739). */
  siteName?: string | null;
  pageName?: string | null;
}

interface ShareLinkRow {
  token: string;
  passwordHash: string | null;
  expiresAt: Date | string | null;
}

type LinkState =
  | { kind: "loading" }
  | { kind: "ready"; url: string }
  | { kind: "error"; message: string };

/** The dashboard modal's default link name — one link list, one naming. */
const DEFAULT_LINK_NAME = "Draft preview";

function isOpenToAnyone(row: ShareLinkRow, now: number): boolean {
  if (row.passwordHash) return false;
  return row.expiresAt == null || new Date(row.expiresAt).getTime() > now;
}

/* One reuse-or-create per site at a time. StrictMode runs the open effect
   twice, and both runs saw an empty list and each minted a link — the
   real-site walk found two ShareLinks per open. Concurrent callers now
   share the in-flight promise; it is dropped once settled, so a later
   open (or Try again) asks the server afresh. */
const inflight = new Map<string, Promise<string>>();

function resolveShareToken(siteId: string): Promise<string> {
  const pending = inflight.get(siteId);
  if (pending) return pending;
  const run = findOrCreateShareToken(siteId).finally(() => inflight.delete(siteId));
  inflight.set(siteId, run);
  return run;
}

async function findOrCreateShareToken(siteId: string): Promise<string> {
  const sharing = getBuildrikClient(DASHBOARD_URL).siteDetail.sharing;
  const rows: ShareLinkRow[] = await sharing.list.query({ siteId });
  const reusable = rows.find((row) => isOpenToAnyone(row, Date.now()));
  if (reusable) return reusable.token;
  const created = await sharing.create.mutate({ siteId, name: DEFAULT_LINK_NAME });
  return created.token;
}

const LINK_LABEL_CLASS = "tw:block tw:mt-4 tw:mb-1.5 tw:text-[12px] tw:leading-[18px] tw:font-medium tw:text-[var(--bk-gray-600)]";

/* Board 4418:165739: the link in a grey field (gray-50, gray-200 hairline,
   r6, pad 8/12) with "Open ↗" inside it — not a bordered mono input. */
const LINK_FIELD_CLASS =
  "tw:flex tw:items-center tw:gap-3 tw:px-3 tw:py-2 tw:rounded-md tw:border tw:border-[var(--bk-gray-200)] tw:bg-[var(--bk-gray-50)]";
const LINK_TEXT_CLASS =
  "tw:flex-1 tw:min-w-0 tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap tw:select-all tw:cursor-text " +
  "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:[font-family:var(--bk-font-ui)]";
const OPEN_LINK_CLASS =
  "tw:h-auto tw:border-0 tw:bg-transparent tw:p-0 tw:text-[12px] tw:font-medium tw:text-[var(--bk-accent)] tw:hover:bg-transparent tw:hover:underline";
const SECONDARY_CLASS = "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:text-[var(--bk-gray-700)]";
const PRIMARY_CLASS = "tw:border-0 tw:bg-[var(--bk-accent)] tw:hover:bg-[var(--bk-accent-hover)] tw:text-[var(--bk-accent-on)]";

const STATUS_CLASS = "tw:m-0 tw:text-xs tw:text-[var(--bk-ink-muted)]";

export const PreviewShareModal: React.FC<PreviewShareModalProps> = ({ open, onOpenChange, siteId, siteName, pageName }) => {
  const { addToast } = useToast();
  const [state, setState] = React.useState<LinkState>({ kind: "loading" });
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;
    let live = true;
    setState({ kind: "loading" });
    resolveShareToken(siteId).then(
      (token) => live && setState({ kind: "ready", url: `${DASHBOARD_URL}/share/${token}` }),
      (err: unknown) =>
        live && setState({ kind: "error", message: err instanceof Error ? err.message : String(err) }),
    );
    return () => {
      live = false;
    };
  }, [open, siteId, attempt]);

  const url = state.kind === "ready" ? state.url : null;

  const copy = React.useCallback(() => {
    if (!url) return;
    navigator.clipboard.writeText(url).then(
      () =>
        addToast({
          title: "Link copied",
          description: "The preview link is on your clipboard. Anyone with it can view this site.",
          tone: "success",
        }),
      () => addToast({ description: "Couldn't copy the link", tone: "error" }),
    );
  }, [url, addToast]);

  const page = pageName || "this page";
  const subtitle = [siteName, pageName, "current saved design"].filter(Boolean).join(" · ");
  const close = () => onOpenChange(false);

  /* No ✕ — the board draws none; Done and Escape close it. */
  return (
    <Modal
      open={open}
      onClose={close}
      title={`Share preview of ${page}`}
      testId="preview-share-modal"
      footer={
        <>
          <Button color="alternative" className={SECONDARY_CLASS} disabled={!url} onClick={copy}>
            Copy link
          </Button>
          <Button className={PRIMARY_CLASS} onClick={close}>
            Done
          </Button>
        </>
      }
    >
      <p className="tw:m-0">{subtitle}</p>
      <p className="tw:m-0 tw:mt-4">
        Anyone with the preview link can view this saved design. Editing and publishing access are not included.
      </p>
      <span className={LINK_LABEL_CLASS}>Preview link</span>
      {state.kind === "loading" && (
        <p className={STATUS_CLASS} role="status">
          Getting the link…
        </p>
      )}
      {state.kind === "error" && (
        <div role="alert" className="tw:flex tw:flex-col tw:gap-2">
          <p className="tw:m-0 tw:text-xs tw:font-medium tw:text-[var(--bk-ink)]">
            Couldn&rsquo;t get a preview link
          </p>
          <p className={STATUS_CLASS}>{state.message}</p>
          <Button size="xs" color="light" className="tw:self-start" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </Button>
        </div>
      )}
      {url && (
        <div className={LINK_FIELD_CLASS} data-testid="preview-share-field">
          <code role="textbox" aria-readonly="true" aria-label="Preview link" data-testid="preview-share-link" title={url} className={LINK_TEXT_CLASS}>
            {url}
          </code>
          <Button
            color="alternative"
            className={OPEN_LINK_CLASS}
            aria-label="Open preview link in a new tab"
            onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
          >
            Open ↗
          </Button>
        </div>
      )}
    </Modal>
  );
};
