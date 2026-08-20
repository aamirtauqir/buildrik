/**
 * ContentViews — the drill-in views of the Content panel, matched to the
 * Figma boards: root 148:2, empty 149:7, collection 149:50, record 149:84,
 * unsaved-record 149:108, fields 151:2, sources 151:46, variables 151:62,
 * conditions 151:87. Pure presentation + callbacks; state lives in
 * useContentPanel.
 *
 * Every list line here is a chrome-ui row (ListRow / RecordRow / Row), not a
 * local rebuild of one. The panel used to carry a 24-key style object that
 * reimplemented exactly those three.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import {
  ConfirmDialog,
  Button,
  Checkbox,
  EmptyState,
  EmptyStateActions,
  EmptyStateDesc,
  IconButton,
  Popover,
  Menu,
  MenuItem,
  ListRow,
  RecordRow,
  Row,
  SectionHeader,
  Select,
  Textarea,
  TextInput,
  ToggleSwitch,
} from "@/editor/chrome-ui";
import { CMSValidationError } from "@/engine/cms/CollectionManager";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import type { ConditionExpression, ConditionOperator, DataSource } from "@/shared/types/data";
import { conditionSummary, fieldDefault, isValidVariableKey, type SiteVariable } from "./contentPanelUtils";
import type { ConditionRow } from "./useContentPanel";

/** The panel column. Exported because ContentTab wraps these views in it. */
export const CONTENT_BODY = "tw:flex tw:flex-col tw:h-full tw:min-h-0";

const SCROLL = "tw:flex-1 tw:min-h-0 tw:overflow-y-auto";
/** A text button that reads as a link: breadcrumbs and every "+ New …".
 *
 *  `border-0` is the one that matters, and it is NOT interchangeable with
 *  `border-transparent`: that sets only a colour, so the browser's own
 *  `2px outset` button border survives and the control grows 4px in both
 *  axes. The parity harness caught exactly that. With the width at 0 the
 *  colour is unobservable, so no `border-transparent` here. */
/* `tw:p-0` leaves the height entirely to the line-box, which rendered every
   link-action ("+ Add", "+ Add field", "+ New collection") and every breadcrumb
   at 16px tall — under WCAG 2.5.8's 24x24 target minimum. `min-h-6` is 24
   exactly; `items-center` already centres the label, so the glyph does not
   move, only the hit area grows. */
const LINK_BTN =
  "tw:inline-flex tw:items-center tw:gap-1.5 tw:bg-transparent tw:border-0 tw:p-0 tw:min-h-6 " +
  "tw:text-[13px] tw:text-blue-700 tw:hover:text-blue-800 tw:enabled:hover:bg-transparent";
/** The quiet row-action button, previously copy-pasted at eleven call sites. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";
const FIELD_LABEL = "tw:text-xs tw:text-gray-500 tw:mx-3 tw:mt-2.5 tw:mb-1";
/** Inputs sit in a padded wrapper rather than carrying their own margin, so
 *  the field keeps the TextInput/Select wrapper theme untouched. */
const FIELD_WRAP = "tw:px-3";
const TOGGLE_ROW = "tw:flex tw:items-center tw:justify-between tw:p-3";
/* Board 149:108 tints the save bar with the warning wash, not neutral grey —
   the bar exists to say something is unsaved, and grey says nothing. */
const SAVEBAR =
  "tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2.5 tw:border-t tw:border-gray-200 " +
  "tw:bg-[var(--bk-warning-tint)]";
/* …and it draws Save as accent TEXT, not a filled button. The Button doc on the
   same Figma page is explicit that the one filled accent button belongs to the
   screen's primary action; a drawer's save bar is not where that is spent. */
const SAVE_LINK =
  "tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal " +
  "tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline";
/** A note that belongs to the row above it, not to the panel's foot. */
const INLINE_HINT = "tw:text-xs tw:text-gray-500 tw:leading-normal tw:px-3 tw:pb-3";
const MONO = "tw:[font-family:var(--bk-font-mono)] tw:text-xs tw:text-blue-700";
const SUB = "tw:text-xs tw:text-gray-500";
const INLINE_FORM = "tw:flex tw:flex-col tw:gap-2 tw:p-3 tw:border-b tw:border-gray-200";
const FORM_ROW = "tw:flex tw:gap-2 tw:items-center";
const SPACER = "tw:flex-1";
/** Two stacked lines inside a row (name over type, key over value). */
const ROW_STACK = "tw:flex tw:flex-col tw:gap-0.5 tw:min-w-0 tw:flex-1";
const ROW_ACTIONS = "tw:ml-auto tw:inline-flex tw:items-center tw:gap-1 tw:flex-none";
const ERROR_TEXT = "tw:text-xs tw:text-[var(--bk-error)]";

function Crumb({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    /* self-start / justify-start: flowbite's Button centres its content and
       stretches to the column's width, so the board's left-aligned back link
       sat in the middle of the panel (149:50, 149:84). */
    <Button className={`${LINK_BTN} tw:mx-3 tw:mt-2.5 tw:mb-0.5 tw:self-start tw:justify-start`} onClick={onClick} aria-label={`Back to ${label}`}>
      ‹ {label}
    </Button>
  );
}

/* ── Root (148:2) + empty (149:7) ────────────────────────────────────────── */

export function RootView({
  collections,
  recordCounts,
  sourcesCount,
  variablesCount,
  conditionsCount,
  onOpenCollection,
  onCreateCollection,
  onOpenSources,
  onOpenVariables,
  onOpenConditions,
}: {
  collections: CMSCollection[];
  recordCounts: Record<string, number>;
  sourcesCount: number;
  variablesCount: number;
  conditionsCount: number;
  onOpenCollection: (id: string) => void;
  onCreateCollection?: () => void;
  onOpenSources: () => void;
  onOpenVariables: () => void;
  onOpenConditions: () => void;
}) {
  if (collections.length === 0 && sourcesCount === 0 && variablesCount === 0 && conditionsCount === 0) {
    return (
      /*
        Board 149:7 draws this block composed, not with the default slots:
        the copy is 13/20 over 272, and the call to action is ACCENT TEXT.
        EmptyState's shared body class is 12px and its `action` slot takes a
        filled Button, so the defaults gave a 12px line under a solid blue
        CTA. The Button doc on the same page is explicit — primary is the ONE
        filled accent button per screen — and an empty panel inviting you in
        is not where that one gets spent. Media's empty state (145:406) draws
        its two calls to action the same way.
      */
      <EmptyState
        className="tw:flex-1"
        data-testid="content-empty"
      >
        <EmptyStateDesc className="tw:max-w-[272px] tw:text-[13px] tw:leading-5">
          {/* One source literal, deliberately: gate:copy greps src/ for the exact
              string from the design doc, so wrapping it across two JSX lines
              reads to that gate as the line having been deleted. */}
          Collections turn a spreadsheet into pages — one page per row, updated when the data changes.
        </EmptyStateDesc>
        {onCreateCollection ? (
          <EmptyStateActions>
            <Button
              color="light"
              size="xs"
              className="tw:min-h-6 tw:border-0 tw:bg-transparent tw:px-0 tw:text-[13px] tw:font-normal tw:text-blue-700 tw:enabled:hover:bg-transparent tw:enabled:hover:underline"
              data-testid="content-empty-cta"
              onClick={onCreateCollection}
            >
              Create a collection
            </Button>
          </EmptyStateActions>
        ) : null}
      </EmptyState>
    );
  }
  return (
    <div className={SCROLL}>
      <SectionHeader count={collections.length}>Collections</SectionHeader>
      {collections.map((c) => (
        <ListRow
          key={c.id}
          label={c.name}
          count={recordCounts[c.id] ?? "—"}
          chevron
          onClick={() => onOpenCollection(c.id)}
        />
      ))}
      {onCreateCollection && (
        <Button className={`${LINK_BTN} tw:mx-3 tw:my-2`} onClick={onCreateCollection}>
          + New collection
        </Button>
      )}
      <SectionHeader>Data</SectionHeader>
      <ListRow label="Sources" count={sourcesCount} chevron onClick={onOpenSources} />
      <ListRow label="Variables" count={variablesCount} chevron onClick={onOpenVariables} />
      <ListRow label="Conditions" count={conditionsCount} chevron onClick={onOpenConditions} />
    </div>
  );
}

/* ── Collection (149:50) ─────────────────────────────────────────────────── */

export function CollectionView({
  collection,
  records,
  onBack,
  onOpenRecord,
  onAddRecord,
  onOpenFields,
  onOpenDynamicPages,
}: {
  collection: CMSCollection;
  records: CMSContentItem[];
  onBack: () => void;
  onOpenRecord: (id: string) => void;
  onAddRecord: () => void;
  onOpenFields: () => void;
  onOpenDynamicPages?: () => void;
}) {
  const display = collection.displayField ?? collection.fields[0]?.slug;
  const recordName = (r: CMSContentItem): string => {
    const v = display ? r.data[display] : undefined;
    return typeof v === "string" && v.trim() ? v : `Record ${r.id.slice(-4)}`;
  };
  return (
    <div className={CONTENT_BODY}>
      <Crumb label={collection.name} onClick={onBack} />
      <div className="tw:flex tw:justify-between tw:items-center tw:px-3 tw:pt-1 tw:pb-2">
        <span className={SUB}>
          {records.length} record{records.length === 1 ? "" : "s"}
        </span>
        <Button className={LINK_BTN} onClick={onAddRecord}>
          + Add
        </Button>
      </div>
      <div className={SCROLL}>
        {records.map((r) => (
          <RecordRow
            key={r.id}
            data-record-row
            label={recordName(r)}
            published={r.status === "published"}
            chevron
            onClick={() => onOpenRecord(r.id)}
          />
        ))}
        {records.length === 0 && <div className={`${SUB} tw:p-3`}>No records yet — add the first one.</div>}
      </div>
      <div className="tw:border-t tw:border-gray-200">
        <ListRow label="Fields" count={collection.fields.length} chevron onClick={onOpenFields} />
        {onOpenDynamicPages && <ListRow label="Dynamic pages" chevron onClick={onOpenDynamicPages} />}
      </div>
    </div>
  );
}

/* ── Record (149:84) + unsaved (149:108) ─────────────────────────────────── */

export function RecordView({
  collection,
  record,
  onBack,
  onSave,
  onDelete,
}: {
  collection: CMSCollection;
  record: CMSContentItem | null;
  onBack: () => void;
  onSave: (data: Record<string, unknown>, published: boolean) => Promise<void>;
  onDelete?: () => void;
}) {
  const initial = React.useMemo(() => {
    const base: Record<string, unknown> = {};
    for (const f of collection.fields) base[f.slug] = record?.data[f.slug] ?? fieldDefault(f);
    return base;
  }, [collection, record]);
  const [data, setData] = React.useState<Record<string, unknown>>(initial);
  const [published, setPublished] = React.useState(record?.status === "published");
  const [saving, setSaving] = React.useState(false);
  /* Publishing runs the collection's own rules (CollectionManager). Until it
     did, the "required" tag on the Fields screen was decoration and a record
     could go live empty; now the failure has to land on the fields it names
     rather than as a rejected promise nobody sees. */
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  React.useEffect(() => {
    setData(initial);
    setPublished(record?.status === "published");
    setErrors({});
  }, [initial, record]);

  const dirty =
    JSON.stringify(data) !== JSON.stringify(initial) || published !== (record?.status === "published");
  /* The save bar already says "Unsaved changes" and offers Discard — the crumb
     used to do the same thing without saying so, and typed values went with
     it. Same ConfirmDialog this file already uses to guard a field delete. */
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const leave = () => (dirty ? setConfirmLeave(true) : onBack());
  const display = collection.displayField ?? collection.fields[0]?.slug;
  const title =
    (record && typeof record.data[display ?? ""] === "string" && (record.data[display ?? ""] as string)) ||
    (record ? `Record ${record.id.slice(-4)}` : "New record");

  const setField = (slug: string, value: unknown) => setData((d) => ({ ...d, [slug]: value }));

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={title} onClick={leave} />
      <div className={SCROLL}>
        {collection.fields.map((f) => (
          <div key={f.id}>
            {f.type === "boolean" ? (
              <div className={TOGGLE_ROW}>
                <span className="tw:text-[13px]">{f.name}</span>
                <ToggleSwitch
                  checked={Boolean(data[f.slug])}
                  aria-label={f.name}
                  onChange={() => setField(f.slug, !data[f.slug])}
                />
                {errors[f.slug] && (
                  <span className="tw:ml-2 tw:text-xs tw:text-[var(--bk-error)]" role="alert">
                    {errors[f.slug]}
                  </span>
                )}
              </div>
            ) : (
              <>
                <div className={FIELD_LABEL}>{f.name}</div>
                <div className={FIELD_WRAP}>
                  {f.type === "textarea" || f.type === "richtext" ? (
                    <Textarea
                      className="tw:bg-white tw:min-h-16 tw:resize-y"
                      value={String(data[f.slug] ?? "")}
                      onChange={(e) => setField(f.slug, e.target.value)}
                      aria-label={f.name}
                    />
                  ) : (
                    <TextInput
                      type={f.type === "number" ? "number" : "text"}
                      value={String(data[f.slug] ?? "")}
                      onChange={(e) => setField(f.slug, f.type === "number" ? Number(e.target.value) : e.target.value)}
                      aria-label={f.name}
                    />
                  )}
                </div>
                {errors[f.slug] && (
                  <div className="tw:mx-3 tw:mt-1 tw:text-xs tw:text-[var(--bk-error)]" role="alert">
                    {errors[f.slug]}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        <div className={TOGGLE_ROW}>
          <span className="tw:text-[13px]">Published</span>
          <ToggleSwitch checked={published} aria-label="Published" onChange={() => setPublished((v) => !v)} />
        </div>
        {record && onDelete && (
          <Button
            className={`${LINK_BTN} tw:mx-3 tw:my-2 tw:text-[var(--bk-error)] tw:hover:text-[var(--bk-error)]`}
            onClick={onDelete}
          >
            Delete record
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => { setConfirmLeave(false); onBack(); }}
        title="Discard changes?"
        message="This record has unsaved changes. Going back throws them away."
        confirmLabel="Discard"
        tone="destructive"
      />
      {(dirty || !record) && (
        <div className={SAVEBAR} role="region" aria-label="Unsaved changes">
          <span className="tw:text-xs tw:text-[var(--bk-warning-text)]">Unsaved changes</span>
          <span className={SPACER} />
          <Button
            color="light"
            size="xs"
            className={GHOST}
            onClick={() => { setData(initial); setPublished(record?.status === "published"); }}
          >
            Discard
          </Button>
          <Button
            color="light"
            size="xs"
            className={SAVE_LINK}
            disabled={saving}
            aria-busy={saving || undefined}
            onClick={() => {
              setSaving(true);
              setErrors({});
              void onSave(data, published)
                .catch((e: unknown) => {
                  if (e instanceof CMSValidationError) setErrors(e.errors);
                  else throw e;
                })
                .finally(() => setSaving(false));
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Fields (151:2) ──────────────────────────────────────────────────────── */

const FIELD_TYPES = ["text", "textarea", "richtext", "number", "boolean", "image", "date", "slug", "reference"] as const;

/** Board 151:2 writes the type as prose — "Rich text", not the `richtext` slug
 *  the model stores. The slug is an identifier; a field list is read, not
 *  parsed. */
const FIELD_TYPE_LABEL: Record<string, string> = {
  text: "Text",
  textarea: "Long text",
  richtext: "Rich text",
  number: "Number",
  boolean: "Boolean",
  image: "Image",
  date: "Date",
  slug: "Slug",
  reference: "Reference",
};

export function FieldsView({
  collection,
  onBack,
  onAddField,
  onDeleteField,
}: {
  collection: CMSCollection;
  onBack: () => void;
  onAddField: (name: string, type: string, required: boolean) => Promise<void>;
  onDeleteField: (fieldId: string) => Promise<void>;
}) {
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>("text");
  const [required, setRequired] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<CMSField | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={`${collection.name} · fields`} onClick={onBack} />
      <div className={SCROLL}>
        {collection.fields.map((f) => (
          <Row key={f.id} size="comment" data-field-row>
            <span className={ROW_STACK}>
              <span>{f.name}</span>
              <span className={SUB}>{FIELD_TYPE_LABEL[f.type] ?? f.type}</span>
            </span>
            <span className={ROW_ACTIONS}>
              {f.validation?.required && <span className={SUB}>required</span>}
              {/* Board 151:2 draws `⋯`, not a bare ✕: delete is not the only
                  thing a field row will ever offer, and a destructive glyph
                  sitting permanently on every row invites the mis-click.
                  IconButton (32x32) rather than a text Button carrying a glyph —
                  that sizes to the glyph and measured 21.92x18, under WCAG
                  2.5.8's 24x24 minimum. */}
              <Popover
                open={menuFor === f.id}
                onClose={() => setMenuFor(null)}
                placement="bottom-end"
                label={`Actions for ${f.name}`}
                trigger={
                  <IconButton
                    label={`Actions for field ${f.name}`}
                    onClick={() => setMenuFor((p) => (p === f.id ? null : f.id))}
                  >
                    ⋯
                  </IconButton>
                }
              >
                <Menu>
                  <MenuItem
                    onClick={() => {
                      setMenuFor(null);
                      setConfirmDelete(f);
                    }}
                  >
                    Delete field
                  </MenuItem>
                </Menu>
              </Popover>
            </span>
          </Row>
        ))}
        {adding ? (
          <div className={INLINE_FORM}>
            <TextInput
              placeholder="Field name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Field name"
              autoFocus
            />
            <div className={FORM_ROW}>
              <Select value={type} onChange={(e) => setType(e.target.value)} aria-label="Field type">
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{FIELD_TYPE_LABEL[t] ?? t}</option>
                ))}
              </Select>
              <label className="tw:inline-flex tw:items-center tw:gap-1.5 tw:text-[13px] tw:cursor-pointer">
                <Checkbox
                  color="blue"
                  className="tw:bg-white"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                />
                <span>required</span>
              </label>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                size="xs"
                disabled={!name.trim()}
                onClick={() => {
                  void onAddField(name, type, required).then(() => {
                    setAdding(false);
                    setName("");
                    setRequired(false);
                  });
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-3 tw:my-2`} onClick={() => setAdding(true)}>
            + Add field
          </Button>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void onDeleteField(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete field?"
        message={`"${confirmDelete?.name}" and its values on every record will be removed.`}
        confirmLabel="Delete field"
        tone="destructive"
      />
    </div>
  );
}

/* ── Dynamic pages ───────────────────────────────────────────────────────────
 *
 * Board 149:50 draws a `Dynamic pages ›` row in the collection footer and stops
 * there — it names the destination without drawing it. `CollectionView` had the
 * row behind an optional `onOpenDynamicPages`, ContentTab never passed it, and
 * the row is conditional, so it has never once rendered. The prop was dead from
 * the day it was added.
 *
 * The destination below is therefore designed, not transcribed, and it is
 * grounded in what the field actually does: `pageSlugPattern` generates one page
 * per record (`cms.ts:60`), so this screen is where you set it, see how many
 * pages it will produce, and learn why nothing appears until records publish —
 * which is the question `CMSRecordsModal` already answers in a warning banner.
 */

export function DynamicPagesView({
  collection,
  records,
  onBack,
  onSave,
}: {
  collection: CMSCollection;
  records: CMSContentItem[];
  onBack: () => void;
  onSave: (pattern: string) => Promise<void>;
}) {
  const [pattern, setPattern] = React.useState(collection.pageSlugPattern ?? "");
  const [saving, setSaving] = React.useState(false);
  React.useEffect(() => setPattern(collection.pageSlugPattern ?? ""), [collection.pageSlugPattern]);

  const trimmed = pattern.trim();
  const dirty = trimmed !== (collection.pageSlugPattern ?? "");
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const leave = () => (dirty ? setConfirmLeave(true) : onBack());
  const publishedCount = records.filter((r) => r.status === "published").length;
  /* Two more conditions decide whether a page actually appears, and neither is
     the record count. Both were checked against the service, not guessed:
     - `applyPattern` (cms.service.ts:121) substitutes "" for a {key} that names
       no field, so "/{slug}" on a collection whose only field is `title`
       resolves every record to "/" — they collide instead of generating.
     - `appendDynamicPagesToPublish` (:234) selects collections where
       `pageTemplatePath` is NOT NULL. Nothing in this panel sets it, so a
       collection created here contributes ZERO pages at publish while this
       screen said "Generates 1 page". */
  const patternKeys = [...trimmed.matchAll(/\{([a-zA-Z0-9_-]+)\}/g)].map((m) => m[1]);
  const unknownKeys = patternKeys.filter((k) => !collection.fields.some((f) => f.slug === k));
  const hasTemplate = Boolean(collection.pageTemplatePath);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={`${collection.name} · dynamic pages`} onClick={leave} />
      <div className={SCROLL}>
        <div className={FIELD_LABEL}>URL pattern</div>
        <div className={FIELD_WRAP}>
          <TextInput
            value={pattern}
            placeholder="/menu/{slug}"
            onChange={(e) => setPattern(e.target.value)}
            aria-label="URL pattern"
            className="tw:[font-family:var(--bk-font-mono)]"
          />
        </div>
        <div className={`${SUB} tw:px-3 tw:pt-1.5 tw:leading-normal`}>
          One page per record. Use a field slug in braces — {"{slug}"} — to build the URL.
        </div>

        {trimmed ? (
          <div className={`${SUB} tw:px-3 tw:pt-3 tw:leading-normal`}>
            {publishedCount === 0 ? (
              /* The count that matters is PUBLISHED, not total: generation
                 filters on published, so "4 records" would be a comforting
                 number that produces nothing. */
              <span style={{ color: "var(--bk-warning)" }}>
                {records.length === 0
                  ? "No records yet — nothing to generate."
                  : `${records.length} record${records.length === 1 ? "" : "s"}, none published. Dynamic pages only generate from published records.`}
              </span>
            ) : (
              `Generates ${publishedCount} page${publishedCount === 1 ? "" : "s"} from published records.`
            )}
          </div>
        ) : (
          <div className={`${SUB} tw:px-3 tw:pt-3 tw:leading-normal`}>
            No pattern set — this collection generates no pages.
          </div>
        )}
        {trimmed && unknownKeys.length > 0 && (
          <div className={`${SUB} tw:px-3 tw:pt-2 tw:leading-normal`} style={{ color: "var(--bk-warning)" }}>
            {unknownKeys.length === 1
              ? `This collection has no field called "${unknownKeys[0]}", so every record resolves to the same URL.`
              : `This collection has no fields called ${unknownKeys.map((k) => `"${k}"`).join(", ")}, so every record resolves to the same URL.`}
          </div>
        )}
        {trimmed && !hasTemplate && (
          <div className={`${SUB} tw:px-3 tw:pt-2 tw:leading-normal`} style={{ color: "var(--bk-warning)" }}>
            No template page is bound, so publishing emits none of these yet.
          </div>
        )}
      </div>
      <ConfirmDialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={() => { setConfirmLeave(false); onBack(); }}
        title="Discard changes?"
        message="The page pattern has unsaved changes. Going back throws them away."
        confirmLabel="Discard"
        tone="destructive"
      />
      {dirty && (
        <div className={SAVEBAR} role="region" aria-label="Unsaved changes">
          <span className="tw:text-xs tw:text-[var(--bk-warning-text)]">Unsaved changes</span>
          <span className={SPACER} />
          <Button
            color="light"
            size="xs"
            className={GHOST}
            onClick={() => setPattern(collection.pageSlugPattern ?? "")}
          >
            Discard
          </Button>
          <Button
            color="light"
            size="xs"
            className={SAVE_LINK}
            disabled={saving}
            aria-busy={saving || undefined}
            onClick={() => {
              setSaving(true);
              void onSave(trimmed).finally(() => setSaving(false));
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ── Sources (151:46) ────────────────────────────────────────────────────── */

/** Board 151:46 draws a status LINE under the source name — a dot, then a
 *  state and a detail ("● Connected · synced 4m ago").
 *
 *  Its sample is a Google Sheets connection with a sync clock, and neither
 *  exists here: `DataSource` carries no connection state and no timestamp, and
 *  `DataManager.watch()` watches a local data PATH for in-editor updates, not a
 *  remote file for external ones. So the SHAPE is taken and the sample is not —
 *  the dot reports whether the source actually resolves to data, which is the
 *  one thing this panel can state truthfully. A green dot next to
 *  "synced 4m ago" would be a fiction the code cannot back. */
function sourceStatus(s: DataSource): { ok: boolean; label: string } {
  const d = s.data;
  if (Array.isArray(d)) return { ok: d.length > 0, label: `${s.type} · ${d.length} item${d.length === 1 ? "" : "s"}` };
  if (d && typeof d === "object") {
    const n = Object.keys(d as Record<string, unknown>).length;
    return { ok: n > 0, label: `${s.type} · ${n} key${n === 1 ? "" : "s"}` };
  }
  if (s.type === "api") return { ok: Boolean(s.endpoint), label: s.endpoint ? `api · ${s.endpoint}` : "api · no endpoint" };
  if (s.type === "function") return { ok: Boolean(s.getData), label: "function" };
  return { ok: false, label: `${s.type} · empty` };
}

export function SourcesView({
  sources,
  onBack,
  onImportJson,
  onRemoveSource,
}: {
  sources: DataSource[];
  onBack: () => void;
  onImportJson: (json: string) => string | null;
  /** Board 151:46 draws a `⋯` on every source row. `DataManager` has had
   *  `unregisterSource` all along and no UI ever called it, so a source could
   *  be added and never removed. */
  onRemoveSource?: (id: string) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [json, setJson] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Sources" onClick={onBack} />
      {/* Board 303:2083. Shown only when there is something to watch, and only
          because ContentTab now subscribes to DataManager's own events — the
          panel states this because it is true, not as decoration. */}
      {sources.length > 0 && (
        <div className="tw:px-3 tw:pb-1" data-testid="sources-watching">
          <span
            className="tw:inline-flex tw:items-center tw:gap-1.5 tw:rounded-full tw:px-2 tw:py-0.5 tw:text-xs"
            style={{ background: "var(--bk-success-tint)", color: "var(--bk-success)" }}
          >
            Watching for changes
          </span>
        </div>
      )}
      <div className={SCROLL}>
        {sources.map((s) => {
          const status = sourceStatus(s);
          return (
            <Row key={s.id} size="comment" data-source-row>
              <span className={ROW_STACK}>
                <span>{s.name}</span>
                <span className={`${SUB} tw:inline-flex tw:items-center tw:gap-1.5`}>
                  <span
                    aria-hidden="true"
                    className="tw:size-[7px] tw:flex-none tw:rounded-full"
                    style={{ background: status.ok ? "var(--bk-success)" : "var(--bk-ink-muted)" }}
                  />
                  {status.label}
                </span>
              </span>
              {onRemoveSource && (
                <span className={ROW_ACTIONS}>
                  <Popover
                    open={menuFor === s.id}
                    onClose={() => setMenuFor(null)}
                    placement="bottom-end"
                    label={`Actions for ${s.name}`}
                    trigger={
                      <IconButton label={`Actions for ${s.name}`} onClick={() => setMenuFor((p) => (p === s.id ? null : s.id))}>
                        ⋯
                      </IconButton>
                    }
                  >
                    <Menu>
                      <MenuItem
                        onClick={() => {
                          setMenuFor(null);
                          onRemoveSource(s.id);
                        }}
                      >
                        Remove source
                      </MenuItem>
                    </Menu>
                  </Popover>
                </span>
              )}
            </Row>
          );
        })}
        {/* Board 303:2067's pill words, which are the state's real name — the
            panel is not missing a list, there is nothing connected yet. */}
        {sources.length === 0 && !adding && <div className={`${SUB} tw:p-3`}>No data source connected</div>}
        {adding ? (
          <div className={INLINE_FORM}>
            <Textarea
              className="tw:bg-white tw:min-h-24 tw:resize-y tw:[font-family:var(--bk-font-mono)] tw:text-xs"
              placeholder='{"products": [{"name": "…"}]}'
              value={json}
              onChange={(e) => setJson(e.target.value)}
              aria-label="Source JSON"
              autoFocus
            />
            {error && <div className={ERROR_TEXT} role="alert">{error}</div>}
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => { setAdding(false); setError(null); }}>Cancel</Button>
              <Button
                size="xs"
                disabled={!json.trim()}
                onClick={() => {
                  const err = onImportJson(json);
                  if (err) setError(err);
                  else {
                    setAdding(false);
                    setJson("");
                    setError(null);
                  }
                }}
              >
                Add source
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button className={`${LINK_BTN} tw:mx-3 tw:my-2`} onClick={() => setAdding(true)}>
              + Connect a source
            </Button>
            {/* Board 151:46 prints this under the link, in flow. Pinned to the
                panel's foot with a rule above it, it read as a footer note on
                a different subject — 600px below the thing it explains. */}
            <div className={INLINE_HINT}>
              A source feeds a collection. Edits sync one way — from the source in.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Variables (151:62) ──────────────────────────────────────────────────── */

export function VariablesView({
  variables,
  onBack,
  onChange,
}: {
  variables: SiteVariable[];
  onBack: () => void;
  onChange: (vars: SiteVariable[]) => void;
}) {
  const [adding, setAdding] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [value, setValue] = React.useState("");
  const [editKey, setEditKey] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const keyError = key.trim() !== "" && !isValidVariableKey(key.trim());
  const dupError = variables.some((v) => v.key === key.trim());

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Variables" onClick={onBack} />
      <div className={SCROLL}>
        {/* Every other screen in this panel says what an empty list means —
            "No data source connected", "No records yet". Variables said
            nothing at all, so an empty Variables screen was one blue link on
            white with no clue what a variable is for. */}
        {variables.length === 0 && !adding && (
          /* This said a variable is reusable "in any text on any page", naming
             the {{site.*}} form. Nothing substitutes it: typed into a heading
             it renders literally on the canvas AND comes out literally in the
             exported HTML (walked live — the export carried the raw braces and
             no value). The store is localStorage keyed by project, so the
             publish worker cannot see it either, and the inspector's binding
             popover offers collections only. Until variables move into the
             project and something reads them, the screen says what is true. */
          <div className={`${SUB} tw:p-3`}>
            No variables yet. A variable is a value you write once and reuse in
            this panel — <span className={MONO}>{" {{site.name}} "}</span> is
            saved in this browser, and pages do not read it yet.
          </div>
        )}
        {variables.map((v) => (
          <Row key={v.key} size="comment" data-variable-row>
            <span className={ROW_STACK}>
              <span className={MONO}>{`{{site.${v.key}}}`}</span>
              {editKey === v.key ? (
                <TextInput
                  className="tw:mt-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  aria-label={`Value for ${v.key}`}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                      setEditKey(null);
                    }
                    if (e.key === "Escape") setEditKey(null);
                  }}
                />
              ) : (
                <span className={SUB}>{v.value || "—"}</span>
              )}
            </span>
            <span className={ROW_ACTIONS}>
              {editKey === v.key ? (
                <Button
                  color="light"
                  size="xs"
                  className={GHOST}
                  onClick={() => {
                    onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                    setEditKey(null);
                  }}
                >
                  Save
                </Button>
              ) : (
                /* Board 151:62 draws one `⋯` per row, not a pair of text
                   buttons. Two labelled actions on every row read as the row's
                   content and crowded the value out of a 320 column. */
                <Popover
                  open={menuFor === v.key}
                  onClose={() => setMenuFor(null)}
                  placement="bottom-end"
                  label={`Actions for ${v.key}`}
                  trigger={
                    <IconButton
                      label={`Actions for ${v.key}`}
                      onClick={() => setMenuFor((p) => (p === v.key ? null : v.key))}
                    >
                      ⋯
                    </IconButton>
                  }
                >
                  <Menu>
                    <MenuItem onClick={() => { setMenuFor(null); setEditKey(v.key); setEditValue(v.value); }}>
                      Edit value
                    </MenuItem>
                    <MenuItem onClick={() => { setMenuFor(null); onChange(variables.filter((x) => x.key !== v.key)); }}>
                      Delete variable
                    </MenuItem>
                  </Menu>
                </Popover>
              )}
            </span>
          </Row>
        ))}
        {adding ? (
          <div className={INLINE_FORM}>
            <TextInput
              placeholder="key (e.g. phone)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-label="Variable key"
              autoFocus
            />
            {(keyError || dupError) && (
              <div className={ERROR_TEXT} role="alert">
                {dupError ? "A variable with this key already exists." : "Keys are letters/digits/dashes, starting with a letter."}
              </div>
            )}
            <TextInput
              placeholder="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Variable value"
            />
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                size="xs"
                disabled={!key.trim() || keyError || dupError}
                onClick={() => {
                  onChange([...variables, { key: key.trim(), value }]);
                  setAdding(false);
                  setKey("");
                  setValue("");
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-3 tw:my-2`} onClick={() => setAdding(true)}>
            + New variable
          </Button>
        )}
      </div>
    </div>
  );
}

/* ── Conditions (151:87) ─────────────────────────────────────────────────── */

const OPERATORS: ConditionOperator[] = ["==", "!=", ">", "<", ">=", "<=", "contains", "exists", "empty"];

export function ConditionsView({
  conditions,
  onBack,
  onRemove,
  onSelectElement,
  onStartPick,
  pickedElementId,
  onCreate,
  onCancelPick,
}: {
  conditions: ConditionRow[];
  onBack: () => void;
  onRemove: (elementId: string) => void;
  onSelectElement: (elementId: string) => void;
  onStartPick: () => void;
  pickedElementId: string | null;
  onCreate: (expr: ConditionExpression) => void;
  onCancelPick: () => void;
}) {
  const [left, setLeft] = React.useState("");
  const [operator, setOperator] = React.useState<ConditionOperator>("==");
  const [right, setRight] = React.useState("");
  const needsRight = !["exists", "not_exists", "empty", "not_empty"].includes(operator);
  const [menuFor, setMenuFor] = React.useState<string | null>(null);

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Conditions" onClick={onBack} />
      <div className={SCROLL}>
        {conditions.map((c) => (
          <Row key={`${c.elementId}`} size="comment" data-condition-row>
            <span className={ROW_STACK}>
              <span className="tw:overflow-hidden tw:text-ellipsis tw:whitespace-nowrap">{c.label}</span>
              <span className={SUB}>{conditionSummary(c.binding)}</span>
            </span>
            <span className={ROW_ACTIONS}>
              {/* Board 151:87 draws `⋯`. */}
              <Popover
                open={menuFor === c.elementId}
                onClose={() => setMenuFor(null)}
                placement="bottom-end"
                label={`Actions for ${c.label}`}
                trigger={
                  <IconButton
                    label={`Actions for ${c.label}`}
                    onClick={() => setMenuFor((p) => (p === c.elementId ? null : c.elementId))}
                  >
                    ⋯
                  </IconButton>
                }
              >
                <Menu>
                  <MenuItem onClick={() => { setMenuFor(null); onSelectElement(c.elementId); }}>
                    Select element
                  </MenuItem>
                  <MenuItem onClick={() => { setMenuFor(null); onRemove(c.elementId); }}>
                    Remove condition
                  </MenuItem>
                </Menu>
              </Popover>
            </span>
          </Row>
        ))}
        {conditions.length === 0 && !pickedElementId && (
          <div className={`${SUB} tw:p-3`}>
            No conditions yet. A condition shows or hides an element based on data —
            &ldquo;+ New condition&rdquo; starts by picking the element on the canvas it
            controls.
          </div>
        )}
        {pickedElementId ? (
          <div className={INLINE_FORM} data-testid="condition-form">
            <div className={SUB}>Show the picked element when…</div>
            <TextInput
              placeholder="site.hours or menu.available"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              aria-label="Condition path"
              autoFocus
            />
            <div className={FORM_ROW}>
              <Select
                value={operator}
                onChange={(e) => setOperator(e.target.value as ConditionOperator)}
                aria-label="Operator"
              >
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
              {needsRight && (
                <div className={SPACER}>
                  <TextInput
                    placeholder="value"
                    value={right}
                    onChange={(e) => setRight(e.target.value)}
                    aria-label="Condition value"
                  />
                </div>
              )}
            </div>
            <div className={FORM_ROW}>
              <span className={SPACER} />
              <Button color="light" size="xs" className={GHOST} onClick={onCancelPick}>Cancel</Button>
              <Button
                size="xs"
                disabled={!left.trim() || (needsRight && !right.trim())}
                onClick={() =>
                  onCreate({
                    operator,
                    left: left.trim(),
                    ...(needsRight ? { right: right.trim() } : {}),
                  })
                }
              >
                Add condition
              </Button>
            </div>
          </div>
        ) : (
          <Button className={`${LINK_BTN} tw:mx-3 tw:my-2`} onClick={onStartPick}>
            + New condition
          </Button>
        )}
      </div>

    </div>
  );
}
