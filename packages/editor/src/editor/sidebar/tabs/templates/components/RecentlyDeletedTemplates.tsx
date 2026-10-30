/**
 * Recently deleted saved templates (design-2l9 B6-T24 251:73352 … T33
 * 251:75097), in the Templates view's main column:
 *
 *   ‹ Back to Saved templates
 *   Recently deleted
 *   Saved page templates stay here for 30 days. Restoring keeps the original template identity.
 *   [ Fieldwork home · Deleted today · 30 days left · 7 sections   Restore  Delete permanently… ]
 *   Permanent deletion needs Admin access and cannot be undone.
 *
 * Restore (T25 pending, T26 done, T27 refused) and the typed permanent delete
 * (T30/T31, T32 pending, T33 done) are server calls (`templateTrash`).
 * Offline (T28) both are unavailable.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, ConfirmDialog, Label, Modal, TextInput, BK_LABEL_CLASS, useToast } from "@/editor/chrome-ui";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { templateTrash } from "@/services/TemplateTrashService";
import { USER_TEMPLATE_TRASH_RETENTION_DAYS, type TrashedUserTemplate } from "@buildrik/shared/schemas/user-template";
import { getSectionCount } from "../templatesData";

const NOTE = "tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]";
const DAY = 24 * 60 * 60 * 1000;

/** "Deleted today · 30 days left · 7 sections". */
function rowMeta(t: TrashedUserTemplate, now = Date.now()): string {
  const ago = Math.floor((now - new Date(t.deletedAt).getTime()) / DAY);
  const left = Math.max(0, USER_TEMPLATE_TRASH_RETENTION_DAYS - ago);
  const when = ago <= 0 ? "Deleted today" : ago === 1 ? "Deleted yesterday" : `Deleted ${ago} days ago`;
  const sections = getSectionCount(t.html);
  return `${when} · ${left} day${left === 1 ? "" : "s"} left · ${sections} section${sections === 1 ? "" : "s"}`;
}

export interface RecentlyDeletedTemplatesProps {
  onBack: () => void;
  /** After a restore: re-read the catalogue (the template is saved again). */
  onRestored: () => void;
  /** False only when the role is KNOWN to be below ADMIN. */
  canPurge: boolean;
}

export function RecentlyDeletedTemplates({ onBack, onRestored, canPurge }: RecentlyDeletedTemplatesProps) {
  const { addToast } = useToast();
  const online = useOnlineStatus();
  const [items, setItems] = React.useState<TrashedUserTemplate[] | null>(null);
  const [loadFailed, setLoadFailed] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rowError, setRowError] = React.useState<Record<string, string>>({});
  const [purgeAsk, setPurgeAsk] = React.useState<{ item: TrashedUserTemplate; typed: string } | null>(null);
  const [purging, setPurging] = React.useState<TrashedUserTemplate | null>(null);

  React.useEffect(() => {
    let live = true;
    void templateTrash.list().then((r) => {
      if (!live) return;
      if (r.ok) setItems(r.value);
      else if (r.reason === "no-site") setItems([]);
      else setLoadFailed(true);
    });
    return () => {
      live = false;
    };
  }, []);

  const restore = async (t: TrashedUserTemplate) => {
    setBusyId(t.templateId);
    setRowError((e) => ({ ...e, [t.templateId]: "" }));
    const r = await templateTrash.restore(t.templateId);
    setBusyId(null);
    if (r.ok) {
      onRestored();
      onBack();
      addToast({ description: `${t.name} restored`, tone: "info" });
      return;
    }
    if (r.reason === "not-found") setItems((list) => list?.filter((x) => x.templateId !== t.templateId) ?? null);
    setRowError((e) => ({ ...e, [t.templateId]: `Couldn’t restore ${t.name}. It is still in Recently deleted; try again.` }));
  };

  const purge = async () => {
    if (!purgeAsk) return;
    const { item, typed } = purgeAsk;
    setPurgeAsk(null);
    setPurging(item);
    const r = await templateTrash.purge(item.templateId, typed);
    setPurging(null);
    if (r.ok || r.reason === "not-found") {
      setItems((list) => list?.filter((x) => x.templateId !== item.templateId) ?? null);
      if (r.ok) addToast({ description: `${item.name} permanently deleted. Existing pages are unchanged.`, tone: "info" });
      return;
    }
    setRowError((e) => ({
      ...e,
      [item.templateId]: r.reason === "forbidden" ? "Only an admin can delete a template permanently." : `Couldn’t delete ${item.name}. Try again.`,
    }));
  };

  return (
    <div className="tw:flex tw:flex-col tw:gap-4 tw:px-8 tw:pt-2 tw:pb-8" data-testid="tpl-trash">
      <div>
        <Button type="button" variant="link" size="xs" className="tw:h-8 tw:px-0 tw:text-[13px] tw:font-normal" onClick={onBack} data-testid="tpl-trash-back">
          ‹ Back to Saved templates
        </Button>
      </div>
      <h2 className="tw:m-0 tw:text-[20px] tw:leading-7 tw:font-semibold tw:text-[var(--bk-ink)]">Recently deleted</h2>
      <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
        Saved page templates stay here for {USER_TEMPLATE_TRASH_RETENTION_DAYS} days. Restoring keeps the original template identity.
      </p>

      {loadFailed ? (
        <p className={NOTE} role="alert">Couldn’t load Recently deleted. Check your connection and open it again.</p>
      ) : items === null ? (
        <p className={NOTE} role="status">Loading…</p>
      ) : items.length === 0 ? (
        <div data-testid="tpl-trash-empty">
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">No recently deleted templates</p>
          <p className={NOTE}>Deleted saved templates appear here until their recovery period ends.</p>
        </div>
      ) : (
        items.map((t) => (
          <div key={t.templateId} className="tw:flex tw:flex-col tw:gap-2" data-testid="tpl-trash-row">
            <div className="tw:flex tw:items-center tw:gap-3 tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] tw:bg-white tw:px-4 tw:py-4">
              <div className="tw:min-w-0 tw:flex-1">
                <p className="tw:m-0 tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">{t.name}</p>
                <p className={NOTE}>{rowMeta(t)}</p>
              </div>
              <Button
                size="sm"
                className="tw:h-8 tw:w-[112px] tw:text-[13px] tw:font-medium"
                disabled={!online || busyId === t.templateId}
                onClick={() => void restore(t)}
                data-testid="tpl-trash-restore"
              >
                {busyId === t.templateId ? "Restoring…" : "Restore"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="tw:h-8 tw:w-[208px] tw:text-[13px] tw:font-medium"
                disabled={!online || !canPurge || busyId === t.templateId}
                onClick={() => setPurgeAsk({ item: t, typed: "" })}
                data-testid="tpl-trash-purge"
              >
                Delete permanently…
              </Button>
            </div>
            {rowError[t.templateId] ? (
              <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" role="alert" data-testid="tpl-trash-row-error">
                {rowError[t.templateId]}
              </p>
            ) : null}
            {!online ? <p className={NOTE}>Needs a connection. Restore and permanent deletion are unavailable offline.</p> : null}
          </div>
        ))
      )}

      <p className={NOTE}>Permanent deletion needs Admin access and cannot be undone.</p>

      <ConfirmDialog
        open={!!purgeAsk}
        onClose={() => setPurgeAsk(null)}
        onConfirm={() => void purge()}
        title={purgeAsk ? `Delete ${purgeAsk.item.name} permanently?` : ""}
        confirmLabel="Delete permanently"
        tone="destructive"
        cancelStyle="outline"
        /* 251:74485 — a 480 dialog. */
        width="sm"
        confirmDisabled={!purgeAsk || purgeAsk.typed.trim() !== purgeAsk.item.name}
        testId="tpl-trash-purge-confirm"
        message={
          purgeAsk && (
            <div className="tw:flex tw:flex-col tw:gap-2">
              <p className="tw:m-0">This saved template cannot be restored. Pages already created from it are not deleted.</p>
              <Label htmlFor="tpl-trash-purge-input" className={BK_LABEL_CLASS}>{`Type ${purgeAsk.item.name} to confirm`}</Label>
              <TextInput
                id="tpl-trash-purge-input"
                sizing="sm"
                autoComplete="off"
                value={purgeAsk.typed}
                onChange={(e) => setPurgeAsk({ ...purgeAsk, typed: e.target.value })}
                data-testid="tpl-trash-purge-input"
              />
            </div>
          )
        }
      />
      <Modal open={!!purging} onClose={() => undefined} title={purging ? `Deleting ${purging.name}…` : ""} testId="tpl-trash-purging">
        <p className="tw:m-0">The saved template remains unavailable while deletion is being confirmed.</p>
      </Modal>
    </div>
  );
}
