/**
 * RecentlyDeletedView — the Pages panel's page trash (design-2l9 A-21):
 * list 142:53229, ⋯ menu 142:61796, new-slug restore 142:53954, typed
 * permanent delete 142:55781 / 142:56347, empty 142:56910, restore failed
 * 142:57466, loading 142:58015, offline 142:55231, former folder 144:64795.
 *
 * Owner decision 2026-10-30: a restore over the plan's page limit is refused
 * (the server's "Delete a page or upgrade to restore."), so the view-only
 * restore boards (142:58571 / 142:61405 / 144:65617) are not drawn.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import {
  BK_HELPER_CLASS,
  Button,
  ConfirmDialog,
  Label,
  Menu,
  MenuItem,
  PanelFrame,
  Popover,
  TextInput,
  useToast,
} from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { TrashedPage } from "@buildrik/shared/schemas/pages";
import { PAGE_TRASH_RETENTION_DAYS } from "@buildrik/shared/schemas/pages";
import { usePageTrash } from "../usePageTrash";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NOTE = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
/* 142:53954 / 142:55781: the field label at 14/20 ink, 16 under the sentence. */
const FIELD_LABEL = "tw:mt-2 tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";

function deletedWhen(at: Date, now = new Date()): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(now) - day(at)) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function trashRowMeta(page: TrashedPage): { where: string; who: string } {
  const by = page.deletedBy;
  const who = by ? (by.isYou ? "Deleted by you" : `Deleted by ${by.name ?? "a teammate"}`) : "Deleted";
  return { where: `/${page.slug} · ${page.folderName ?? "Top level"}`, who: `${who} · ${deletedWhen(new Date(page.deletedAt))}` };
}

export interface RecentlyDeletedViewProps {
  composer: Composer | null;
  siteId: string | null;
  /** False only when the role is KNOWN to be below ADMIN (null = unknown: the server decides). */
  canPurge: boolean;
  onBack: () => void;
  /** After a restore: the page is back in its folder on the server (144:64795 / 142:68730). */
  onRestored?: () => void;
  onClose?: () => void;
  onHelpClick?: () => void;
}

export function RecentlyDeletedView({ composer, siteId, canPurge, onBack, onRestored, onClose, onHelpClick }: RecentlyDeletedViewProps) {
  const t = usePageTrash(composer, siteId);
  const { addToast } = useToast();
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [slugAsk, setSlugAsk] = React.useState<{ page: TrashedPage; slug: string } | null>(null);
  const [purgeAsk, setPurgeAsk] = React.useState<{ page: TrashedPage; typed: string } | null>(null);

  const restore = async (page: TrashedPage, slug?: string) => {
    const out = await t.restore(page, slug);
    if (out.kind === "slug-taken") {
      setSlugAsk({ page, slug: out.suggestedSlug });
      return;
    }
    setSlugAsk(null);
    if (out.kind === "restored") {
      onRestored?.();
      /* 142:54521 / 142:59972: back on the Pages list, the restored page in it. */
      onBack();
      addToast({
        description: slug
          ? `${page.name} restored at /${out.slug} · ${page.folderName ?? "Top level"}`
          : `${page.name} restored · /${out.slug}`,
        tone: "info",
        action: { label: "Open", onClick: () => composer?.elements.setActivePage(out.pageId) },
      });
    }
  };

  const purge = async () => {
    if (!purgeAsk) return;
    const { page, typed } = purgeAsk;
    setPurgeAsk(null);
    if (await t.purge(page, typed)) addToast({ description: `${page.name} permanently deleted`, tone: "info" });
  };

  const slugValid = !!slugAsk && SLUG_RE.test(slugAsk.slug);

  return (
    <PanelFrame className="bd-pg-panel" data-testid="pages-trash">
      <PanelFrame.Header
        title={t.items.length ? `Recently deleted · ${t.items.length}` : "Recently deleted"}
        onClose={onClose}
        onHelpClick={onHelpClick}
      />
      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:px-3 tw:pt-3 tw:pb-4">
        <Button
          color="light"
          size="xs"
          className="tw:self-center tw:border-transparent tw:bg-transparent tw:text-[13px] tw:text-[var(--bk-accent-text)] tw:focus:ring-0"
          data-testid="pages-trash-back"
          onClick={onBack}
        >
          ‹ Back to Pages
        </Button>
        {t.load === "loading" ? (
          <p className={NOTE} role="status">Loading deleted pages…</p>
        ) : t.load === "error" ? (
          <p className={NOTE} role="status" data-testid="pages-trash-error">
            Couldn’t load deleted pages.{" "}
            <Button color="light" size="xs" className="tw:inline-flex tw:h-6 tw:min-h-0 tw:px-2" onClick={t.reload}>
              Retry
            </Button>
          </p>
        ) : t.items.length === 0 ? (
          /* 142:56910: the empty line, then the retention line. */
          <>
            <p className={NOTE} data-testid="pages-trash-empty">Nothing deleted in the last {PAGE_TRASH_RETENTION_DAYS} days.</p>
            <p className={NOTE}>Deleted pages stay here for {PAGE_TRASH_RETENTION_DAYS} days.</p>
          </>
        ) : (
          <p className={NOTE}>Deleted pages stay here for {PAGE_TRASH_RETENTION_DAYS} days.</p>
        )}
        {t.load !== "loading" &&
          t.items.map((page) => {
            const meta = trashRowMeta(page);
            const error = t.rowErrors[page.id];
            const busy = t.busyId === page.id;
            return (
              <div key={page.id} className="tw:rounded-md tw:bg-[var(--bk-gray-100)] tw:p-2" data-testid="pages-trash-row">
                <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">{page.name}</p>
                <p className={`${NOTE} tw:mt-1`} data-trash-menu-anchor={menuFor === page.id ? "" : undefined}>
                  {meta.where}
                </p>
                <p className={NOTE}>{meta.who}</p>
                <div className="tw:mt-2 tw:flex tw:items-center tw:gap-2">
                  <Button
                    color="light"
                    size="xs"
                    className="tw:h-8 tw:min-h-0 tw:px-6 tw:text-[13px]"
                    disabled={!t.online || busy}
                    aria-busy={busy || undefined}
                    data-testid="pages-trash-restore"
                    onClick={() => void restore(page)}
                  >
                    {error ? "Retry" : "Restore"}
                  </Button>
                  {canPurge && (
                    <Popover
                      open={menuFor === page.id}
                      onClose={() => setMenuFor(null)}
                      /* Over the canvas, 5px right of the drawer, level with
                         the row's URL line (142:61796); inside the list's scroll
                         box it was clipped at the drawer edge. */
                      beside='[data-testid="pages-trash"]'
                      besideSide="right"
                      besideTop="[data-trash-menu-anchor]"
                      label={`${page.name} actions`}
                      trigger={
                        <Button
                          color="light"
                          size="xs"
                          className="tw:h-8 tw:min-h-0 tw:border-transparent tw:bg-transparent tw:px-4 tw:text-[13px]"
                          aria-haspopup="menu"
                          aria-expanded={menuFor === page.id}
                          data-testid="pages-trash-more"
                          onClick={() => setMenuFor((v) => (v === page.id ? null : page.id))}
                        >
                          More
                        </Button>
                      }
                    >
                      <Menu label={`${page.name} actions`}>
                        <div className="tw:px-2 tw:pt-1 tw:pb-2 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">
                          {page.name}
                        </div>
                        <MenuItem
                          data-testid="pages-trash-purge"
                          onClick={() => {
                            setMenuFor(null);
                            setPurgeAsk({ page, typed: "" });
                          }}
                        >
                          {/* Red on the label: the row's own colour class wins over a className. */}
                          <span className="tw:text-[var(--bk-error-text)]">Delete permanently…</span>
                        </MenuItem>
                        <MenuItem onClick={() => setMenuFor(null)}>Close menu</MenuItem>
                      </Menu>
                    </Popover>
                  )}
                </div>
                {/* 142:55231: the offline note is its own line under the actions. */}
                {!t.online && <p className={`${NOTE} tw:m-0 tw:mt-2`}>Needs a connection</p>}
                {error && (
                  <p className="tw:m-0 tw:mt-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="pages-trash-row-error">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
        {/* 142:53229: the note sits at the drawer's foot, not under the list. */}
        {t.load !== "error" && <p className={`${NOTE} tw:mt-auto`}>Restoring keeps the page’s URL and settings.</p>}
      </div>

      <ConfirmDialog
        open={!!slugAsk}
        onClose={() => setSlugAsk(null)}
        onConfirm={() => slugAsk && void restore(slugAsk.page, slugAsk.slug)}
        title={slugAsk ? `Restore ${slugAsk.page.name} with a new slug` : ""}
        confirmLabel="Restore page"
        cancelStyle="outline"
        width="sm"
        confirmDisabled={!slugValid}
        busy={!!slugAsk && t.busyId === slugAsk.page.id}
        testId="pages-trash-slug"
        message={
          slugAsk && (
            <div className="tw:flex tw:flex-col tw:gap-2">
              <p className="tw:m-0">
                Another page now uses /{slugAsk.page.slug}. Keep that page and choose a different URL for the restored page.
              </p>
              <Label htmlFor="pages-trash-slug-input" className={FIELD_LABEL}>Page URL</Label>
              <TextInput
                id="pages-trash-slug-input"
                sizing="sm"
                value={slugAsk.slug}
                onChange={(e) => setSlugAsk({ ...slugAsk, slug: e.target.value.trim().toLowerCase() })}
              />
              <p className={`${BK_HELPER_CLASS} tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]`}>
                {slugValid ? `/${slugAsk.slug}` : "Use lowercase letters, numbers and hyphens."}
                {slugAsk.page.folderName && (
                  <>
                    <br />
                    {`${slugAsk.page.name} returns to ${slugAsk.page.folderName}.`}
                  </>
                )}
              </p>
            </div>
          )
        }
      />

      <ConfirmDialog
        open={!!purgeAsk}
        onClose={() => setPurgeAsk(null)}
        onConfirm={() => void purge()}
        title={purgeAsk ? `Delete ${purgeAsk.page.name} permanently?` : ""}
        confirmLabel="Delete permanently"
        tone="destructive"
        cancelStyle="outline"
        width="sm"
        confirmDisabled={!purgeAsk || purgeAsk.typed.trim() !== purgeAsk.page.name}
        testId="pages-trash-purge-confirm"
        message={
          purgeAsk && (
            <div className="tw:flex tw:flex-col tw:gap-2">
              <p className="tw:m-0">This can’t be undone. Type {purgeAsk.page.name} to confirm.</p>
              <Label htmlFor="pages-trash-purge-input" className={FIELD_LABEL}>Page name</Label>
              <TextInput
                id="pages-trash-purge-input"
                sizing="sm"
                autoComplete="off"
                value={purgeAsk.typed}
                onChange={(e) => setPurgeAsk({ ...purgeAsk, typed: e.target.value })}
              />
            </div>
          )
        }
      />
    </PanelFrame>
  );
}
