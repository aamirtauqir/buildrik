/**
 * RecordSheet — a record's editor, laid wide over the records table
 * (4428:144760; new record 6749:59940; required-missing 5940:148412; save
 * failed 5940:148777; discard guard 6879:67190; record ⋯ 7103:76270;
 * conflict 8139:217560; record / collection deleted 8139:217711 · 8139:217890).
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
import { BACK } from "./paneStyles";
import { MoreHorizontal, TriangleAlert, X } from "lucide-react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import {
  Button,
  Chip,
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
import { RecordPreview } from "./RecordPreview";
import { RecordTemplatePreviewDialog } from "./RecordTemplatePreviewDialog";
import { applyCmsPattern, cmsSlugField, cmsSlugify, cmsValueError } from "@buildrik/shared/schemas/cms";
import { cmsWorkspace, type CmsTab } from "./cmsWorkspaceStore";
import { shellDirty } from "@/editor/shell/shellDirtyRegistry";
import { claimCmsConflict, isCmsConflictPending, type CmsConflict } from "@/services/cmsSync";

export type OpenMediaLibrary = (
  allowedTypes: MediaAssetType[],
  onSelect: (asset: MediaAsset) => void,
  forLabel?: string,
) => void;

export interface RecordSheetProps {
  composer: Composer | null;
  collection: CMSCollection;
  /** null → a new record. */
  record: CMSContentItem | null;
  onClose: () => void;
  /** Opened from an element (§13 Open record ›): "‹ Back to canvas" leads the
   *  sheet's header — it covers the workspace's own. Absent, not drawn. */
  onBackToCanvas?: () => void;
  /** The sheet's own Records · Fields · Dynamic pages row leaves the sheet. */
  onOpenTab: (tab: CmsTab) => void;
  /** Resolve when the save has either reached the server (true), been
   *  queued for retry (false), or been refused because another device changed
   *  the record ("conflict" — the toast offers Keep mine / Use theirs). The
   *  sheet stays open on the last two — closing on a queued save was hiding
   *  the queued mirror from the user.
   *  `{ refused }`: the server refused the record under the collection's
   *  rules (the shared validator) — the sheet shows the reason and stays. */
  onSave: (data: Record<string, unknown>, published: boolean) => Promise<boolean | "conflict" | { refused: string }>;
  onDelete: (record: CMSContentItem) => Promise<void>;
  /** Undo for an instant delete: writes the record back. */
  onRestore: (record: CMSContentItem) => Promise<void>;
  onOpenMediaLibrary?: OpenMediaLibrary;
  /** Another device deleted this record (or its collection) and the server
   *  refused the edit (8139:217711 / 8139:217890): the sheet stays to say the
   *  change wasn't saved, and can only be closed. */
  gone?: boolean;
}

const LABEL = "tw:block tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const FIELD = "tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1";
const ERROR = "tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]";
/* 4428:144760 control: 32 tall, 10 inline, 13/20, radius 6. */
const CONTROL =
  "tw:[&_input]:h-8 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[13px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_select]:h-8 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[13px] tw:[&_select]:rounded-[6px]";
const SMALL_BTN = "tw:h-7 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
/* 8139:217692 — the conflict choice: 32 tall, 12 inline, 13/20 medium. */
const CHOICE_BTN = "tw:h-8 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
const NAV_TAB =
  "tw:h-7 tw:min-h-0 tw:rounded-none tw:border-0 tw:border-b-2 tw:border-transparent tw:bg-transparent tw:px-2.5 tw:py-0 tw:text-[13px] " +
  "tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:focus:ring-0";

const OFFLINE = "Saved on this device only. The server is offline — the change will sync when you reconnect.";

const WIDE: ReadonlySet<CMSField["type"]> = new Set(["textarea", "richtext", "image", "file", "multiselect"]);

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
  composer,
  collection,
  record,
  onClose,
  onBackToCanvas,
  onOpenTab,
  onSave,
  onDelete,
  onRestore,
  onOpenMediaLibrary,
  gone = false,
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
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [typedDelete, setTypedDelete] = React.useState(false);
  const [templatePreviewOpen, setTemplatePreviewOpen] = React.useState(false);

  const lastRecordId = React.useRef<string | null>(record?.id ?? "new");
  React.useEffect(() => {
    /* Reset the form when the row being edited changes (or a new sheet opens);
       the saveError resets too — the new sheet has nothing to recover from.
       Re-renders that come back with the same record id (engine reload after
       `saveRecord` builds a new `record` object with the same id) must NOT
       wipe a queued-mirror message the user is still looking at. */
    const currentId = record?.id ?? "new";
    if (currentId === lastRecordId.current) return;
    lastRecordId.current = currentId;
    setForm(initial);
    setPublished(initialPublished);
    setSaveError(null);
  }, [initial, initialPublished, record]);

  const dirty =
    published !== initialPublished ||
    collection.fields.some((f) => JSON.stringify(form[f.slug] ?? "") !== JSON.stringify(initial[f.slug] ?? ""));
  const missing = collection.fields.filter((f) => f.validation?.required && isEmpty(form[f.slug]));
  /* UI-08: a collection with no fields has nothing to store — Save made an
     empty record. */
  const noFields = collection.fields.length === 0;
  const singular = collection.name.replace(/s$/, "");
  const title = record ? recordTitle(collection, record) : `New ${singular}`;
  const crumb = record ? title : "New record";

  /* Leaving on purpose (saved, discarded, deleted, the server's copy taken)
     must not meet the workspace's leave guard below. */
  const leaving$ = React.useRef(false);
  const leave = (go: () => void) => {
    leaving$.current = true;
    go();
  };
  /* A deleted record has nothing left to discard: its edit is already lost. */
  const guard = (go: () => void) => (dirty && !gone ? setLeaveTo(() => go) : leave(go));
  /* UI-02: every other door out of this record — a drawer collection row, ⌘K,
     a table row, a tab — moves the workspace store, which asks here first. */
  const stillDirty = React.useRef(false);
  stillDirty.current = dirty && !gone;
  React.useEffect(
    () =>
      cmsWorkspace.setLeaveGuard((go) => {
        if (leaving$.current || !stillDirty.current) return false;
        setLeaveTo(() => go);
        return true;
      }),
    [],
  );

  /* 8139:217560 — a save the server refused because another device changed
     the record waits here for Keep mine / Use theirs, not in the shell's
     toast. Closing the sheet with the choice still open hands it back to the
     toast (claimCmsConflict's release). */
  const [conflict, setConflict] = React.useState<CmsConflict | null>(null);
  const [resolving, setResolving] = React.useState(false);
  const conflictRef = React.useRef<CmsConflict | null>(null);
  const recordId = record?.id ?? null;
  React.useEffect(() => {
    if (!recordId) return;
    const release = claimCmsConflict("entry", recordId, (c) => {
      conflictRef.current = c;
      setConflict(c);
    });
    return () => release(conflictRef.current);
  }, [recordId]);
  const settleConflict = () => {
    conflictRef.current = null;
    setConflict(null);
  };

  // shellDirtyRegistry (B-1): this sheet already guards its OWN Cancel/Close
  // via `guard` above, but a shell-level tab switch (⌘H, ⇧A, the palette,
  // ui:switch-tab, UI_PANEL_OPEN) doesn't go through that — it just
  // unmounts this sheet. Registering `dirty` here lets the shell's own
  // switch guard catch that case too. Cleared on unmount so a closed sheet
  // never leaves a stale block behind.
  React.useEffect(() => {
    shellDirty.set("cms-record", dirty);
    return () => shellDirty.set("cms-record", false);
  }, [dirty]);
  /* The shell's "Leave anyway" runs this: the edits live only in this
     sheet's fields, so resetting them is exactly the loss the confirm names. */
  React.useEffect(() => {
    shellDirty.setDiscard("cms-record", () => {
      setForm(initial);
      setPublished(initialPublished);
      shellDirty.set("cms-record", false);
    });
    return () => shellDirty.setDiscard("cms-record", null);
  }, [initial, initialPublished]);

  /* 6561:54690 — the collection rides in the title; the body says what the
     save reached and what it did not yet. */
  const closeSaved = () => {
    addToast({
      tone: "success",
      title: `Record saved · ${collection.name}`,
      description: "Changes to this record are live in the CMS. Published pages using this record will refresh on next build.",
    });
    leave(onClose);
  };

  /* Keep mine re-sends this device's copy; it can conflict again (the claim
     then holds the new choice), land, or queue. Use theirs replaces this
     device's copy with the server's, so the sheet's edits are gone with it. */
  const choose = async (choice: "keepMine" | "useTheirs") => {
    const c = conflict;
    if (!c) return;
    setResolving(true);
    try {
      if (choice === "useTheirs") {
        await c.useTheirs();
        settleConflict();
        leave(onClose);
        return;
      }
      const landed = await c.keepMine();
      if (isCmsConflictPending("entry", c.id)) return;
      settleConflict();
      if (landed) closeSaved();
      else setSaveError(OFFLINE);
    } finally {
      setResolving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const reached = await onSave(form, published);
      if (reached === true) {
        closeSaved();
      } else if (typeof reached === "object") {
        setSaveError(reached.refused);
      } else if (reached !== "conflict") {
        /* "conflict": the server answered that another device changed this
           record; the claim above already holds the choice and the footer
           says so (8139:217560).
           Otherwise (P0-B audit 2026-09-30) a queued mirror (network down or
           the server refused this stamp) must not silently close the sheet.
           The local write already happened; the change is on this device,
           the next online tick replays it. The sheet's own footer carries
           the state so the user knows what to expect (and that the toast on
           the right isn't lying about "live in the CMS"). */
        setSaveError(OFFLINE);
      }
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

  const blocked = gone || conflict !== null;

  const ownsPage = Boolean(record && collection.pageSlugPattern && record.status === "published");
  const remove = async () => {
    if (!record) return;
    setMenuOpen(false);
    if (ownsPage) {
      setTypedDelete(true);
      return;
    }
    await onDelete(record);
    leave(onClose);
    /* 6881:70387 — "<name> deleted · <collection>", what went, what Undo does. */
    addToast({
      tone: "success",
      title: `${title} deleted · ${collection.name}`,
      description: "The record is gone. Undo restores it.",
      action: { label: "Undo", onClick: () => void onRestore(record) },
    });
  };

  /* 6749:59940 — a new record's slug follows its name ("auto from name")
     until someone types into the slug field itself. */
  const nameSlug = collection.displayField ?? "name";
  /* The slug is a real field type (CMS-09); a collection from before the
     type keeps a field keyed `slug`. */
  const slugKey = cmsSlugField(collection.fields)?.slug ?? null;
  const autoSlug = !record && slugKey !== null && collection.fields.some((f) => f.slug === nameSlug);
  const [slugTouched, setSlugTouched] = React.useState(false);
  const nameField = collection.fields.find((f) => f.slug === nameSlug);
  const nameMissing = Boolean(nameField) && isEmpty(form[nameSlug]);
  const set = (slug: string, v: unknown) => {
    if (slug === slugKey) setSlugTouched(true);
    setForm((p) => ({
      ...p,
      [slug]: v,
      ...(autoSlug && slugKey && !slugTouched && slug === nameSlug ? { [slugKey]: cmsSlugify(String(v ?? "")) } : {}),
    }));
  };

  const control = (f: CMSField) => {
    const id = `cms-field-${f.slug}`;
    const v = form[f.slug];
    const label = (
      <label className={LABEL} htmlFor={id} id={`${id}-label`}>
        {f.name}
        {f.validation?.required ? " *" : ""}
      </label>
    );
    /* Per-field rules run live (§10c) — the shared validator, so the sheet
       says what the server would refuse: a slug's format, a number, a URL… */
    const problem = isEmpty(v)
      ? f.validation?.required && (published || saveError)
        ? `${f.name} is required to publish`
        : null
      : cmsValueError(f, v);
    const err = problem ? (
      <span className={ERROR} data-testid={`cms-field-error-${f.slug}`}>{problem}</span>
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
    } else if (f.type === "multiselect") {
      /* PD-1: a chip per option; the value is the list of chosen options
         (a text box here stored "a,b" over the array — UI-07). */
      const chosen = Array.isArray(v) ? (v as string[]) : [];
      input = f.options?.length ? (
        <span className="tw:flex tw:flex-wrap tw:gap-1" role="group" aria-labelledby={`${id}-label`} data-testid={`${id}-chips`}>
          {f.options.map((o) => (
            <Chip
              key={o}
              label={o}
              selected={chosen.includes(o)}
              onClick={() => set(f.slug, chosen.includes(o) ? chosen.filter((x) => x !== o) : [...chosen, o])}
            />
          ))}
        </span>
      ) : (
        <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">No options yet · add them in Fields</span>
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
          placeholder={autoSlug && f.slug === slugKey ? "auto from name" : f.placeholder}
          value={v === undefined || v === null ? "" : String(v)}
          onChange={(e) =>
            set(f.slug, f.type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)
          }
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
      className="tw:absolute tw:inset-0 tw:z-[var(--bk-z-chrome)] tw:flex tw:overflow-hidden tw:border tw:border-[var(--bk-gray-100)] tw:bg-[var(--bk-bg-panel)]"
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
      <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-2 tw:px-8 tw:pb-3">
      <header className="tw:flex tw:h-11 tw:w-[280px] tw:flex-none tw:items-center tw:gap-2 tw:px-4">
        {onBackToCanvas ? (
          <Button color="light" size="xs" className={`${BACK} tw:flex-none`} data-testid="cms-sheet-back-to-canvas" onClick={() => guard(onBackToCanvas)}>
            ‹ Back to canvas
          </Button>
        ) : null}
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
              <MenuItem
                data-testid="cms-sheet-preview-template"
                onClick={() => {
                  setMenuOpen(false);
                  setTemplatePreviewOpen(true);
                }}
              >
                Preview saved record
              </MenuItem>
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
        {/* 7116:76427 — "Preview ▸" opens the read-only card beside the form. */}
        <Button
          size="xs"
          variant="link"
          aria-expanded={previewOpen}
          className="tw:h-auto tw:min-h-0 tw:self-start tw:p-0 tw:text-[12px] tw:font-medium"
          data-testid="cms-sheet-preview"
          onClick={() => setPreviewOpen((o) => !o)}
        >
          Preview ▸
        </Button>
      </div>

      {conflict && !gone ? (
        /* 8139:217690 — the choice sits on the footer's rule, warning tint,
           8px wider than the form on each side. */
        <div
          className="tw:-mx-2 tw:-mb-2 tw:flex tw:flex-none tw:flex-col tw:gap-2 tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-3"
          role="alert"
          data-testid="cms-sheet-conflict"
        >
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            Someone else changed this record. Choose Keep mine or Use theirs.
          </p>
          <div className="tw:flex tw:h-8 tw:items-center tw:gap-2">
            <Button
              size="sm"
              variant="ghost"
              className={CHOICE_BTN}
              disabled={resolving}
              data-testid="cms-sheet-keep-mine"
              onClick={() => void choose("keepMine")}
            >
              Keep mine
            </Button>
            <Button size="sm" className={CHOICE_BTN} disabled={resolving} data-testid="cms-sheet-use-theirs" onClick={() => void choose("useTheirs")}>
              Use theirs
            </Button>
          </div>
        </div>
      ) : null}

      <footer className="tw:flex tw:flex-none tw:flex-col tw:gap-2 tw:border-t tw:border-[var(--bk-gray-100)] tw:pt-2">
        {blocked ? (
          /* 8139:217560 / 8139:217711 — nothing here can publish until the
             conflict is chosen or the sheet is left; the switch steps aside. */
          <div className="tw:flex tw:h-11 tw:items-center tw:gap-2 tw:px-4" data-testid="cms-sheet-eligibility">
            <span
              className={`tw:size-1.5 tw:rounded-full ${gone ? "tw:bg-[var(--bk-gray-500)]" : "tw:bg-[var(--bk-warning)]"}`}
              aria-hidden="true"
            />
            <span className="tw:flex-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-gray-500)]">
              {gone ? "This item is no longer available" : "Resolve the conflict before publishing"}
            </span>
          </div>
        ) : (
        <div className="tw:flex tw:h-11 tw:items-center tw:gap-2 tw:px-4" data-testid="cms-sheet-eligibility">
          <span
            className={`tw:size-1.5 tw:rounded-full ${!record && !dirty ? "tw:bg-[var(--bk-ink-muted)]" : missing.length ? "tw:bg-[var(--bk-warning)]" : "tw:bg-[var(--bk-success)]"}`}
            aria-hidden="true"
          />
          {!record && !dirty ? <TriangleAlert size={12} className="tw:flex-none tw:text-[var(--bk-warning-text)]" aria-hidden="true" /> : null}
          <span
            className={`tw:flex-1 tw:text-[13px] tw:leading-5 tw:font-medium ${missing.length ? "tw:text-[var(--bk-warning-text)]" : "tw:text-[var(--bk-success-text)]"}`}
          >
            {!record && !dirty
              ? "Not eligible — not saved yet"
              : missing.length
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
        )}
        <div className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col">
            <span
              className={`tw:text-[12px] tw:leading-[18px] tw:font-medium ${saveError && !blocked ? "tw:text-[var(--bk-error-text)]" : "tw:text-[var(--bk-ink)]"}`}
              role={saveError && !blocked ? "alert" : undefined}
              data-testid="cms-sheet-state"
            >
              {gone
                ? "Your change to it wasn't saved."
                : conflict
                  ? "Your changes are waiting for a conflict choice."
                  : saveError ??
                    (noFields
                      ? "Add a field to this collection before saving a record."
                      : dirty
                        ? "Unsaved changes on this record"
                        : record
                          ? "No unsaved changes on this record"
                          : "New record · nothing saved yet")}
            </span>
            {/* 6749:59940 — a new record says what Save needs and what it does. */}
            {!record && !saveError && !blocked ? (
              <span className="tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="cms-sheet-new-hint">
                {nameMissing ? `Enter a ${nameField?.name ?? "name"} before saving. ` : ""}Save record creates this {singular} with every
                field above. Publishing the site makes it live.
              </span>
            ) : null}
          </span>
          <Button size="xs" variant="secondary" className={SMALL_BTN} data-testid="cms-sheet-cancel" onClick={() => guard(onClose)}>
            Cancel
          </Button>
          <Button size="xs" className={SMALL_BTN} disabled={blocked || noFields || (!dirty && !!record) || (!record && nameMissing) || saving} data-testid="cms-sheet-save" onClick={() => void save()}>
            {saveError && !blocked ? "Retry save" : "Save record"}
          </Button>
        </div>
      </footer>
      </div>
      {previewOpen ? (
        <RecordPreview collection={collection} record={record} form={form} title={title} onDelete={record ? () => void remove() : undefined} />
      ) : null}

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
                if (go) leave(go);
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
            leave(onClose);
            addToast({ tone: "success", title: `${title} deleted · ${collection.name}`, description: "The record and its generated page are gone." });
          }}
          name={title}
          consequence={`Deleting removes this record and its generated page ${applyCmsPattern(collection.pageSlugPattern ?? "", record.data, true)}.`}
          confirmLabel="Delete record"
          testId="cms-delete-record"
        />
      ) : null}
      {templatePreviewOpen && record ? (
        <RecordTemplatePreviewDialog
          composer={composer}
          collection={collection}
          record={record}
          onClose={() => setTemplatePreviewOpen(false)}
          onChooseTemplate={() => {
            setTemplatePreviewOpen(false);
            onOpenTab("dynamic-pages");
          }}
        />
      ) : null}
    </div>
  );
}
