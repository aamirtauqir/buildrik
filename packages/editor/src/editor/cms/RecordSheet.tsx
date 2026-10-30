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
import { MoreHorizontal, TriangleAlert } from "lucide-react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import { Button, IconButton, Menu, MenuItem, Modal, Popover, ToggleSwitch, useToast } from "@/editor/chrome-ui";
import { fieldDefault } from "@/editor/sidebar/tabs/content/contentPanelUtils";
import { recordStatusBadge, recordTitle } from "./RecordsTable";
import { TypedDeleteDialog } from "./TypedDeleteDialog";
import { RecordPreview } from "./RecordPreview";
import { RecordLeaveDialog, type RecordLeavePhase } from "./RecordLeaveDialog";
import { RecordSheetFooter } from "./RecordSheetFooter";
import { useQueuedSaveLock } from "./useQueuedSaveLock";
import { RecordFieldControl, isEmptyValue, type OpenMediaLibrary } from "./RecordFieldControl";
import { RecordTemplatePreviewDialog } from "./RecordTemplatePreviewDialog";
import { ConflictReviewDialog } from "./ConflictReviewDialog";
import { applyCmsPattern, cmsSlugField, cmsSlugify } from "@buildrik/shared/schemas/cms";
import { CMS_TAB_LABEL, cmsWorkspace, type CmsExitPage, type CmsTab, type CmsWorkspaceState } from "./cmsWorkspaceStore";
import { shellDirty } from "@/editor/shell/shellDirtyRegistry";
import { claimCmsConflict, isCmsConflictPending, type CmsConflict } from "@/services/cmsSync";

export interface RecordSheetProps {
  composer: Composer | null;
  collection: CMSCollection;
  /** null → a new record. */
  record: CMSContentItem | null;
  onClose: () => void;
  /** The door's name for the workspace's way back ("Heading · Title
   *  binding", 173:16169) — what the leave guard names as the destination. */
  origin?: string | null;
  /** "Choose a template page" from the saved-record preview. */
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


/* 165:1625 — the queued mirror: the change is on this device, not the server. */
const OFFLINE = "Your edits are not saved to the server. Keep this tab open.";
const FAILED = "Couldn’t save this record. Your changes are still here — try again.";

/** A way out of a dirty record: where it goes, and how the guard names it.
 *  `to` null → the guard names the record only (165:2184); `origin` → the
 *  destination is an element back in the editor (173:17098). */
interface LeaveIntent {
  go: () => void;
  to: string | null;
  origin?: boolean;
  /** A page picked in the Pages drawer over the workspace (122:44151). */
  page?: CmsExitPage;
}

function blank(fields: CMSField[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.slug, fieldDefault(f)]));
}

export function RecordSheet({
  composer,
  collection,
  record,
  onClose,
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
  const [typedDelete, setTypedDelete] = React.useState(false);
  const [templatePreviewOpen, setTemplatePreviewOpen] = React.useState(false);

  const lastRecordId = React.useRef<string | null>(record?.id ?? "new");
  /* 165:2414: "your changed fields" are measured from the record as opened. */
  const openedWith = React.useRef<Record<string, unknown>>(initial);
  React.useEffect(() => {
    /* Reset the form when the row being edited changes (or a new sheet opens);
       the saveError resets too — the new sheet has nothing to recover from.
       Re-renders that come back with the same record id (engine reload after
       `saveRecord` builds a new `record` object with the same id) must NOT
       wipe a queued-mirror message the user is still looking at. */
    const currentId = record?.id ?? "new";
    if (currentId === lastRecordId.current) return;
    lastRecordId.current = currentId;
    openedWith.current = initial;
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
  /* 126:36751: a page removed while the leave waited opens nothing — the
     record and its draft stay, and the dialog says so. */
  const [removedTo, setRemovedTo] = React.useState<string | null>(null);
  /* 128:39584 — after "no longer available", the record says the draft stayed. */
  const [removedNote, setRemovedNote] = React.useState<string | null>(null);
  /* 125:35023 / 125:36161: a page leave that waits for the record to become
     savable — "After saving: Open About" — until Save and leave or Cancel
     navigation clears it. Real intent: returnTo holds the page. */
  const [pending, setPending] = React.useState(false);
  /* 122:43331 — Form / Preview. Preview renders the record from these fields. */
  const [view, setView] = React.useState<"form" | "preview">("form");
  const goTo = (intent: LeaveIntent) => {
    if (intent.page && !intent.page.exists()) {
      setRemovedTo(intent.page.name);
      return;
    }
    leave(intent.go);
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
  /* The workspace header's "‹ {origin}" leaves the CMS: the same question,
     naming the element it goes back to (173:17098). */
  const originRef = React.useRef(origin);
  originRef.current = origin;
  React.useEffect(
    () =>
      cmsWorkspace.setExitGuard((go, page) => {
        if (leaving$.current || !stillDirty.current) return false;
        setLeaveTo(page ? { go, to: page.name, page } : { go, to: originRef.current, origin: originRef.current !== null });
        return true;
      }),
    [],
  );

  /* 8139:217560 — a save the server refused because another device changed
     the record waits here for Keep mine / Use theirs, not in the shell's
     toast. Closing the sheet with the choice still open hands it back to the
     toast (claimCmsConflict's release). */
  const [conflict, setConflict] = React.useState<CmsConflict | null>(null);
  const [reviewing, setReviewing] = React.useState(false);
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
    setReviewing(false);
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
    if (back) goTo(back);
    else leave(onClose);
  };
  const stayHere = () => {
    holdReturn(null);
    stayRef.current = true;
    setReturnCancelled(true);
  };
  /* 126:35760 — a queued save holds the record until the queue answers it. */
  const queued = useQueuedSaveLock(record?.id ?? null, (how) => {
    if (how === "conflict") return;
    setSaveError(null);
    stayRef.current = true;
    closeSaved();
  });

  /* Keep mine re-sends this device's copy; it can conflict again (the claim
     then holds the new choice), land, or queue. Use theirs replaces this
     device's copy with the server's, so the sheet's edits are gone with it. */
  const choose = async (choice: "keepMine" | "useTheirs", merged?: Record<string, unknown>) => {
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
      const landed = await c.keepMine(merged);
      if (isCmsConflictPending("entry", c.id)) return;
      settleConflict();
      if (landed) closeSaved();
      else setSaveError(OFFLINE);
    } finally {
      setResolving(false);
    }
  };

  const save = async () => {
    setPending(false);
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
  /* 128:39389: a published record missing a required field cannot be saved —
     said before the save, not after a refusal. */
  const requiredBlock = published && missing.length > 0;
  /* F2.14 — the save behind "Save and leave" did not land: the edits stay,
     the way out waits for Retry and return. */
  const paused = returnTo !== null && saveError !== null && !saving;
  /* "Return to Heading" (174:14111): an element origin is named by its first
     part, a CMS place in full. */
  const pausedTo = returnTo?.to ? (returnTo.origin ? returnTo.to.split(" · ")[0] : returnTo.to) : null;
  /* The page leave follows the real save (RecordLeaveDialog). */
  const leavePhase: RecordLeavePhase | null = removedTo
    ? "removed"
    : pending
      ? null
    : leaveTo?.page
      ? "ask"
      : returnTo?.page && saving
        ? "saving"
        : returnTo?.page && paused
          ? saveError === OFFLINE ? "queued" : saveError === FAILED ? "failed" : "refused"
          : null;
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

  const statusBadge = record ? recordStatusBadge(record) : null;
  /* F2.09 — a way back to an element reads as the save while it runs. */
  const returning = saving && origin !== null && !returnTo?.page; // 173:16635 / 174:13882 — a save from an element-opened record
  React.useEffect(() => {
    cmsWorkspace.setReturning(returning);
    return () => cmsWorkspace.setReturning(false);
  }, [returning]);

  return (
    /* 2L9 165:520 — the record fills the workspace under its tabs: a back +
       title row, the form on the left with the always-on Preview (unsaved)
       column beside it, and the footer across both. */
    <div
      className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:bg-[var(--bk-bg-panel)]"
      role="region"
      aria-label={`Record · ${crumb}`}
      data-testid="cms-sheet"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !menuOpen) {
          e.stopPropagation();
          guard(onClose);
        }
      }}
    >
      {/* design-2l9 122:43331 — "Blog › Studio launch", then the Form /
          Preview switch; the record menu keeps the far end. */}
      <div className="tw:flex tw:h-12 tw:flex-none tw:items-center tw:gap-3 tw:pl-6 tw:pr-6">
        <h3 className="tw:m-0 tw:min-w-0 tw:truncate tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="cms-sheet-title">
          {`${collection.name} › ${title}`}
        </h3>
        {statusBadge && statusBadge.tone === "warning" ? (
          <span className="tw:flex-none tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]" data-testid="cms-sheet-status">
            {statusBadge.label}
          </span>
        ) : null}
        <span className="tw:flex-1 tw:max-w-[392px]" />
        <div className="tw:flex tw:flex-none tw:items-center tw:gap-1" role="group" aria-label="Record view">
          {(["form", "preview"] as const).map((v) => (
            <Button
              key={v}
              size="xs"
              variant={view === v ? "secondary" : "ghost"}
              aria-pressed={view === v}
              className="tw:h-8 tw:min-h-0 tw:px-4 tw:text-[13px] tw:font-normal"
              data-testid={`cms-sheet-view-${v}`}
              onClick={() => setView(v)}
            >
              {v === "form" ? "Form" : "Preview"}
            </Button>
          ))}
        </div>
        <span className="tw:flex-1" />
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
      </div>

      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:gap-12 tw:overflow-hidden tw:pl-6 tw:pr-6">
        {view === "preview" ? (
          /* 122:43331 Preview: the record as these fields render it. */
          <RecordPreview
            dirty={dirty}
            collection={collection}
            form={form}
            title={title}
            onPreviewSaved={record ? () => setTemplatePreviewOpen(true) : undefined}
          />
        ) : (
        <div className="tw:flex tw:min-h-0 tw:min-w-0 tw:max-w-[500px] tw:flex-1 tw:flex-col tw:gap-4 tw:overflow-y-auto tw:pb-4 tw:pt-4">
          <span
            className={`tw:flex-none tw:text-[12px] tw:leading-[18px] ${
              saveError && !blocked && saveError !== OFFLINE
                ? "tw:text-[var(--bk-error-text)]"
                : dirty && !saving && !queued.locked
                  ? "tw:text-[var(--bk-warning-text)]"
                  : "tw:text-[var(--bk-ink-soft)]"
            }`}
            role={saveError && !blocked && !paused && saveError !== FAILED && saveError !== OFFLINE ? "alert" : undefined}
            data-testid="cms-sheet-state"
          >
            {"Record · "}
            {gone
              ? "Your change to it wasn't saved."
              : conflict
                ? "Your changes are waiting for a conflict choice."
                : saving
                  ? "Saving…"
                  : paused
                    ? "Couldn’t save · return paused"
                    : saveError === FAILED
                      ? /* 126:35945 — "Record · Couldn’t save — Retry". */
                        "Couldn’t save — Retry"
                      : saveError === OFFLINE
                        ? "Offline, save pending"
                        : saveError ??
                          (noFields
                            ? "Add a field to this collection before saving a record."
                            : dirty
                              ? "Unsaved changes"
                              : record
                                ? /* 173:16169 */ "Saved"
                                : "New record · nothing saved yet")}
          </span>

          {paused ? (
            <div className="tw:flex tw:flex-none tw:flex-col tw:gap-0.5 tw:rounded-[6px] tw:bg-[var(--bk-warning-tint)] tw:px-4 tw:py-2" role="alert" data-testid="cms-sheet-return-paused">
              <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-warning-text)]">
                {pausedTo ? `Your edits are still here. Return to ${pausedTo} is paused.` : "Your edits are still here. Leaving is paused."}
              </p>
              {saveError !== FAILED ? <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]">{saveError}</p> : null}
            </div>
          ) : (saveError === FAILED || saveError === OFFLINE) && !blocked && !saving && !queued.locked ? (
            /* 165:1072 (failed) · 165:1625 (offline): the banner sits over the
               fields and says what happened to the edits. */
            <div
              className="tw:flex tw:flex-none tw:flex-col tw:gap-1 tw:rounded-[6px] tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-3"
              role="alert"
              data-testid="cms-sheet-save-banner"
            >
              <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:font-semibold tw:text-[var(--bk-warning-text)]">
                {saveError === OFFLINE ? "You’re offline" : "Couldn’t save"}
              </p>
              <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text)]">
                {saveError === OFFLINE ? OFFLINE : "Your edits are still here. Retry when you’re ready."}
              </p>
            </div>
          ) : returnCancelled && saving ? (
            /* 126:37330 (a page leave) · 177:16850 (a return to the element): called off; the save runs on. */
            <p className={`tw:m-0 tw:flex-none tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] ${origin !== null ? "tw:rounded-[4px] tw:bg-[var(--bk-gray-100)] tw:px-3 tw:py-2" : ""}`} role="status" data-testid="cms-sheet-return-cancelled">
              {origin !== null ? "Return cancelled. Your record save is still in progress." : "Record · Saving continues; stay here"}
            </p>
          ) : null}

          {conflict && !gone ? (
            /* 165:1903 — "Changed elsewhere" over the fields; Review opens the
               per-field review (165:2414, ConflictReviewDialog). */
            <div className="tw:flex tw:flex-none tw:items-start tw:gap-3 tw:rounded-[6px] tw:bg-[var(--bk-warning-tint)] tw:px-3 tw:py-3" role="alert" data-testid="cms-sheet-conflict">
              <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-1">
                <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:font-semibold tw:text-[var(--bk-warning-text)]">Changed elsewhere</p>
                <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text)]">
                  Review the fields that changed before saving.
                </p>
              </div>
              <Button size="xs" variant="secondary" className="tw:h-8 tw:px-4 tw:text-[13px] tw:font-medium" onClick={() => setReviewing(true)} data-testid="cms-sheet-conflict-review">
                Review
              </Button>
              <ConflictReviewDialog
                open={reviewing}
                conflict={conflict}
                fields={collection.fields}
                base={openedWith.current}
                resolving={resolving}
                onCancel={() => setReviewing(false)}
                onKeepMine={(merged) => void choose("keepMine", merged)}
                onUseTheirs={() => void choose("useTheirs")}
              />
            </div>
          ) : null}

          {/* 126:37330 / 126:35760: a submitted save owns the fields until it settles. */}
          <fieldset disabled={(returnCancelled && saving) || queued.locked} className="tw:m-0 tw:flex tw:min-w-0 tw:flex-col tw:gap-4 tw:border-0 tw:p-0">
            {[...collection.fields].sort((a, b) => a.order - b.order).map(control)}
          </fieldset>

          {/* The publishing switch closes the form (165:2184's "Published —
              included in the next site publish · Eligible for publishing"). */}
          {blocked ? (
            <div className="tw:flex tw:h-10 tw:flex-none tw:items-center tw:gap-2" data-testid="cms-sheet-eligibility">
              <span className={`tw:size-1.5 tw:rounded-full ${gone ? "tw:bg-[var(--bk-gray-500)]" : "tw:bg-[var(--bk-warning)]"}`} aria-hidden="true" />
              <span className="tw:flex-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-gray-500)]">
                {gone ? "This item is no longer available" : "Resolve the conflict before publishing"}
              </span>
            </div>
          ) : (
            <div className="tw:flex tw:flex-none tw:flex-col tw:gap-1" data-testid="cms-sheet-eligibility">
              <ToggleSwitch checked={published} disabled={queued.locked} label="Published — included in the next site publish" sizing="sm" data-testid="cms-sheet-published" onChange={setPublished} />
              <span className={`tw:flex tw:items-center tw:gap-1.5 tw:text-[12px] tw:leading-[18px] ${missing.length ? "tw:text-[var(--bk-warning-text)]" : "tw:text-[var(--bk-ink-soft)]"}`}>
                {!record && !dirty ? <TriangleAlert size={12} className="tw:flex-none" aria-hidden="true" /> : null}
                {!record && !dirty
                  ? "Not eligible — not saved yet"
                  : missing.length
                    ? `Not eligible for publishing — ${missing.map((f) => f.name).join(", ")} ${missing.length === 1 ? "is" : "are"} required`
                    : "Eligible for publishing"}
              </span>
            </div>
          )}
          {removedNote ? (
            <p className="tw:m-0 tw:flex-none tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-warning-text)]" data-testid="cms-sheet-removed-note">
              {`${removedNote} was removed. Your ${title} draft is retained.`}
            </p>
          ) : null}
        </div>
        )}
      </div>

      <RecordSheetFooter
        pendingPage={pending && returnTo?.page && !saving ? returnTo.page.name : null}
        onCancelNavigation={() => {
          setPending(false);
          holdReturn(null);
        }}
        saveDisabled={!canSave || requiredBlock || (!dirty && !!record) || saving || queued.locked}
        saveLeaveDisabled={requiredBlock || !canSave}
        saveLabel={saving ? "Saving…" : queued.locked ? "Save pending" : paused ? "Retry and return" : saveError && saveError !== OFFLINE && !blocked ? "Retry save" : "Save record"}
        onSave={() => void save()}
        cancel={returnTo && saving ? (returnTo.origin ? "stay-here" : "stay") : queued.locked || (returnCancelled && saving && origin === null) ? "unavailable" : saving && origin !== null ? "saving" : paused ? "drop-return" : "close"}
        onStay={stayHere}
        onDropReturn={() => holdReturn(null)}
        onClose={() => guard(onClose)}
        requiredNote={requiredBlock && !saving ? `Enter a ${missing[0].name.toLowerCase()} before saving.` : null}
        newHint={
          !record && !saveError && !blocked
            ? `${nameMissing ? `Enter a ${nameField?.name ?? "name"} before saving. ` : ""}Save record creates this ${singular} with every field above. Publishing the site makes it live.`
            : null
        }
      />

      {/* 165:2184 · 168:21408 · 173:17098 — "Keep editing" takes focus, and
          Escape / the scrim give the same answer; "Save and leave" saves, then
          takes the way out the person chose. */}
      <Modal
        open={leaveTo !== null && !leaveTo.page}
        onClose={() => setLeaveTo(null)}
        title="Leave without saving?"
        kind="form"
        /* 165:2184 — a 480 dialog; the safe answer is the filled one. */
        width="sm"
        testId="cms-discard"
        footer={
          <>
            <Button ref={keepRef} variant="primary" onClick={() => setLeaveTo(null)} data-testid="cms-discard-keep">
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
              variant="secondary"
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
      <RecordLeaveDialog
        phase={leavePhase}
        recordLabel={`${collection.name} record “${crumb}”`}
        collectionName={collection.name}
        to={removedTo ?? leaveTo?.page?.name ?? returnTo?.page?.name ?? ""}
        current={composer?.elements.getActivePage?.()?.name ?? null}
        toIsCurrent={!removedTo && Boolean(leaveTo?.page?.isCurrent)}
        reason={leavePhase === "refused" ? saveError : null}
        canSave={canSave}
        keepRef={keepRef}
        onKeepEditing={() => {
          if (removedTo) {
            setRemovedNote(removedTo);
            setRemovedTo(null);
          } else if (leaveTo) setLeaveTo(null);
          else if (saving) stayHere();
          /* A refusal keeps the page pending while the record is fixed. */
          else if (leavePhase === "refused") setPending(true);
          else {
            if (leavePhase === "queued") queued.lock();
            holdReturn(null);
          }
        }}
        onDiscard={() => {
          const intent = leaveTo;
          setLeaveTo(null);
          if (intent) goTo(intent);
        }}
        onSaveAndLeave={() => {
          const intent = leaveTo;
          setLeaveTo(null);
          if (!intent) return;
          holdReturn(intent);
          if (requiredBlock) setPending(true);
          else void save();
        }}
        onRetry={() => void save()}
      />
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
