/**
 * RecordSheet — a record's editor, laid wide over the records table
 * (4428:144760; new record 6749:59940; required-missing 5940:148412; save
 * failed 5940:148777; leave guard with Save and leave 165:2184 / F2.08–F2.15;
 * record ⋯ 7103:76270;
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
import { Button, IconButton, Menu, MenuItem, Modal, Popover, ToggleSwitch, useToast } from "@/editor/chrome-ui";
import { fieldDefault } from "@/editor/sidebar/tabs/content/contentPanelUtils";
import { recordTitle } from "./RecordsTable";
import { TypedDeleteDialog } from "./TypedDeleteDialog";
import { RecordPreview } from "./RecordPreview";
import { RecordFieldControl, isEmptyValue, type OpenMediaLibrary } from "./RecordFieldControl";
import { RecordTemplatePreviewDialog } from "./RecordTemplatePreviewDialog";
import { applyCmsPattern, cmsSlugField, cmsSlugify } from "@buildrik/shared/schemas/cms";
import { CMS_TAB_LABEL, cmsWorkspace, type CmsTab, type CmsWorkspaceState } from "./cmsWorkspaceStore";
import { shellDirty } from "@/editor/shell/shellDirtyRegistry";
import { claimCmsConflict, isCmsConflictPending, type CmsConflict } from "@/services/cmsSync";

export interface RecordSheetProps {
  composer: Composer | null;
  collection: CMSCollection;
  /** null → a new record. */
  record: CMSContentItem | null;
  onClose: () => void;
  /** Opened from an element (§13 Open record ›): the way back leads the
   *  sheet's header — it covers the workspace's own. Absent, not drawn. */
  onBackToCanvas?: () => void;
  /** The door's name for that way back ("Heading · Title binding",
   *  173:16169); absent → "Back to canvas". */
  origin?: string | null;
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

const SMALL_BTN = "tw:h-7 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
/* 8139:217692 — the conflict choice: 32 tall, 12 inline, 13/20 medium. */
const CHOICE_BTN = "tw:h-8 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
const NAV_TAB =
  "tw:h-7 tw:min-h-0 tw:rounded-none tw:border-0 tw:border-b-2 tw:border-transparent tw:bg-transparent tw:px-2.5 tw:py-0 tw:text-[13px] " +
  "tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)] tw:shadow-none tw:enabled:hover:bg-transparent tw:enabled:hover:text-[var(--bk-ink)] tw:focus:ring-0";

const OFFLINE = "Saved on this device only. The server is offline — the change will sync when you reconnect.";
const FAILED = "Couldn’t save this record. Your changes are still here — try again.";

/** A way out of a dirty record: where it goes, and how the guard names it.
 *  `to` null → the guard names the record only (165:2184); `origin` → the
 *  destination is an element back in the editor (173:17098). */
interface LeaveIntent {
  go: () => void;
  to: string | null;
  origin?: boolean;
}

const WIDE: ReadonlySet<CMSField["type"]> = new Set(["textarea", "richtext", "image", "file", "multiselect"]);

function blank(fields: CMSField[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.slug, fieldDefault(f)]));
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
  origin = null,
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
  const [leaveTo, setLeaveTo] = React.useState<LeaveIntent | null>(null);
  /* F2.09 — "Save and leave" holds the way out while the save runs; a save
     that does not reach the server pauses it (F2.14); "Stay here" drops it and
     lets the save finish in place (F2.15). The ref is what the save reads when
     it settles, so Stay here during the save is seen. */
  const [returnTo, setReturnTo] = React.useState<LeaveIntent | null>(null);
  const returnRef = React.useRef<LeaveIntent | null>(null);
  const holdReturn = (intent: LeaveIntent | null) => {
    returnRef.current = intent;
    setReturnTo(intent);
  };
  const [returnCancelled, setReturnCancelled] = React.useState(false);
  const stayRef = React.useRef(false);
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
  const missing = collection.fields.filter((f) => f.validation?.required && isEmptyValue(form[f.slug]));
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
  const guard = (go: () => void, to: string | null = null, toOrigin = false) =>
    dirty && !gone ? setLeaveTo({ go, to, origin: toOrigin }) : leave(go);
  /* Where a workspace move lands, in the guard's words (168:21408 · 168:21848 · 168:22290). */
  const destinationOf = (next: CmsWorkspaceState): string | null => {
    if (next.collectionId !== collection.id) {
      return next.collectionId ? (composer?.cms.collections.getCollection(next.collectionId)?.name ?? null) : "CMS";
    }
    return next.recordId === null && next.tab !== "records" ? CMS_TAB_LABEL[next.tab] : null;
  };
  /* UI-02: every other door out of this record — a drawer collection row, ⌘K,
     a table row, a tab — moves the workspace store, which asks here first. */
  const stillDirty = React.useRef(false);
  stillDirty.current = dirty && !gone;
  const destinationRef = React.useRef(destinationOf);
  destinationRef.current = destinationOf;
  React.useEffect(
    () =>
      cmsWorkspace.setLeaveGuard((go, next) => {
        if (leaving$.current || !stillDirty.current) return false;
        setLeaveTo({ go, to: destinationRef.current(next) });
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
    const back = returnRef.current;
    holdReturn(null);
    setReturnCancelled(false);
    /* Stay here (F2.15): the save finished, the record stays open. A new
       record has no row to stay on, so it closes as any save does. */
    if (stayRef.current && record) {
      stayRef.current = false;
      return;
    }
    stayRef.current = false;
    leave(back ? back.go : onClose);
  };
  const stayHere = () => {
    holdReturn(null);
    stayRef.current = true;
    setReturnCancelled(true);
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
        const back = returnRef.current;
        holdReturn(null);
        leave(back ? back.go : onClose);
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
      setSaveError(e instanceof CMSValidationError ? e.message : FAILED);
    } finally {
      setSaving(false);
      setReturnCancelled(false);
      stayRef.current = false;
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
  const nameMissing = Boolean(nameField) && isEmptyValue(form[nameSlug]);
  const canSave = !blocked && !noFields && !(!record && nameMissing);
  /* F2.14 — the save behind "Save and leave" did not land: the edits stay,
     the way out waits for Retry and return. */
  const paused = returnTo !== null && saveError !== null && !saving;
  /* "Return to Heading" (174:14111): an element origin is named by its first
     part, a CMS place in full. */
  const pausedTo = returnTo?.to ? (returnTo.origin ? returnTo.to.split(" · ")[0] : returnTo.to) : null;
  const set = (slug: string, v: unknown) => {
    if (slug === slugKey) setSlugTouched(true);
    setForm((p) => ({
      ...p,
      [slug]: v,
      ...(autoSlug && slugKey && !slugTouched && slug === nameSlug ? { [slugKey]: cmsSlugify(String(v ?? "")) } : {}),
    }));
  };

  const control = (f: CMSField) => (
    <RecordFieldControl
      key={f.id}
      field={f}
      value={form[f.slug]}
      onChange={(v) => set(f.slug, v)}
      composer={composer}
      showRequired={published || saveError !== null}
      placeholder={autoSlug && f.slug === slugKey ? "auto from name" : f.placeholder}
      pickLabel={`${crumb} · ${f.name}`}
      onOpenMediaLibrary={onOpenMediaLibrary}
    />
  );

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
        {returnTo && saving ? (
          /* F2.09 — the way out is underway: it reads as the save, not a link. */
          <span className="tw:flex-none tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]" role="status" data-testid="cms-sheet-returning">
            Saving record…
          </span>
        ) : onBackToCanvas ? (
          <Button
            color="light"
            size="xs"
            className={`${BACK} tw:min-w-0 tw:flex-none tw:truncate`}
            data-testid="cms-sheet-back-to-canvas"
            onClick={() => guard(onBackToCanvas, origin, origin !== null)}
          >
            ‹ {origin ?? "Back to canvas"}
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
      {paused ? (
        <div className="tw:flex tw:flex-none tw:flex-col tw:gap-0.5 tw:rounded-[6px] tw:bg-[var(--bk-error-tint)] tw:px-4 tw:py-2" role="alert" data-testid="cms-sheet-return-paused">
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
            {pausedTo ? `Your edits are still here. Return to ${pausedTo} is paused.` : "Your edits are still here. Leaving is paused."}
          </p>
          {saveError !== FAILED ? <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]">{saveError}</p> : null}
        </div>
      ) : returnCancelled && saving ? (
        <p className="tw:m-0 tw:flex-none tw:px-4 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" role="status" data-testid="cms-sheet-return-cancelled">
          Return cancelled. Your record save is still in progress.
        </p>
      ) : null}

      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-2 tw:overflow-y-auto">
        {/* 165:520 — one way back to the table, "‹ Blog records". */}
        <nav className="tw:flex tw:h-9 tw:flex-none tw:items-center tw:px-4 tw:text-[13px] tw:leading-5" aria-label="Breadcrumb">
          <Button
            size="xs"
            variant="link"
            className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[13px] tw:font-normal"
            data-testid="cms-sheet-crumb"
            onClick={() => guard(onClose)}
          >
            ‹ {collection.name} records
          </Button>
        </nav>
        <div className="tw:flex tw:h-9 tw:flex-none tw:items-center tw:gap-1 tw:px-2" role="tablist" aria-label={`${collection.name} sections`}>
          {(Object.entries(CMS_TAB_LABEL) as [CmsTab, string][]).map(([tab, label]) => (
            <Button
              key={tab}
              role="tab"
              aria-selected={tab === "records"}
              size="xs"
              className={`${NAV_TAB} ${tab === "records" ? "tw:border-[var(--bk-accent)] tw:text-[var(--bk-ink)]" : ""}`}
              data-testid={`cms-sheet-tab-${tab}`}
              onClick={() => (tab === "records" ? guard(onClose) : guard(() => onOpenTab(tab), label))}
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
              role={saveError && !blocked && !paused ? "alert" : undefined}
              data-testid="cms-sheet-state"
            >
              {gone
                ? "Your change to it wasn't saved."
                : conflict
                  ? "Your changes are waiting for a conflict choice."
                  : saving
                    ? "Saving…"
                  : paused
                    ? "Couldn’t save · return paused"
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
          {returnTo && saving ? (
            <Button size="xs" variant="secondary" className={SMALL_BTN} data-testid="cms-sheet-stay" onClick={stayHere}>
              Stay here
            </Button>
          ) : paused ? (
            <Button size="xs" variant="secondary" className={SMALL_BTN} data-testid="cms-sheet-cancel-return" onClick={() => holdReturn(null)}>
              Cancel
            </Button>
          ) : (
            <Button size="xs" variant="secondary" className={SMALL_BTN} data-testid="cms-sheet-cancel" disabled={saving} onClick={() => guard(onClose)}>
              Cancel
            </Button>
          )}
          <Button size="xs" className={SMALL_BTN} disabled={!canSave || (!dirty && !!record) || saving} data-testid="cms-sheet-save" onClick={() => void save()}>
            {saving ? "Saving…" : paused ? "Retry and return" : saveError && !blocked ? "Retry save" : "Save record"}
          </Button>
        </div>
      </footer>
      </div>
      {previewOpen ? (
        <RecordPreview collection={collection} record={record} form={form} title={title} onDelete={record ? () => void remove() : undefined} />
      ) : null}

      {/* 165:2184 · 168:21408 · 173:17098 — "Keep editing" takes focus, and
          Escape / the scrim give the same answer; "Save and leave" saves, then
          takes the way out the person chose. */}
      <Modal
        open={leaveTo !== null}
        onClose={() => setLeaveTo(null)}
        title="Leave without saving?"
        kind="form"
        testId="cms-discard"
        footer={
          <>
            <Button ref={keepRef} variant="ghost" onClick={() => setLeaveTo(null)} data-testid="cms-discard-keep">
              Keep editing
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const intent = leaveTo;
                setLeaveTo(null);
                if (intent) leave(intent.go);
              }}
              data-testid="cms-discard-confirm"
            >
              Discard changes
            </Button>
            <Button
              disabled={!canSave}
              onClick={() => {
                const intent = leaveTo;
                setLeaveTo(null);
                if (!intent) return;
                holdReturn(intent);
                void save();
              }}
              data-testid="cms-discard-save"
            >
              Save and leave
            </Button>
          </>
        }
      >
        <p className="tw:m-0" data-testid="cms-discard-body">
          {leaveTo?.origin && leaveTo.to
            ? `Your destination is ${leaveTo.to}.`
            : leaveTo?.to
              ? `Save or discard the edits to “${crumb}” before opening ${leaveTo.to}.`
              : `${crumb} has unsaved record edits.`}
        </p>
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
