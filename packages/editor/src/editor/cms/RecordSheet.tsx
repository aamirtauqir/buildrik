/**
 * RecordSheet — a record's editor, laid wide over the records table
 * (4428:144760; new record 6749:59940; required-missing 5940:148412; save
 * failed 5940:148777; discard guard 6879:67190; record ⋯ 7103:76270).
 *
 * The fields pair up two to a row in the collection's own order; long text
 * and media take a row of their own. Image fields open the Assets pick mode
 * (G3-081: "Choose image · For Margherita · Photo"). The footer states
 * whether the record is eligible for publishing, carries the Published switch
 * (the draft/published status the Records modal's per-row Publish button
 * used to set), then the save state, Cancel and Save record.
 *
 * Delete follows #17/#29: a record that owns a generated page (collection
 * has a URL pattern and the record is published) takes the typed-DELETE
 * dialog; any other record goes at once with Undo on the toast.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { MoreHorizontal, X } from "lucide-react";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  Popover,
  Select,
  Textarea,
  TextInput,
  ToggleSwitch,
  useToast,
} from "@/editor/chrome-ui";
import type { MediaAsset, MediaAssetType } from "@/shared/types/media";
import { fieldDefault } from "@/editor/sidebar/tabs/content/contentPanelUtils";
import { recordTitle } from "./RecordsTable";
import { TypedDeleteDialog } from "./TypedDeleteDialog";
import type { CmsTab } from "./cmsWorkspaceStore";

export type OpenMediaLibrary = (
  allowedTypes: MediaAssetType[],
  onSelect: (asset: MediaAsset) => void,
  forLabel?: string,
) => void;

export interface RecordSheetProps {
  collection: CMSCollection;
  /** null → a new record. */
  record: CMSContentItem | null;
  onClose: () => void;
  /** The sheet's own Records · Fields · Dynamic pages row leaves the sheet. */
  onOpenTab: (tab: CmsTab) => void;
  onSave: (data: Record<string, unknown>, published: boolean) => Promise<unknown>;
  onDelete: (record: CMSContentItem) => Promise<void>;
  /** Undo for an instant delete: writes the record back. */
  onRestore: (record: CMSContentItem) => Promise<void>;
  onOpenMediaLibrary?: OpenMediaLibrary;
}

const LABEL = "tw:block tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const FIELD = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1";
const ERROR = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]";
/* 4428:144760 control: 32 tall, 10 inline, 13/20, radius 6. */
const CONTROL =
  "tw:[&_input]:h-8 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_select]:h-8 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[13px] tw:[&_select]:rounded-[6px]";
const SMALL_BTN = "tw:h-7 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
const NAV_TAB =
  "tw:h-7 tw:min-h-0 tw:rounded-none tw:border-0 tw:border-b-2 tw:border-transparent tw:bg-transparent tw:px-2.5 tw:py-0 tw:text-[13px] " +
  "tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:focus:ring-0";

const WIDE: ReadonlySet<CMSField["type"]> = new Set(["textarea", "richtext", "image", "file"]);

function blank(fields: CMSField[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.slug, fieldDefault(f)]));
}

function isEmpty(v: unknown): boolean {
  return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
}

/** Pair short fields two to a row; wide ones stand alone. */
function rowsOf(fields: CMSField[]): CMSField[][] {
  const rows: CMSField[][] = [];
  let pending: CMSField | null = null;
  for (const f of [...fields].sort((a, b) => a.order - b.order)) {
    if (WIDE.has(f.type)) {
      if (pending) rows.push([pending]);
      pending = null;
      rows.push([f]);
    } else if (pending) {
      rows.push([pending, f]);
      pending = null;
    } else {
      pending = f;
    }
  }
  if (pending) rows.push([pending]);
  return rows;
}

export function RecordSheet({
  collection,
  record,
  onClose,
  onOpenTab,
  onSave,
  onDelete,
  onRestore,
  onOpenMediaLibrary,
}: RecordSheetProps) {
  const { addToast } = useToast();
  const initial = React.useMemo(
    () => ({ ...blank(collection.fields), ...(record?.data ?? {}) }),
    [collection.fields, record],
  );
  const initialPublished = record ? record.status === "published" : false;
  const [form, setForm] = React.useState<Record<string, unknown>>(initial);
  const [published, setPublished] = React.useState(initialPublished);
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [leaveTo, setLeaveTo] = React.useState<null | (() => void)>(null);
  /* The safe answer takes focus: the Modal focuses its first control, which in
     the board's order is Discard — Enter would throw the edits away. */
  const keepRef = React.useRef<HTMLButtonElement | null>(null);
  const leaving = leaveTo !== null;
  React.useEffect(() => {
    if (!leaving) return;
    const id = window.setTimeout(() => keepRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [leaving]);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [typedDelete, setTypedDelete] = React.useState(false);

  React.useEffect(() => {
    setForm(initial);
    setPublished(initialPublished);
    setSaveError(null);
  }, [initial, initialPublished]);

  const dirty =
    published !== initialPublished ||
    collection.fields.some((f) => JSON.stringify(form[f.slug] ?? "") !== JSON.stringify(initial[f.slug] ?? ""));
  const missing = collection.fields.filter((f) => f.validation?.required && isEmpty(form[f.slug]));
  const title = record ? recordTitle(collection, record) : `New ${collection.name.replace(/s$/, "")}`;
  const crumb = record ? title : "New record";

  const guard = (go: () => void) => (dirty ? setLeaveTo(() => go) : go());

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(form, published);
      addToast({ tone: "success", title: "Record saved", description: `${collection.name} · Changes to this record are live in the CMS.` });
      onClose();
    } catch (e) {
      /* A published record is validated against the collection's rules
         (CollectionManager.updateContentItem); anything else is the save
         itself failing — say so where the save button is (5940:148777). */
      setSaveError(
        e instanceof CMSValidationError
          ? e.message
          : "Couldn’t save this record. Your changes are still here — try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const ownsPage = Boolean(record && collection.pageSlugPattern && record.status === "published");
  const remove = async () => {
    if (!record) return;
    setMenuOpen(false);
    if (ownsPage) {
      setTypedDelete(true);
      return;
    }
    await onDelete(record);
    onClose();
    addToast({
      tone: "success",
      title: `${title} deleted`,
      description: collection.name,
      action: { label: "Undo", onClick: () => void onRestore(record) },
    });
  };

  const set = (slug: string, v: unknown) => setForm((p) => ({ ...p, [slug]: v }));

  const control = (f: CMSField) => {
    const id = `cms-field-${f.slug}`;
    const v = form[f.slug];
    const label = (
      <label className={LABEL} htmlFor={id}>
        {f.name}
        {f.validation?.required ? " *" : ""}
      </label>
    );
    const err =
      f.validation?.required && isEmpty(v) && (published || saveError) ? (
        <span className={ERROR} data-testid={`cms-field-error-${f.slug}`}>{f.name} is required to publish</span>
      ) : null;
    if (f.type === "image") {
      const src = typeof v === "string" ? v : "";
      return (
        <div className="tw:flex tw:flex-col tw:gap-1 tw:px-3" key={f.id} data-testid={id}>
          <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)]">{f.name}</span>
          {src ? (
            <span className="tw:flex tw:items-center tw:gap-2">
              <img src={src} alt="" className="tw:size-10 tw:rounded tw:object-cover" />
              <span className="tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">{src.split("/").pop()}</span>
            </span>
          ) : (
            <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)]">No image yet · use Choose image</span>
          )}
          <span className="tw:flex tw:gap-2">
            <Button
              size="xs"
              variant="secondary"
              className={SMALL_BTN}
              disabled={!onOpenMediaLibrary}
              data-testid={`${id}-choose`}
              onClick={() =>
                onOpenMediaLibrary?.(["image"], (asset) => set(f.slug, asset.src), `${crumb} · ${f.name}`)
              }
            >
              Choose image
            </Button>
            {src ? (
              <Button size="xs" variant="ghost" className={SMALL_BTN} data-testid={`${id}-clear`} onClick={() => set(f.slug, "")}>
                Remove
              </Button>
            ) : null}
          </span>
          {err}
        </div>
      );
    }
    let input: React.ReactNode;
    if (f.type === "textarea" || f.type === "richtext") {
      input = (
        <Textarea
          id={id}
          rows={2}
          className="tw:min-h-[58px] tw:rounded-[6px] tw:bg-[var(--bk-bg-panel)] tw:px-2.5 tw:py-2 tw:text-[13px] tw:leading-5"
          value={String(v ?? "")}
          onChange={(e) => set(f.slug, e.target.value)}
        />
      );
    } else if (f.type === "boolean") {
      input = (
        <Select id={id} sizing="sm" className={CONTROL} value={v ? "yes" : "no"} onChange={(e) => set(f.slug, e.target.value === "yes")}>
          <option value="no">No</option>
          <option value="yes">Yes</option>
        </Select>
      );
    } else if (f.type === "select" && f.options?.length) {
      input = (
        <Select id={id} sizing="sm" className={CONTROL} value={String(v ?? "")} onChange={(e) => set(f.slug, e.target.value)}>
          <option value="">—</option>
          {f.options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </Select>
      );
    } else {
      const type = f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text";
      input = (
        <TextInput
          id={id}
          type={type}
          sizing="sm"
          className={CONTROL}
          placeholder={f.placeholder}
          value={v === undefined || v === null ? "" : String(v)}
          onChange={(e) => set(f.slug, f.type === "number" && e.target.value !== "" ? Number(e.target.value) : e.target.value)}
        />
      );
    }
    return (
      <div className={FIELD} key={f.id} data-testid={id}>
        {label}
        {input}
        {err}
      </div>
    );
  };

  return (
    <div
      className="tw:absolute tw:inset-0 tw:z-[var(--bk-z-chrome)] tw:flex tw:flex-col tw:gap-2 tw:overflow-hidden tw:border tw:border-[var(--bk-gray-100)] tw:bg-[var(--bk-bg-panel)] tw:px-8 tw:pb-3"
      role="dialog"
      aria-label={`Record · ${crumb}`}
      data-testid="cms-sheet"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !menuOpen) {
          e.stopPropagation();
          guard(onClose);
        }
      }}
    >
      <header className="tw:flex tw:h-11 tw:w-[280px] tw:flex-none tw:items-center tw:gap-2 tw:px-4">
        <h3 className="tw:m-0 tw:min-w-0 tw:flex-1 tw:truncate tw:text-[14px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]" data-testid="cms-sheet-title">
          {title}
        </h3>
        {record ? (
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            label="Record menu"
            trigger={
              <IconButton label="Record menu" size="sm" pressed={menuOpen} data-testid="cms-sheet-more" onClick={() => setMenuOpen((o) => !o)}>
                <MoreHorizontal size={16} />
              </IconButton>
            }
          >
            <Menu label="Record menu">
              <MenuItem danger data-testid="cms-sheet-delete" onClick={() => void remove()}>
                Delete record…
              </MenuItem>
            </Menu>
          </Popover>
        ) : null}
        <IconButton label="Close record" size="sm" data-testid="cms-sheet-close" onClick={() => guard(onClose)}>
          <X size={16} />
        </IconButton>
      </header>

      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-2 tw:overflow-y-auto">
        <nav className="tw:flex tw:h-9 tw:flex-none tw:items-center tw:gap-1 tw:px-4 tw:text-[13px] tw:leading-5" aria-label="Breadcrumb">
          <Button
            size="xs"
            variant="link"
            className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[13px] tw:font-normal"
            data-testid="cms-sheet-crumb"
            onClick={() => guard(onClose)}
          >
            {collection.name}
          </Button>
          <span className="tw:text-[var(--bk-gray-500)]">›</span>
          <span className="tw:text-[var(--bk-ink)]">{crumb}</span>
        </nav>
        <div className="tw:flex tw:h-9 tw:flex-none tw:items-center tw:gap-1 tw:px-2" role="tablist" aria-label={`${collection.name} sections`}>
          {(
            [
              ["records", "Records"],
              ["fields", "Fields"],
              ["dynamic-pages", "Dynamic pages"],
            ] as const
          ).map(([tab, label]) => (
            <Button
              key={tab}
              role="tab"
              aria-selected={tab === "records"}
              size="xs"
              className={`${NAV_TAB} ${tab === "records" ? "tw:border-[var(--bk-accent)] tw:text-[var(--bk-ink)]" : ""}`}
              data-testid={`cms-sheet-tab-${tab}`}
              onClick={() => (tab === "records" ? guard(onClose) : guard(() => onOpenTab(tab)))}
            >
              {label}
            </Button>
          ))}
        </div>
        {rowsOf(collection.fields).map((row) => (
          <div key={row.map((f) => f.id).join("+")} className="tw:flex tw:w-full tw:items-start tw:gap-3">
            {row.map(control)}
          </div>
        ))}
      </div>

      <footer className="tw:flex tw:flex-none tw:flex-col tw:gap-2 tw:border-t tw:border-[var(--bk-gray-100)] tw:pt-2">
        <div className="tw:flex tw:h-11 tw:items-center tw:gap-2 tw:px-4" data-testid="cms-sheet-eligibility">
          <span
            className={`tw:size-1.5 tw:rounded-full ${missing.length ? "tw:bg-[var(--bk-warning)]" : "tw:bg-[var(--bk-success)]"}`}
            aria-hidden="true"
          />
          <span
            className={`tw:flex-1 tw:text-[13px] tw:leading-5 tw:font-medium ${missing.length ? "tw:text-[var(--bk-warning-text)]" : "tw:text-[var(--bk-success-text)]"}`}
          >
            {missing.length
              ? `Not eligible for publishing — ${missing.map((f) => f.name).join(", ")} ${missing.length === 1 ? "is" : "are"} required`
              : "Eligible for publishing"}
          </span>
          <ToggleSwitch
            checked={published}
            label="Published"
            sizing="sm"
            data-testid="cms-sheet-published"
            onChange={setPublished}
          />
        </div>
        <div className="tw:flex tw:items-center tw:gap-2">
          <span
            className={`tw:flex-1 tw:text-[12px] tw:leading-[18px] tw:font-medium ${saveError ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink)]"}`}
            role={saveError ? "alert" : undefined}
            data-testid="cms-sheet-state"
          >
            {saveError ?? (dirty ? "Unsaved changes on this record" : "No unsaved changes on this record")}
          </span>
          <Button size="xs" variant="secondary" className={SMALL_BTN} data-testid="cms-sheet-cancel" onClick={() => guard(onClose)}>
            Cancel
          </Button>
          <Button size="xs" className={SMALL_BTN} disabled={(!dirty && !!record) || saving} data-testid="cms-sheet-save" onClick={() => void save()}>
            {saveError ? "Retry save" : "Save record"}
          </Button>
        </div>
      </footer>

      {/* 6879:67190 — the danger action first, the safe one last; "Keep
          editing" takes focus, and Escape / the scrim give the same answer. */}
      <Modal
        open={leaveTo !== null}
        onClose={() => setLeaveTo(null)}
        title="Discard record changes?"
        kind="form"
        testId="cms-discard"
        footer={
          <>
            <Button
              variant="danger"
              onClick={() => {
                const go = leaveTo;
                setLeaveTo(null);
                go?.();
              }}
              data-testid="cms-discard-confirm"
            >
              Discard and leave
            </Button>
            <Button ref={keepRef} variant="secondary" onClick={() => setLeaveTo(null)} data-testid="cms-discard-keep">
              Keep editing
            </Button>
          </>
        }
      >
        <p className="tw:m-0">{`${crumb} has unsaved changes. Keep editing to finish them, or discard the edits and leave the record.`}</p>
      </Modal>
      {record ? (
        <TypedDeleteDialog
          open={typedDelete}
          onClose={() => setTypedDelete(false)}
          onConfirm={async () => {
            await onDelete(record);
            setTypedDelete(false);
            onClose();
            addToast({ tone: "success", title: `${title} deleted`, description: `${collection.name} · The record and its generated page are gone.` });
          }}
          name={title}
          consequence="Deleting removes this record and its generated page."
          confirmLabel="Delete record"
          testId="cms-delete-record"
        />
      ) : null}
    </div>
  );
}
