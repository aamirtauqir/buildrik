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
import { Button, IconButton, Menu, MenuItem, MenuSeparator, PanelSearch, Popover, Tabs, useToast } from "@/editor/chrome-ui";
import { useContentPanel } from "@/editor/sidebar/tabs/content/useContentPanel";
import { DynamicPagesPane } from "./DynamicPagesPane";
import { CollectionSettingsPane } from "./CollectionSettingsPane";
import { FieldsTable } from "./FieldsTable";
import { FieldInspector } from "./FieldInspector";
import { fieldUsage } from "./fieldUsage";
import { AddFieldDialog } from "./AddFieldDialog";
import { cmsWorkspace, useCmsWorkspace, type CmsTab } from "./cmsWorkspaceStore";
import { RecordsTable } from "./RecordsTable";
import { RecordSheet, type OpenMediaLibrary } from "./RecordSheet";
import { BACK } from "./paneStyles";
import { ImportRecordsButton, useImportRecords } from "./useImportRecords";
import { CsvImportDialog } from "./CsvImportDialog";
import { onCmsGone } from "@/services/cmsSync";
import type { CMSCollection, CMSContentItem } from "@/shared/types/cms";

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

const HEADER =
  "tw:flex tw:h-14 tw:flex-none tw:items-center tw:gap-3 tw:px-5 tw:border-b tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]";
const TITLE = "tw:m-0 tw:text-[16px] tw:leading-6 tw:font-semibold tw:tracking-[-0.16px] tw:text-[var(--bk-ink)] tw:whitespace-nowrap";
const META = "tw:text-[13px] tw:leading-5 tw:text-[var(--bk-gray-500)] tw:whitespace-nowrap";
/* 4428:143466 — 28 tall, 12 inline, 13/20 medium. Same-property utilities so
   they displace flowbite's xs size. */
const PRIMARY = "tw:h-7 tw:px-3 tw:py-1 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]";
const TAB_ROW =
  "tw:flex tw:h-10 tw:flex-none tw:items-center tw:gap-1 tw:pl-3 tw:pr-5 tw:border-b tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]";
/* 7432:143178 — an underlined tab, not the shared pill: 40 tall, 10 inline,
   13/20 medium, ink-soft; the selected one is accent with a 2px accent rule. */
const TAB =
  "tw:h-10 tw:rounded-none tw:px-2.5 tw:font-medium tw:leading-5 tw:text-[var(--bk-ink-soft)] tw:border-b-2 tw:border-transparent " +
  "tw:hover:bg-transparent tw:aria-selected:bg-transparent tw:aria-selected:hover:bg-transparent " +
  "tw:aria-selected:border-[var(--bk-accent)] tw:aria-selected:text-[var(--bk-accent-text)]";

/* A quiet 28-tall action at the header's start; a rule parts it from the title. */

const TABS = [
  { id: "records", label: "Records" },
  { id: "fields", label: "Fields" },
] as const;

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
  const [query, setQuery] = React.useState("");
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

  /* 6819:59209 had the topbar field search an open collection ("Search Menu
     items…"); owner decision 2026-10-03 moves it under the tab row, over the
     records it filters. Leaving the collection drops the query, as handing
     the topbar field back used to. */
  const collectionName = collection?.name ?? null;
  React.useEffect(() => {
    setQuery("");
  }, [collectionName]);

  /* 4428:140486 — while the workspace covers the canvas the topbar crumb
     reads "<site> › CMS", not the page behind it. */
  React.useEffect(() => {
    if (!composer) return;
    composer.emit(EVENTS.UI_CRUMB_CONTEXT, { label: "CMS" });
    return () => {
      composer.emit(EVENTS.UI_CRUMB_CONTEXT, null);
    };
  }, [composer]);

  const importer = useImportRecords(composer, collection);
  const back = onBackToCanvas ? (
    <>
      <Button color="light" size="xs" className={BACK} data-testid="cms-ws-back-to-canvas" onClick={onBackToCanvas}>
        ‹ Back to canvas
      </Button>
      <span className="tw:h-5 tw:w-px tw:bg-[var(--bk-border)]" aria-hidden="true" />
    </>
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
      <Button size="xs" className={PRIMARY} data-testid="cms-ws-add-record" onClick={() => cmsWorkspace.openRecord("new")}>
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
    setFieldId(null);
    await panel.deleteField(collection.id, id);
    if (field) addToast({ tone: "success", title: "Field deleted", description: `${field.name} has been removed from ${collection.name}.` });
  };
  /* "Open the binding" — select the bound element and go back to the canvas. */
  const openUse = (elementId: string) => {
    const el = composer?.elements.getElement(elementId);
    if (!composer || !el) return;
    composer.selection.select(el);
    composer.emit("ui:switch-tab", { tab: "layers" });
  };

  let body: React.ReactNode;
  if (ws.tab === "records") {
    body = isEmpty ? (
      /* 4428:148905 — an empty collection offers both ways in. */
      <div className="tw:flex tw:flex-col tw:items-center tw:pt-[132px] tw:text-center" data-testid="cms-ws-no-records">
        <Table2 size={20} className="tw:text-[var(--bk-ink-soft)]" aria-hidden="true" />
        <p className="tw:m-0 tw:mt-3 tw:text-[16px] tw:leading-6 tw:font-semibold tw:text-[var(--bk-ink)]">No records yet</p>
        <p className="tw:m-0 tw:mt-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">Add your first record.</p>
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
            Import CSV
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
        query={query}
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

  const hint =
    selectedField
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
          <h2 className={TITLE} data-testid="cms-ws-title">{collection.name}</h2>
          <span className={META} data-testid="cms-ws-meta">
            · {ws.tab === "fields" ? plural(collection.fields.length, "field") : plural(count, "record")}
          </span>
          <span className="tw:flex-1" />
          {primary}
        </header>
        <div className={TAB_ROW}>
          <Tabs
            tabs={TABS}
            value={ws.tab}
            onChange={(id) => cmsWorkspace.setTab(id as CmsTab)}
            label={`${collection.name} sections`}
            className="tw:p-0 tw:gap-1"
            tabClassName={TAB}
            data-testid="cms-ws-tabs"
          />
          {/* 7096:76270 — the collection ⋯ holds the two tabs the row has no
              room to name, plus Import JSON (B13): the Records modal it lived
              in is retired, and a capability does not go quietly. */}
          <Popover
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            label="Collection menu"
            trigger={
              <IconButton
                label="Collection menu"
                className="tw:size-10"
                pressed={menuOpen || ws.tab === "dynamic-pages" || ws.tab === "settings"}
                data-testid="cms-ws-more"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreHorizontal size={20} />
              </IconButton>
            }
          >
            <Menu label="Collection menu">
              <MenuItem selected={ws.tab === "dynamic-pages"} data-testid="cms-ws-menu-dynamic" onClick={() => { setMenuOpen(false); cmsWorkspace.setTab("dynamic-pages"); }}>
                Dynamic pages
              </MenuItem>
              <MenuItem selected={ws.tab === "settings"} data-testid="cms-ws-menu-settings" onClick={() => { setMenuOpen(false); cmsWorkspace.setTab("settings"); }}>
                Settings
              </MenuItem>
              <MenuSeparator />
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
              <MenuItem disabled kbd="Coming soon" data-testid="cms-ws-menu-import-sheets">
                Google Sheets
              </MenuItem>
              <MenuItem disabled kbd="Coming soon" data-testid="cms-ws-menu-import-airtable">
                Airtable
              </MenuItem>
            </Menu>
          </Popover>
        </div>
        {importer.status}
        {ws.tab === "records" && !isEmpty ? (
          <PanelSearch
            placeholder={`Search ${collection.name}…`}
            value={query}
            onChange={setQuery}
            className="tw:max-w-[352px]"
            data-testid="cms-ws-search"
          />
        ) : null}
        <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col">{body}</div>
      </section>
      {addingField ? (
        <AddFieldDialog
          collection={collection}
          onClose={() => setAddingField(false)}
          collections={panel.collections}
          onAdd={(field) => panel.addField(collection.id, field)}
        />
      ) : null}
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
        />
      ) : null}
      {csvImportOpen ? (
        <CsvImportDialog
          collection={collection}
          onClose={() => setCsvImportOpen(false)}
          onImported={() => void loadRecords(collection.id)}
        />
      ) : null}
      {hint ? <HintColumn title={hint.title} hint={hint.hint} testId="cms-ws-hint" /> : null}
      {ws.recordId && (ws.recordId === "new" || sheetRecord) ? (
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
          /* The sheet covers the workspace header: opened from an element
             (Open record ›), its own back closes it and returns to the
             canvas in one step (§13). */
          onBackToCanvas={
            onBackToCanvas
              ? () => {
                  cmsWorkspace.openRecord(null);
                  onBackToCanvas();
                }
              : undefined
          }
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
      ) : null}
      {importer.input}
    </div>
  );
}

export default CmsWorkspace;
