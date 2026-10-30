/**
 * RecentlyDeletedComponents — the Components panel's trash (design-2l9):
 * list with bulk selection K19 217:41750, typed permanent delete (Admin)
 * K20 217:42370, restored receipt K42 228:46627.
 *
 * The boards draw Components as a full-page workspace with a left nav; the
 * panel is still the drawer, so the view replaces the drawer's body until
 * ‹ Back to Components, as Pages' Recently deleted does.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Checkbox, ConfirmDialog, Label, PanelBackRow, TextInput, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import { COMPONENT_TRASH_RETENTION_DAYS, type TrashedComponent } from "@buildrik/shared/schemas/site-component";
import type { UseComponentTrash } from "./useComponentTrash";
import { deleteComponentWithUndo } from "./ComponentDetailScreen";

const NOTE = "tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const DAY = 86_400_000;
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function daysBetween(from: Date, to: Date): number {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((day(to) - day(from)) / DAY);
}

/** "Detached 3 instances on 2 pages · Deleted by you · today" (217:41750). */
export function componentTrashMeta(c: TrashedComponent, now = new Date()): { line: string; left: string } {
  const detached = !c.detached
    ? "Deleted from the component library"
    : c.detached.instances === 0
      ? "No instances were detached"
      : `Detached ${plural(c.detached.instances, "instance", "instances")} on ${plural(c.detached.pages, "page", "pages")}`;
  const by = c.deletedBy ? (c.deletedBy.isYou ? "Deleted by you" : `Deleted by ${c.deletedBy.name ?? "a teammate"}`) : "Deleted";
  const ago = daysBetween(new Date(c.deletedAt), now);
  const when = ago <= 0 ? "today" : ago === 1 ? "yesterday" : `${ago} days ago`;
  const left = Math.max(0, COMPONENT_TRASH_RETENTION_DAYS - ago);
  return { line: `${detached} · ${by} · ${when}`, left: left === 0 ? "Deletes today" : `Deletes in ${plural(left, "day", "days")}` };
}

export interface RecentlyDeletedComponentsProps {
  composer: Composer | null;
  trash: UseComponentTrash;
  /** False only when the role is KNOWN to be below ADMIN (null = unknown: the server decides). */
  canPurge: boolean;
  online: boolean;
  onBack: () => void;
}

export function RecentlyDeletedComponents({ composer, trash, canPurge, online, onBack }: RecentlyDeletedComponentsProps) {
  const { addToast } = useToast();
  const [selected, setSelected] = React.useState<string[]>([]);
  const [purgeAsk, setPurgeAsk] = React.useState<string | null>(null);

  // Drop selections whose row left the list (restored, purged, expired).
  React.useEffect(() => {
    setSelected((prev) => prev.filter((id) => trash.items.some((c) => c.componentId === id)));
  }, [trash.items]);

  const toggle = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const restore = async () => {
    const out = await trash.restore(selected);
    if (!out || !composer) return;
    const what = out.names.length === 1 ? out.names[0] : plural(out.names.length, "component", "components");
    addToast({
      description: `${what} restored · ${plural(out.relinked, "unchanged instance", "unchanged instances")} re-linked`,
      action: {
        label: "Undo",
        onClick: () => {
          void (async () => {
            for (const id of out.componentIds) await deleteComponentWithUndo(composer, id);
          })();
        },
      },
      duration: 8000,
    });
  };

  const purge = async () => {
    const ids = selected;
    setPurgeAsk(null);
    if (await trash.purge(ids)) {
      addToast({ description: `${plural(ids.length, "component", "components")} permanently deleted`, tone: "info" });
    }
  };

  const count = selected.length;

  return (
    <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col" data-testid="comp-trash">
      <PanelBackRow label="Components" onClick={onBack} data-testid="comp-trash-back" />
      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-2 tw:overflow-y-auto tw:px-3 tw:pt-2 tw:pb-4">
        <h3 className="tw:m-0 tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]">Recently deleted</h3>
        <p className={NOTE}>
          Deleted components stay here for {COMPONENT_TRASH_RETENTION_DAYS} days. Restoring re-links instances that weren’t changed after
          the detach.
        </p>
        {count > 0 && (
          <div
            className="tw:flex tw:flex-wrap tw:items-center tw:gap-2 tw:rounded-md tw:bg-[var(--bk-accent-tint)] tw:px-2 tw:py-1.5"
            data-testid="comp-trash-bulk"
          >
            <span className="tw:text-[12px] tw:leading-4 tw:font-medium tw:text-[var(--bk-ink)]">{count} selected</span>
            <span className="tw:flex-1" aria-hidden="true" />
            <Button
              color="light"
              size="xs"
              className="tw:h-7 tw:min-h-0 tw:px-3 tw:text-[12px]"
              disabled={!online || trash.busy}
              aria-busy={trash.busy || undefined}
              data-testid="comp-trash-restore"
              onClick={() => void restore()}
            >
              Restore
            </Button>
            {canPurge && (
              <Button
                color="light"
                size="xs"
                className="tw:h-7 tw:min-h-0 tw:px-3 tw:text-[12px] tw:text-[var(--bk-error-text)]"
                disabled={!online || trash.busy}
                data-testid="comp-trash-purge"
                onClick={() => setPurgeAsk("")}
              >
                Delete permanently
              </Button>
            )}
            <Button variant="link" size="xs" className="tw:h-7 tw:p-0 tw:text-[12px]" data-testid="comp-trash-clear" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
        )}
        {!online && <p className={NOTE} role="status">Restoring and deleting need a connection.</p>}
        {trash.error && (
          <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="comp-trash-error">
            {trash.error}
          </p>
        )}
        {trash.load === "loading" ? (
          <p className={NOTE} role="status">Loading deleted components…</p>
        ) : trash.load === "error" ? (
          <p className={NOTE} role="status" data-testid="comp-trash-load-error">
            Couldn’t load deleted components.{" "}
            <Button color="light" size="xs" className="tw:inline-flex tw:h-6 tw:min-h-0 tw:px-2" onClick={trash.reload}>
              Retry
            </Button>
          </p>
        ) : trash.items.length === 0 ? (
          <p className={NOTE} data-testid="comp-trash-empty">Nothing deleted in the last {COMPONENT_TRASH_RETENTION_DAYS} days.</p>
        ) : (
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:p-0" aria-label="Recently deleted components">
            {trash.items.map((c) => {
              const meta = componentTrashMeta(c);
              const on = selected.includes(c.componentId);
              const id = `comp-trash-${c.componentId}`;
              return (
                <li
                  key={c.componentId}
                  className={`tw:flex tw:items-start tw:gap-2 tw:rounded-md tw:px-2 tw:py-2${on ? " tw:bg-[var(--bk-accent-tint)]" : ""}`}
                  data-testid="comp-trash-row"
                >
                  <Checkbox id={id} checked={on} onChange={() => toggle(c.componentId)} className="tw:mt-0.5" />
                  <Label htmlFor={id} className="tw:flex tw:min-w-0 tw:flex-1 tw:cursor-pointer tw:flex-col tw:gap-0.5">
                    <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]" title={c.name}>
                      {c.name}
                    </span>
                    <span className={NOTE}>{meta.line}</span>
                    <span className={NOTE}>{meta.left}</span>
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={purgeAsk !== null}
        onClose={() => setPurgeAsk(null)}
        onConfirm={() => void purge()}
        title={count === 1 ? "Delete 1 component permanently?" : `Delete ${count} components permanently?`}
        confirmLabel="Delete permanently"
        tone="destructive"
        cancelStyle="outline"
        width="sm"
        confirmDisabled={purgeAsk !== "DELETE"}
        testId="comp-trash-purge-confirm"
        message={
          <div className="tw:flex tw:flex-col tw:gap-2">
            <p className="tw:m-0">This can’t be undone. Instances already detached stay on their pages as ordinary content.</p>
            <Label htmlFor="comp-trash-purge-input" className="tw:mt-2 tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">
              Type DELETE to confirm
            </Label>
            <TextInput id="comp-trash-purge-input" sizing="sm" value={purgeAsk ?? ""} onChange={(e) => setPurgeAsk(e.target.value)} />
          </div>
        }
      />
    </div>
  );
}
