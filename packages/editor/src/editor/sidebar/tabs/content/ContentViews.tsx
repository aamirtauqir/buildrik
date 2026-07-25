/**
 * ContentViews — the drill-in views of the Content panel, matched to the
 * Figma boards: root 148:2, empty 149:7, collection 149:50, record 149:84,
 * unsaved-record 149:108, fields 151:2, sources 151:46, variables 151:62,
 * conditions 151:87. Pure presentation + callbacks; state lives in
 * useContentPanel.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Checkbox, Input, Select, Switch, Textarea } from "@/editor/shared/vibcoder";
import { ConfirmDialog } from "@/shared/extensions/ConfirmDialog";
import type { CMSCollection, CMSContentItem, CMSField } from "@/shared/types/cms";
import type { ConditionExpression, ConditionOperator, DataSource } from "@/shared/types/data";
import { conditionSummary, fieldDefault, isValidVariableKey, type SiteVariable } from "./contentPanelUtils";
import type { ConditionRow } from "./useContentPanel";

export const S: Record<string, React.CSSProperties> = {
  body: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  scroll: { flex: 1, minHeight: 0, overflowY: "auto" },
  crumb: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    margin: "10px 12px 2px",
    background: "none",
    border: "none",
    padding: 0,
    fontSize: 13,
    color: "var(--bd-accent)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 12px",
    background: "var(--bd-bg-panel)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
    color: "var(--bd-fg-muted)",
  },
  row: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "9px 12px",
    background: "none",
    border: "none",
    borderBottom: "1px solid var(--bd-border)",
    cursor: "pointer",
    textAlign: "left" as const,
    fontFamily: "inherit",
    fontSize: 13,
    color: "var(--bd-fg-primary)",
  },
  rowMeta: { marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--bd-fg-muted)", flexShrink: 0 },
  chev: { color: "var(--bd-fg-muted)", fontSize: 12 },
  addLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    margin: "8px 12px",
    background: "none",
    border: "none",
    padding: 0,
    fontSize: 13,
    color: "var(--bd-accent)",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  label: { fontSize: 12, color: "var(--bd-fg-muted)", margin: "10px 12px 4px" },
  input: {
    display: "block",
    width: "calc(100% - 24px)",
    margin: "0 12px",
    padding: "7px 9px",
    fontSize: 13,
    border: "1px solid var(--bd-border-input, var(--bd-border))",
    borderRadius: "var(--bd-radius-md)",
    background: "var(--bd-bg-card)",
    color: "var(--bd-fg-primary)",
    fontFamily: "inherit",
  },
  toggleRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px" },
  savebar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderTop: "1px solid var(--bd-border)",
    background: "var(--bd-bg-panel)",
  },
  hint: { fontSize: 12, color: "var(--bd-fg-muted)", lineHeight: 1.5, padding: "10px 12px", borderTop: "1px solid var(--bd-border)" },
  mono: { fontFamily: "var(--buildrick-font-mono, monospace)", fontSize: 12, color: "var(--bd-accent-text, var(--bd-accent))" },
  sub: { fontSize: 12, color: "var(--bd-fg-muted)", marginTop: 2 },
  center: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    textAlign: "center" as const,
    color: "var(--bd-fg-muted)",
    fontSize: 13,
    lineHeight: 1.5,
  },
  inlineForm: { display: "flex", flexDirection: "column", gap: 8, padding: 12, borderBottom: "1px solid var(--bd-border)" },
  formRow: { display: "flex", gap: 8, alignItems: "center" },
  select: {
    padding: "6px 8px",
    fontSize: 13,
    border: "1px solid var(--bd-border-input, var(--bd-border))",
    borderRadius: "var(--bd-radius-md)",
    background: "var(--bd-bg-card)",
    color: "var(--bd-fg-primary)",
    fontFamily: "inherit",
  },
};

function statusDot(published: boolean): React.CSSProperties {
  return {
    width: 8,
    height: 8,
    borderRadius: "var(--bd-radius-full)",
    background: published ? "var(--bd-success)" : "var(--bd-fg-muted)",
    flexShrink: 0,
  };
}

function Crumb({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button style={S.crumb} onClick={onClick} aria-label={`Back to ${label}`}>
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
      <div style={S.center} data-testid="content-empty">
        <div>Collections turn a spreadsheet into pages — one page per row, updated when the data changes.</div>
        {onCreateCollection && (
          <Button variant="primary" size="sm" onClick={onCreateCollection}>
            Create a collection
          </Button>
        )}
      </div>
    );
  }
  return (
    <div style={S.scroll}>
      <div style={S.sectionHead}>
        <span>Collections</span>
        <span>{collections.length}</span>
      </div>
      {collections.map((c) => (
        <Button key={c.id} style={S.row} onClick={() => onOpenCollection(c.id)}>
          <span>{c.name}</span>
          <span style={S.rowMeta}>
            {recordCounts[c.id] ?? "—"} <span style={S.chev}>›</span>
          </span>
        </Button>
      ))}
      {onCreateCollection && (
        <Button style={S.addLink} onClick={onCreateCollection}>
          + New collection
        </Button>
      )}
      <div style={S.sectionHead}>
        <span>Data</span>
      </div>
      <Button style={S.row} onClick={onOpenSources}>
        <span>Sources</span>
        <span style={S.rowMeta}>
          {sourcesCount} <span style={S.chev}>›</span>
        </span>
      </Button>
      <Button style={S.row} onClick={onOpenVariables}>
        <span>Variables</span>
        <span style={S.rowMeta}>
          {variablesCount} <span style={S.chev}>›</span>
        </span>
      </Button>
      <Button style={S.row} onClick={onOpenConditions}>
        <span>Conditions</span>
        <span style={S.rowMeta}>
          {conditionsCount} <span style={S.chev}>›</span>
        </span>
      </Button>
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
    <div style={S.body}>
      <Crumb label={collection.name} onClick={onBack} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 12px 8px" }}>
        <span style={{ fontSize: 12, color: "var(--bd-fg-muted)" }}>
          {records.length} record{records.length === 1 ? "" : "s"}
        </span>
        <Button style={{ ...S.addLink, margin: 0 }} onClick={onAddRecord}>
          + Add
        </Button>
      </div>
      <div style={S.scroll}>
        {records.map((r) => (
          <Button key={r.id} style={S.row} onClick={() => onOpenRecord(r.id)} data-record-row>
            <span style={statusDot(r.status === "published")} aria-hidden="true" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recordName(r)}</span>
            <span style={S.rowMeta}>
              <span style={S.chev}>›</span>
            </span>
          </Button>
        ))}
        {records.length === 0 && <div style={{ ...S.sub, padding: 12 }}>No records yet — add the first one.</div>}
      </div>
      <div>
        <Button style={{ ...S.row, borderTop: "1px solid var(--bd-border)" }} onClick={onOpenFields}>
          <span>Fields</span>
          <span style={S.rowMeta}>
            {collection.fields.length} <span style={S.chev}>›</span>
          </span>
        </Button>
        {onOpenDynamicPages && (
          <Button style={S.row} onClick={onOpenDynamicPages}>
            <span>Dynamic pages</span>
            <span style={S.rowMeta}>
              <span style={S.chev}>›</span>
            </span>
          </Button>
        )}
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
    <div style={S.body}>
      <Crumb label={title} onClick={onBack} />
      <div style={S.scroll}>
        {collection.fields.map((f) => (
          <div key={f.id}>
            {f.type === "boolean" ? (
              <div style={S.toggleRow}>
                <span style={{ fontSize: 13 }}>{f.name}</span>
                <Switch
                  checked={Boolean(data[f.slug])}
                  aria-label={f.name}
                  onClick={() => setField(f.slug, !data[f.slug])}
                />
              </div>
            ) : (
              <>
                <div style={S.label}>{f.name}</div>
                {f.type === "textarea" || f.type === "richtext" ? (
                  <Textarea
                    style={{ ...S.input, minHeight: 64, resize: "vertical" }}
                    value={String(data[f.slug] ?? "")}
                    onChange={(e) => setField(f.slug, e.target.value)}
                    aria-label={f.name}
                  />
                ) : (
                  <Input
                    style={S.input}
                    type={f.type === "number" ? "number" : "text"}
                    value={String(data[f.slug] ?? "")}
                    onChange={(e) => setField(f.slug, f.type === "number" ? Number(e.target.value) : e.target.value)}
                    aria-label={f.name}
                  />
                )}
              </>
            )}
          </div>
        ))}
        <div style={S.toggleRow}>
          <span style={{ fontSize: 13 }}>Published</span>
          <Switch checked={published} aria-label="Published" onClick={() => setPublished((v) => !v)} />
        </div>
        {record && onDelete && (
          <Button style={{ ...S.addLink, color: "var(--bd-error)" }} onClick={onDelete}>
            Delete record
          </Button>
        )}
      </div>
      {(dirty || !record) && (
        <div style={S.savebar} role="region" aria-label="Unsaved changes">
          <span style={{ fontSize: 12, color: "var(--bd-warn-strong)" }}>Unsaved changes</span>
          <span style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" onClick={() => { setData(initial); setPublished(record?.status === "published"); }}>
            Discard
          </Button>
          <Button
            variant="primary"
            size="sm"
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
    <div style={S.body}>
      <Crumb label={`${collection.name} · fields`} onClick={onBack} />
      <div style={S.scroll}>
        {collection.fields.map((f) => (
          <div key={f.id} style={{ ...S.row, cursor: "default" }} data-field-row>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span>{f.name}</span>
              <span style={S.sub}>{f.type}</span>
            </span>
            <span style={S.rowMeta}>
              {f.validation?.required && <span style={{ color: "var(--bd-fg-muted)" }}>required</span>}
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete field ${f.name}`}
                onClick={() => setConfirmDelete(f)}
              >
                ✕
              </Button>
            </span>
          </div>
        ))}
        {adding ? (
          <div style={S.inlineForm}>
            <Input
              style={{ ...S.input, margin: 0, width: "auto" }}
              placeholder="Field name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Field name"
              autoFocus
            />
            <div style={S.formRow}>
              <Select style={S.select} value={type} onChange={(e) => setType(e.target.value)} aria-label="Field type">
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <Checkbox
                label="required"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
              />
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
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
          <Button style={S.addLink} onClick={() => setAdding(true)}>
            + Add field
          </Button>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmDelete != null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void onDeleteField(confirmDelete.id);
          setConfirmDelete(null);
        }}
        title="Delete field?"
        message={`"${confirmDelete?.name}" and its values on every record will be removed.`}
        confirmText="Delete field"
        variant="danger"
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
    <div style={S.body}>
      <Crumb label="Sources" onClick={onBack} />
      <div style={S.scroll}>
        {sources.map((s) => (
          <div key={s.id} style={{ ...S.row, cursor: "default" }} data-source-row>
            <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span>{s.name}</span>
              <span style={S.sub}>{s.type}</span>
            </span>
          </div>
        ))}
        {sources.length === 0 && !adding && (
          <div style={{ ...S.sub, padding: 12 }}>No data sources yet.</div>
        )}
        {adding ? (
          <div style={S.inlineForm}>
            <Textarea
              style={{ ...S.input, margin: 0, width: "auto", minHeight: 96, resize: "vertical", fontFamily: "var(--buildrick-font-mono, monospace)", fontSize: 12 }}
              placeholder='{"products": [{"name": "…"}]}'
              value={json}
              onChange={(e) => setJson(e.target.value)}
              aria-label="Source JSON"
              autoFocus
            />
            {error && <div style={{ fontSize: 12, color: "var(--bd-error)" }} role="alert">{error}</div>}
            <div style={S.formRow}>
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={() => { setAdding(false); setError(null); }}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
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
          <Button style={S.addLink} onClick={() => setAdding(true)}>
            + Add a source (JSON)
          </Button>
        )}
      </div>
      <div style={S.hint}>A source feeds a collection. Edits sync one way — from the source in.</div>
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
    <div style={S.body}>
      <Crumb label="Variables" onClick={onBack} />
      <div style={S.scroll}>
        {variables.map((v) => (
          <div key={v.key} style={{ ...S.row, cursor: "default", alignItems: "flex-start" }} data-variable-row>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
              <span style={S.mono}>{`{{site.${v.key}}}`}</span>
              {editKey === v.key ? (
                <Input
                  style={{ ...S.input, margin: "4px 0 0", width: "auto" }}
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
                <span style={S.sub}>{v.value || "—"}</span>
              )}
            </span>
            <span style={S.rowMeta}>
              {editKey === v.key ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onChange(variables.map((x) => (x.key === v.key ? { ...x, value: editValue } : x)));
                    setEditKey(null);
                  }}
                >
                  Save
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" aria-label={`Edit ${v.key}`} onClick={() => { setEditKey(v.key); setEditValue(v.value); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Delete ${v.key}`} onClick={() => onChange(variables.filter((x) => x.key !== v.key))}>
                    ✕
                  </Button>
                </>
              )}
            </span>
          </div>
        ))}
        {adding ? (
          <div style={S.inlineForm}>
            <Input
              style={{ ...S.input, margin: 0, width: "auto" }}
              placeholder="key (e.g. phone)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              aria-label="Variable key"
              autoFocus
            />
            {(keyError || dupError) && (
              <div style={{ fontSize: 12, color: "var(--bd-error)" }} role="alert">
                {dupError ? "A variable with this key already exists." : "Keys are letters/digits/dashes, starting with a letter."}
              </div>
            )}
            <Input
              style={{ ...S.input, margin: 0, width: "auto" }}
              placeholder="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-label="Variable value"
            />
            <div style={S.formRow}>
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
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
          <Button style={S.addLink} onClick={() => setAdding(true)}>
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
    <div style={S.body}>
      <Crumb label="Conditions" onClick={onBack} />
      <div style={S.scroll}>
        {conditions.map((c) => (
          <div key={`${c.elementId}`} style={{ ...S.row, cursor: "default", alignItems: "flex-start" }} data-condition-row>
            <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</span>
              <span style={S.sub}>{conditionSummary(c.binding)}</span>
            </span>
            <span style={S.rowMeta}>
              <Button variant="ghost" size="sm" onClick={() => onSelectElement(c.elementId)}>
                Select
              </Button>
              <Button variant="ghost" size="sm" aria-label="Remove condition" onClick={() => onRemove(c.elementId)}>
                ✕
              </Button>
            </span>
          </div>
        ))}
        {conditions.length === 0 && !pickedElementId && (
          <div style={{ ...S.sub, padding: 12 }}>
            No conditions yet. A condition shows or hides an element based on data.
          </div>
        )}
        {pickedElementId ? (
          <div style={S.inlineForm} data-testid="condition-form">
            <div style={{ fontSize: 12, color: "var(--bd-fg-muted)" }}>Show the picked element when…</div>
            <Input
              style={{ ...S.input, margin: 0, width: "auto" }}
              placeholder="site.hours or menu.available"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
              aria-label="Condition path"
              autoFocus
            />
            <div style={S.formRow}>
              <Select
                style={S.select}
                value={operator}
                onChange={(e) => setOperator(e.target.value as ConditionOperator)}
                aria-label="Operator"
              >
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </Select>
              {needsRight && (
                <Input
                  style={{ ...S.input, margin: 0, width: "auto", flex: 1 }}
                  placeholder="value"
                  value={right}
                  onChange={(e) => setRight(e.target.value)}
                  aria-label="Condition value"
                />
              )}
            </div>
            <div style={S.formRow}>
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" onClick={onCancelPick}>Cancel</Button>
              <Button
                variant="primary"
                size="sm"
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
          <Button style={S.addLink} onClick={onStartPick}>
            + New condition
          </Button>
        )}
      </div>
      {!pickedElementId && (
        <div style={S.hint}>"+ New condition" starts by picking the element on the canvas it controls.</div>
      )}
    </div>
  );
}
