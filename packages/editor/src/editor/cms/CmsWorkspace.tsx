/**
 * CmsWorkspace — the CMS view that replaces the canvas + inspector while the
 * rail's CMS is open (v3 IA; boards 4428:140486 root, 4428:143182 records
 * table, 4428:148905 empty collection).
 *
 * The CMS drawer stays on the left and chooses the collection
 * (`cmsWorkspaceStore`); this pane shows it: a 56 header (name · count ·
 * primary action), a 40 tab row (Records · Fields · ⋯), then the tab's body.
 * States that have nothing to show full-width keep a right column in the
 * inspector's slot with a one-line hint, as the boards draw it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { MoreHorizontal, Table2 } from "lucide-react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { Button, IconButton, Menu, MenuItem, MenuSeparator, Popover, Tabs, useToast } from "@/editor/chrome-ui";
import { useContentPanel } from "@/editor/sidebar/tabs/content/useContentPanel";
import { DynamicPagesPane } from "./DynamicPagesPane";
import { CollectionSettingsPane } from "./CollectionSettingsPane";
import { FieldsTable } from "./FieldsTable";
import { FieldInspector } from "./FieldInspector";
import { fieldUsage } from "./fieldUsage";
import { AddFieldDialog } from "./AddFieldDialog";
import { CMS_TAB_LABEL, cmsWorkspace, useCmsWorkspace, type CmsTab } from "./cmsWorkspaceStore";
import { RecordsTable, recordTitle } from "./RecordsTable";
import { RecordSheet } from "./RecordSheet";
import type { OpenMediaLibrary } from "./RecordFieldControl";
import { ImportRecordsButton, useImportRecords } from "./useImportRecords";
import { CsvImportDialog } from "./CsvImportDialog";
import { onCmsGone } from "@/services/cmsSync";
import type { CMSCollection, CMSContentItem, CMSField, CMSFieldType } from "@/shared/types/cms";
import type { TypeChangeMode } from "./TypeChangeDialog";
import { planConversion } from "./fieldConversion";
import { FIELD_TYPE_LABEL } from "./fieldTypes";
import { isEmptyCmsValue } from "@buildrik/shared/schemas/cms";

export interface CmsWorkspaceProps {
  composer: Composer | null;
  /** The B13 New collection modal (shell-owned). */
  onCreateCollection?: () => void;
  /** The Assets pick mode, for a record's image field (G3-081). */
  onOpenMediaLibrary?: OpenMediaLibrary;
  /** §13: the workspace was opened from an element (the inspector's Open
   *  record › / Open collection ›); the shell gives that element back. */
  onBackToCanvas?: () => void;
}

/* 2L9 165:2 — a 56 header on the page's 24 gutter: way back, "Blog · N
   records", the tab's primary action and the collection ⋯. */
const HEADER = "tw:flex tw:h-14 tw:flex-none tw:items-center tw:gap-6 tw:pl-6 tw:pr-4 tw:bg-[var(--bk-bg-panel)]";
const TITLE = "tw:m-0 tw:text-[14px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)] tw:whitespace-nowrap";
const META = "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-gray-500)] tw:whitespace-nowrap";
/* 4428:143466 — 28 tall, 12 inline, 13/20 medium. Same-property utilities so
   they displace flowbite's xs size. */
const PRIMARY = "tw:h-8 tw:min-w-[148px] tw:px-4 tw:py-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
/* 165:2 — the four tabs are the shared tinted pills, 24 in, a 48 band. */
const TAB_ROW = "tw:flex tw:h-12 tw:flex-none tw:items-center tw:pl-6 tw:pr-6 tw:bg-[var(--bk-bg-panel)]";
const TAB = "tw:h-8 tw:min-w-[96px] tw:px-4 tw:font-medium";

/* 165:2 — all four of a collection's tabs are named in the row. */
const TABS = (Object.entries(CMS_TAB_LABEL) as [CmsTab, string][]).map(([id, label]) => ({ id, label }));

/** The inspector-slot hint column (4428:140486 "Select a collection"). */
function HintColumn({ title, hint, testId }: { title: string; hint: string; testId: string }) {
  return (
    <aside
      className="tw:flex tw:w-[var(--bk-size-inspector)] tw:flex-none tw:flex-col tw:items-center tw:justify-center tw:gap-1 tw:border-l tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-6 tw:text-center"
      data-testid={testId}
    >
      <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">{title}</p>
      <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">{hint}</p>
    </aside>
  );
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function CmsWorkspace({ composer, onCreateCollection, onOpenMediaLibrary, onBackToCanvas }: CmsWorkspaceProps) {
  const panel = useContentPanel(composer);
  const { addToast } = useToast();
  const ws = useCmsWorkspace();
  /* 8139:217711 / 8139:217890 — an edit the server refused because another
     device deleted the record (or its collection) drops the row here too.
     The open sheet stays over what it showed, to say the change wasn't
     saved, until it is closed; the workspace behind keeps that snapshot. */
  const [gone, setGone] = React.useState<{ collection: CMSCollection; record: CMSContentItem } | null>(null);
  const shown = React.useRef<{ collection: CMSCollection; record: CMSContentItem } | null>(null);
  React.useEffect(
    () =>
      onCmsGone((g) => {
        const s = shown.current;
        if (!s) return;
        if (g.kind === "entry" ? g.id === s.record.id : g.id === s.collection.id) setGone(s);
      }),
    [],
  );
  const live = ws.collectionId ? panel.collections.find((c) => c.id === ws.collectionId) ?? null : null;
  const collection = gone && gone.collection.id === ws.collectionId ? live ?? gone.collection : live;
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [csvImportOpen, setCsvImportOpen] = React.useState(false);
  const [addingField, setAddingField] = React.useState(false);
  const [fieldId, setFieldId] = React.useState<string | null>(null);
  const { loadRecords } = panel;
  /* CMS-01: the record a "new" sheet's first save created. A later save from
     the same sheet (Retry after a queued or refused write) updates it — the
     sheet still reads "new", and saving it as new again made a second,
     third… record. Cleared whenever the sheet changes. */
  const created = React.useRef<string | null>(null);
  React.useEffect(() => {
    created.current = null;
  }, [ws.recordId]);

  React.useEffect(() => {
    if (collection) void loadRecords(collection.id);
  }, [collection?.id, loadRecords]); // eslint-disable-line react-hooks/exhaustive-deps

  /* A visit's way back ends with the visit (F2.06 origin). */
  React.useEffect(() => cmsWorkspace.holdVisit(), []);

  /* 4428:140486 — while the workspace covers the canvas the topbar crumb
     reads "<site> › CMS", not the page behind it. */
  React.useEffect(() => {
    if (!composer) return;
    composer.emit(EVENTS.UI_CRUMB_CONTEXT, { label: "CMS" });
    return () => {
      composer.emit(EVENTS.UI_CRUMB_CONTEXT, null);
    };
  }, [composer]);

  /* Reference cells name their record (UI-05): the referenced collections'
     records, read once per collection and on any store change. */
  const [referenceLabels, setReferenceLabels] = React.useState<Map<string, Map<string, string>>>(new Map());
  const refFields = collection?.fields.filter((f) => f.type === "reference" && f.referenceCollection) ?? [];
  const refKey = refFields.map((f) => `${f.slug}:${f.referenceCollection}`).join("|");
  React.useEffect(() => {
    let live = true;
    if (!composer || !refKey) {
      setReferenceLabels(new Map());
      return;
    }
    void Promise.all(
      refFields.map(async (f) => {
        const target = composer.cms.collections.getCollection(f.referenceCollection!);
        const rows = target ? await composer.cms.collections.getContentItems(target.id) : [];
        return [f.slug, new Map(rows.map((r) => [r.id, recordTitle(target!, r)]))] as const;
      }),
    ).then((entries) => live && setReferenceLabels(new Map(entries)));
    return () => {
      live = false;
    };
  }, [composer, refKey, panel.recordCounts]); // eslint-disable-line react-hooks/exhaustive-deps

  const importer = useImportRecords(composer, collection);
  /* 165:2 "‹ Back to Editor · Home" / 173:16169 "‹ Heading · Title
     binding" — through the open record's guard (cmsWorkspace.exit). */
  /* 165:2 / 173:16169 — the way back sits 66 in; the title starts at 273
     whether or not there is one. */
  const back = ws.returning ? (
    <span
      className="tw:ml-[42px] tw:w-[183px] tw:flex-none tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]"
      role="status"
      data-testid="cms-sheet-returning"
    >
      Saving record…
    </span>
  ) : onBackToCanvas ? (
    <Button
      size="xs"
      variant="link"
      className="tw:ml-[42px] tw:h-auto tw:min-h-0 tw:w-[183px] tw:flex-none tw:justify-start tw:truncate tw:p-0 tw:text-[13px] tw:font-normal"
      data-testid="cms-ws-back-to-canvas"
      onClick={() =>
        cmsWorkspace.exit(() => {
          cmsWorkspace.openRecord(null);
          onBackToCanvas();
        })
      }
    >
      ‹ {ws.origin ?? "Back to canvas"}
    </Button>
  ) : null;

  if (!collection) {
    const records = Object.values(panel.recordCounts).reduce((a, b) => a + b, 0);
    const siteName = composer?.getProjectMetadata?.()?.name || "Untitled site";
    return (
      /* data-bk-full-page: this view covers the canvas column, so toasts take the window corner (8139:217711). */
      <div className="tw:flex tw:h-full tw:min-h-0" data-testid="cms-workspace" data-bk-full-page="">
        <section className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:bg-[var(--bk-bg-subtle)]">
          <header className={HEADER} data-testid="cms-ws-header">
            {back}
            <h2 className={TITLE}>CMS · {siteName}</h2>
            <span className={META} data-testid="cms-ws-meta">
              {plural(panel.collections.length, "collection")} · {plural(records, "record")}
            </span>
            <span className="tw:flex-1" />
            {onCreateCollection ? (
              <Button size="xs" className={PRIMARY} data-testid="cms-ws-new-collection" onClick={onCreateCollection}>
                + New collection
              </Button>
            ) : null}
          </header>
        </section>
        {/* 6881:79324 — with no collections the invitation takes the hint
            column; the pane stays empty. */}
        {panel.collections.length === 0 ? (
          <HintColumn title="Create your first collection" hint="It opens here once created." testId="cms-ws-empty" />
        ) : (
          <HintColumn title="Select a collection" hint="Open a collection to see its details here." testId="cms-ws-hint" />
        )}
      </div>
    );
  }

  const count = panel.records.length;
  const goneRecord = gone && gone.record.id === ws.recordId ? gone.record : null;
  const sheetRecord =
    ws.recordId && ws.recordId !== "new" ? panel.records.find((r) => r.id === ws.recordId) ?? goneRecord : null;
  shown.current = sheetRecord ? { collection, record: sheetRecord } : null;
  const isEmpty = ws.tab === "records" && count === 0;
  const primary =
    ws.tab === "records" ? (
      <Button
        size="xs"
        className={PRIMARY}
        data-testid="cms-ws-add-record"
        disabled={collection.fields.length === 0}
        onClick={() => cmsWorkspace.openRecord("new")}
      >
        + Add record
      </Button>
    ) : ws.tab === "fields" ? (
      <Button size="xs" className={PRIMARY} data-testid="cms-ws-add-field" onClick={() => setAddingField(true)}>
        + Add field
      </Button>
    ) : null;

  const usage = fieldUsage(composer, collection);
  const selectedField = ws.tab === "fields" ? collection.fields.find((f) => f.id === fieldId) ?? null : null;
  const deleteField = async (id: string) => {
    const field = collection.fields.find((f) => f.id === id);
    /* The dialog shows "Deleting {field}…" until this lands (257:53280);
       a throw leaves it open with Retry. */
    await panel.deleteField(collection.id, id);
    setFieldId(null);
    if (field) addToast({ tone: "success", title: "Field deleted", description: `${field.name} has been removed from ${collection.name}.` });
  };
  /* 257:53846 / 259:95932 — a default for a field becoming Required: saved on
     the field, written into each published record that has no value, then
     Required goes on. Existing values are kept. */
  const fillDefault = async (field: CMSField, value: unknown): Promise<number> => {
    if (!composer) return 0;
    const empty = panel.records.filter((r) => r.status === "published" && isEmptyCmsValue(r.data[field.slug]));
    await composer.cms.collections.updateField(collection.id, field.id, { defaultValue: value });
    for (const r of empty) {
      await panel.saveRecord(collection.id, r.id, { ...r.data, [field.slug]: value }, true);
    }
    await composer.cms.collections.updateField(collection.id, field.id, {
      defaultValue: value,
      validation: { ...field.validation, required: true },
    });
    await loadRecords(collection.id);
    addToast({
      tone: "success",
      title: `${field.name} is required`,
      description: `Default saved to ${empty.length} previously empty published record${empty.length === 1 ? "" : "s"}. Existing values were kept.`,
    });
    return empty.length;
  };
  /* 257:51318 / 257:52278 / 259:95573 — the type moves first (so a
     published record's save is checked against it), then each stored value
     is written converted, or cleared. A refused write rejects; the dialog
     offers Retry, which plans again from what is stored now. */
  const changeType = async (field: CMSField, to: CMSFieldType, mode: TypeChangeMode): Promise<void> => {
    if (!composer) return;
    const plan = planConversion(field, panel.records, to);
    if (field.type !== to) await composer.cms.collections.updateField(collection.id, field.id, { type: to });
    const writes: Array<[CMSContentItem, unknown]> =
      mode === "convert" ? plan.converts.map((c) => [c.record, c.value]) : plan.touched.map((r) => [r, undefined]);
    for (const [record, value] of writes) {
      const data = { ...record.data };
      if (value === undefined) delete data[field.slug];
      else data[field.slug] = value;
      const result = await panel.saveRecord(collection.id, record.id, data, record.status === "published");
      if (result.invalid || result.conflict) throw new Error(result.invalid ?? "conflict");
    }
    await loadRecords(collection.id);
    const n = writes.length;
    addToast({
      tone: "success",
      title: mode === "convert" ? `${field.name} converted` : `${n} value${n === 1 ? "" : "s"} cleared`,
      description: mode === "convert" ? `${n} value${n === 1 ? "" : "s"} converted and saved.` : `${field.name} is now ${FIELD_TYPE_LABEL[to]}.`,
    });
  };
  /* "Open the binding" — select the bound element and go back to the canvas. */
  const openUse = (elementId: string) => {
    const el = composer?.elements.getElement(elementId);
    if (!composer || !el) return;
    composer.selection.select(el);
    composer.emit("ui:switch-tab", { tab: "layers" });
  };

  let body: React.ReactNode;
  if (ws.tab === "records" && isEmpty && collection.fields.length === 0) {
    /* UI-08 (§7 "Empty: no fields"): a record of a collection with no fields
       is an empty record — the way in is a field first. */
    body = (
      <div className="tw:flex tw:flex-col tw:items-center tw:pt-[132px] tw:text-center" data-testid="cms-ws-no-fields">
        <Table2 size={20} className="tw:text-[var(--bk-ink-soft)]" aria-hidden="true" />
        <p className="tw:m-0 tw:mt-3 tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]">No fields yet</p>
        <p className="tw:m-0 tw:mt-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">Add a field to start.</p>
        <div className="tw:mt-3 tw:flex tw:gap-2">
          <Button
            size="xs"
            className={`${PRIMARY} tw:h-8`}
            data-testid="cms-ws-empty-add-field"
            onClick={() => {
              cmsWorkspace.setTab("fields");
              setAddingField(true);
            }}
          >
            Add field
          </Button>
        </div>
      </div>
    );
  } else if (ws.tab === "records") {
    body = isEmpty ? (
      /* 4428:148905 — an empty collection offers both ways in. */
      <div className="tw:flex tw:flex-col tw:items-center tw:pt-[132px] tw:text-center" data-testid="cms-ws-no-records">
        <Table2 size={20} className="tw:text-[var(--bk-ink-soft)]" aria-hidden="true" />
        <p className="tw:m-0 tw:mt-3 tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]">No records yet</p>
        <p className="tw:m-0 tw:mt-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">Add your first record or import existing records.</p>
        <div className="tw:mt-3 tw:flex tw:gap-2">
          <Button size="xs" className={`${PRIMARY} tw:h-8`} data-testid="cms-ws-empty-add" onClick={() => cmsWorkspace.openRecord("new")}>
            Add record
          </Button>
          <ImportRecordsButton importer={importer} />
          <Button
            size="xs"
            variant="secondary"
            className="tw:h-8 tw:px-3 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]"
            data-testid="cms-ws-empty-import-csv"
            onClick={() => setCsvImportOpen(true)}
          >
            Import CSV…
          </Button>
        </div>
      </div>
    ) : (
      <RecordsTable
        /* UI-01: a sort (and page) belongs to its collection. Kept across a
           switch, a sort on a field the next collection lacks crashed the
           table. */
        key={collection.id}
        collection={collection}
        records={panel.records}
        referenceLabels={referenceLabels}
        onOpenRecord={(id) => cmsWorkspace.openRecord(id)}
      />
    );
  } else if (ws.tab === "fields") {
    body = <FieldsTable collection={collection} usage={usage} selectedId={selectedField?.id ?? null} onSelect={setFieldId} />;
  } else if (ws.tab === "dynamic-pages") {
    body = <DynamicPagesPane composer={composer} collection={collection} records={panel.records} />;
  } else if (ws.tab === "settings") {
    body = <CollectionSettingsPane composer={composer} collection={collection} records={panel.records} />;
  } else {
    body = null;
  }

  /* 2L9 165:520 — an open record fills the workspace under its tabs. */
  const sheetOpen = Boolean(ws.recordId && (ws.recordId === "new" || sheetRecord));
  const sheet = sheetOpen ? (
        <RecordSheet
          key={ws.recordId}
          composer={composer}
          collection={collection}
          record={sheetRecord}
          gone={goneRecord !== null}
          onClose={() => {
            setGone(null);
            cmsWorkspace.openRecord(null);
          }}
          origin={ws.origin}
          onOpenTab={(tab) => cmsWorkspace.setTab(tab)}
          onSave={async (data, published) => {
            const isNew = ws.recordId === "new";
            const { item, reached, conflict, invalid } = await panel.saveRecord(
              collection.id,
              isNew ? created.current : ws.recordId,
              data,
              published,
            );
            if (isNew && item) created.current = item.id;
            return reached ? true : conflict ? "conflict" : invalid ? { refused: invalid } : false;
          }}
          onDelete={async (r) => {
            await panel.deleteRecord(r.id);
            await loadRecords(collection.id);
          }}
          onRestore={async (r) => {
            await panel.saveRecord(collection.id, null, r.data, r.status === "published");
          }}
          onOpenMediaLibrary={onOpenMediaLibrary}
        />
  ) : null;

  const hint =
    selectedField || sheetOpen
      ? null
      : isEmpty
      ? { title: "Add your first record", hint: "It opens here for editing." }
      : ws.tab === "dynamic-pages"
        ? { title: "Select a page", hint: "Generated pages open here and under Pages." }
        : ws.tab === "fields"
          ? { title: "Select a field", hint: "Click a row to open its settings — type, key, required and validation." }
        : ws.tab === "settings"
          ? { title: "Settings apply to every record", hint: "Rename, re-sync or delete this collection here." }
          : null;

  return (
    /* data-bk-full-page: this view covers the canvas column, so toasts take the window corner (8139:217711). */
    <div className="tw:relative tw:flex tw:h-full tw:min-h-0" data-testid="cms-workspace" data-bk-full-page="">
      <section className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:bg-[var(--bk-bg-panel)]">
        <header className={HEADER} data-testid="cms-ws-header">
          {back}
          <h2 className={TITLE} data-testid="cms-ws-title">
            {collection.name}
            <span className="tw:font-semibold" data-testid="cms-ws-meta">
              {" · "}
              {plural(count, "record")}
            </span>
          </h2>
          <span className="tw:flex-1" />
          {sheetOpen ? null : primary}
          {/* 254:82143 — the collection ⋯ holds the imports (B13: the Records
              modal they lived in is retired, and a capability does not go
              quietly) and the connectors that are planned. */}
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            label="Collection menu"
            trigger={
              <IconButton
                label="Collection menu"
                className="tw:size-8"
                pressed={menuOpen}
                data-testid="cms-ws-more"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={16} />
              </IconButton>
            }
          >
            <Menu label="Collection menu">
              <MenuItem data-testid="cms-ws-menu-import-csv" onClick={() => { setMenuOpen(false); setCsvImportOpen(true); }}>
                Import CSV…
              </MenuItem>
              <MenuItem data-testid="cms-ws-menu-import" onClick={() => { setMenuOpen(false); importer.pick(); }}>
                Import JSON…
              </MenuItem>
              {/* External connectors need OAuth apps + credentials that don't
                  exist in any env, plus a security review (fix-all round,
                  2026-09-25 decision) — a clear disabled row, not a dead
                  button that looks live. */}
              <MenuSeparator />
              <MenuItem disabled kbd="Planned" data-testid="cms-ws-menu-import-sheets">
                Google Sheets
              </MenuItem>
              <MenuItem disabled kbd="Planned" data-testid="cms-ws-menu-import-airtable">
                Airtable
              </MenuItem>
            </Menu>
          </Popover>
        </header>
        <div className={TAB_ROW}>
          <Tabs
            tabs={TABS}
            value={ws.tab}
            onChange={(id) => cmsWorkspace.setTab(id as CmsTab)}
            label={`${collection.name} sections`}
            className="tw:gap-2 tw:p-0"
            tabClassName={TAB}
            data-testid="cms-ws-tabs"
          />
        </div>
        {importer.status}
        {/* 165:2917 — a selected field's settings (or a tab's hint) sit beside
            the table, under the header and tabs. */}
        <div className="tw:flex tw:min-h-0 tw:flex-1">
          <div className="tw:flex tw:min-h-0 tw:min-w-0 tw:flex-1 tw:flex-col">{sheetOpen ? sheet : body}</div>
          {selectedField ? (
            <FieldInspector
              composer={composer}
              collection={collection}
              collections={panel.collections}
              field={selectedField}
              records={panel.records}
              uses={usage.get(selectedField.slug) ?? []}
              onClose={() => setFieldId(null)}
              onDeleteField={deleteField}
              onOpenUse={openUse}
              onSetDefault={fillDefault}
              onChangeType={changeType}
            />
          ) : null}
          {hint ? <HintColumn title={hint.title} hint={hint.hint} testId="cms-ws-hint" /> : null}
        </div>
      </section>
      {addingField ? (
        <AddFieldDialog
          collection={collection}
          onClose={() => setAddingField(false)}
          collections={panel.collections}
          onAdd={(field) => panel.addField(collection.id, field)}
        />
      ) : null}
      {csvImportOpen ? (
        <CsvImportDialog
          collection={collection}
          onClose={() => setCsvImportOpen(false)}
          /* DM-15: the import wrote on the server and the hydrate wrote to
             this browser's store behind the engine; its cache still held the
             pre-import rows, so "Imported 4 of 4" showed none of them until a
             reload. Re-read the store, then the table. */
          onImported={() =>
            void Promise.resolve(composer?.cms.collections.refreshFromStorage()).then(() => loadRecords(collection.id))
          }
        />
      ) : null}
      {importer.input}
    </div>
  );
}

export default CmsWorkspace;
