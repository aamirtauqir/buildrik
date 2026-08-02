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
  ListRow,
  RecordRow,
  Row,
  SectionHeader,
  Select,
  Textarea,
  TextInput,
  ToggleSwitch,
} from "@/editor/chrome-ui";
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
const LINK_BTN =
  "tw:inline-flex tw:items-center tw:gap-1.5 tw:bg-transparent tw:border-0 tw:p-0 " +
  "tw:text-[13px] tw:text-blue-700 tw:hover:text-blue-800 tw:enabled:hover:bg-transparent";
/** The quiet row-action button, previously copy-pasted at eleven call sites. */
const GHOST = "tw:border-transparent tw:bg-transparent tw:text-gray-600 tw:hover:text-gray-900";
const FIELD_LABEL = "tw:text-xs tw:text-gray-500 tw:mx-3 tw:mt-2.5 tw:mb-1";
/** Inputs sit in a padded wrapper rather than carrying their own margin, so
 *  the field keeps the TextInput/Select wrapper theme untouched. */
const FIELD_WRAP = "tw:px-3";
const TOGGLE_ROW = "tw:flex tw:items-center tw:justify-between tw:p-3";
const SAVEBAR = "tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-2.5 tw:border-t tw:border-gray-200 tw:bg-gray-50";
const HINT = "tw:text-xs tw:text-gray-500 tw:leading-normal tw:px-3 tw:py-2.5 tw:border-t tw:border-gray-200";
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
    <Button className={`${LINK_BTN} tw:mx-3 tw:mt-2.5 tw:mb-0.5`} onClick={onClick} aria-label={`Back to ${label}`}>
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
      <EmptyState
        className="tw:flex-1"
        data-testid="content-empty"
        body="Collections turn a spreadsheet into pages — one page per row, updated when the data changes."
        action={
          onCreateCollection ? (
            <Button size="xs" onClick={onCreateCollection}>
              Create a collection
            </Button>
          ) : undefined
        }
      />
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
  React.useEffect(() => {
    setData(initial);
    setPublished(record?.status === "published");
  }, [initial, record]);

  const dirty =
    JSON.stringify(data) !== JSON.stringify(initial) || published !== (record?.status === "published");
  const display = collection.displayField ?? collection.fields[0]?.slug;
  const title =
    (record && typeof record.data[display ?? ""] === "string" && (record.data[display ?? ""] as string)) ||
    (record ? `Record ${record.id.slice(-4)}` : "New record");

  const setField = (slug: string, value: unknown) => setData((d) => ({ ...d, [slug]: value }));

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={title} onClick={onBack} />
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
            size="xs"
            disabled={saving}
            onClick={() => {
              setSaving(true);
              void onSave(data, published).finally(() => setSaving(false));
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

  return (
    <div className={CONTENT_BODY}>
      <Crumb label={`${collection.name} · fields`} onClick={onBack} />
      <div className={SCROLL}>
        {collection.fields.map((f) => (
          <Row key={f.id} size="comment" data-field-row>
            <span className={ROW_STACK}>
              <span>{f.name}</span>
              <span className={SUB}>{f.type}</span>
            </span>
            <span className={ROW_ACTIONS}>
              {f.validation?.required && <span className={SUB}>required</span>}
              <Button
                color="light"
                size="xs"
                className={GHOST}
                aria-label={`Delete field ${f.name}`}
                onClick={() => setConfirmDelete(f)}
              >
                ✕
              </Button>
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
                  <option key={t} value={t}>{t}</option>
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
        destructive
      />
    </div>
  );
}

/* ── Sources (151:46) ────────────────────────────────────────────────────── */

export function SourcesView({
  sources,
  onBack,
  onImportJson,
}: {
  sources: DataSource[];
  onBack: () => void;
  onImportJson: (json: string) => string | null;
}) {
  const [adding, setAdding] = React.useState(false);
  const [json, setJson] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Sources" onClick={onBack} />
      <div className={SCROLL}>
        {sources.map((s) => (
          <Row key={s.id} size="comment" data-source-row>
            <span className={ROW_STACK}>
              <span>{s.name}</span>
              <span className={SUB}>{s.type}</span>
            </span>
          </Row>
        ))}
        {sources.length === 0 && !adding && <div className={`${SUB} tw:p-3`}>No data sources yet.</div>}
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
          <Button className={`${LINK_BTN} tw:mx-3 tw:my-2`} onClick={() => setAdding(true)}>
            + Add a source (JSON)
          </Button>
        )}
      </div>
      <div className={HINT}>A source feeds a collection. Edits sync one way — from the source in.</div>
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
  const keyError = key.trim() !== "" && !isValidVariableKey(key.trim());
  const dupError = variables.some((v) => v.key === key.trim());

  return (
    <div className={CONTENT_BODY}>
      <Crumb label="Variables" onClick={onBack} />
      <div className={SCROLL}>
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
                <>
                  <Button
                    color="light"
                    size="xs"
                    className={GHOST}
                    aria-label={`Edit ${v.key}`}
                    onClick={() => { setEditKey(v.key); setEditValue(v.value); }}
                  >
                    Edit
                  </Button>
                  <Button
                    color="light"
                    size="xs"
                    className={GHOST}
                    aria-label={`Delete ${v.key}`}
                    onClick={() => onChange(variables.filter((x) => x.key !== v.key))}
                  >
                    ✕
                  </Button>
                </>
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
              <Button color="light" size="xs" className={GHOST} onClick={() => onSelectElement(c.elementId)}>
                Select
              </Button>
              <Button
                color="light"
                size="xs"
                className={GHOST}
                aria-label="Remove condition"
                onClick={() => onRemove(c.elementId)}
              >
                ✕
              </Button>
            </span>
          </Row>
        ))}
        {conditions.length === 0 && !pickedElementId && (
          <div className={`${SUB} tw:p-3`}>
            No conditions yet. A condition shows or hides an element based on data.
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
      {!pickedElementId && (
        <div className={HINT}>"+ New condition" starts by picking the element on the canvas it controls.</div>
      )}
    </div>
  );
}
