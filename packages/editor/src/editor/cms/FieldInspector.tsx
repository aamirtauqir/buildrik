/**
 * FieldInspector — the Fields tab's right column with a field selected
 * (6103:52202): FIELD (Name · Type · Key · Required), VALIDATION, USED BY,
 * the binding note, Open affected record, Delete field, Back to Fields.
 *
 * Key and Type are locked while something is bound to the field — the note
 * under USED BY says why. A key change moves every record's value with it
 * (CollectionManager.updateField). Per-type validation editing is G3-071
 * part 2; the rule is summarised here until then.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { X } from "lucide-react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem, CMSField, CMSFieldType, CMSFieldValidation } from "@/shared/types/cms";
import { Button, Chip, IconButton, Select, TextInput } from "@/editor/chrome-ui";
import { cmsWorkspace } from "./cmsWorkspaceStore";
import { FIELD_TYPES, FIELD_TYPE_LABEL } from "./fieldTypes";
import type { FieldUse } from "./fieldUsage";
import { DeleteFieldDialog } from "./DeleteFieldDialog";
import { SECTION } from "./paneStyles";

const ASIDE =
  "tw:flex tw:w-[var(--bk-size-inspector)] tw:flex-none tw:flex-col tw:border-l tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)]";
/* 6103:52202: an 88px label column, controls 28 tall on a 32 pitch. */
const ROW = "tw:grid tw:grid-cols-[88px_1fr] tw:items-center tw:gap-2";
const ROW_LABEL = "tw:text-right tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
const CONTROL =
  "tw:[&_input]:h-7 tw:[&_input]:py-0 tw:[&_input]:pl-2 tw:[&_input]:text-[12px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_select]:h-7 tw:[&_select]:py-0 tw:[&_select]:pl-2 tw:[&_select]:text-[12px] tw:[&_select]:rounded-[6px]";
const TEXT = "tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]";
const NOTE = "tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";
const KEY_RE = /^[a-z][a-z0-9_-]*$/;
/** The header glyph before the field name ("# Price"). */
const TYPE_GLYPH: Record<string, string> = { number: "#", text: "T", textarea: "¶", richtext: "¶", image: "▣", boolean: "◐", date: "▦", reference: "↗", slug: "/" };

function ruleSummary(v: CMSFieldValidation | undefined): string {
  if (!v) return "None";
  const parts: string[] = [];
  if (v.min !== undefined) parts.push(`Min ${v.min}`);
  if (v.max !== undefined) parts.push(`Max ${v.max}`);
  if (v.minLength !== undefined) parts.push(`At least ${v.minLength} characters`);
  if (v.maxLength !== undefined) parts.push(`At most ${v.maxLength} characters`);
  if (v.pattern) parts.push(v.patternMessage || `Matches ${v.pattern}`);
  return parts.length ? parts.join(" · ") : "None";
}

export interface FieldInspectorProps {
  composer: Composer | null;
  collection: CMSCollection;
  field: CMSField;
  records: CMSContentItem[];
  uses: FieldUse[];
  onClose: () => void;
  onDeleteField: (fieldId: string) => Promise<void>;
  onOpenUse: (elementId: string) => void;
}

export function FieldInspector({ composer, collection, field, records, uses, onClose, onDeleteField, onOpenUse }: FieldInspectorProps) {
  const [name, setName] = React.useState(field.name);
  const [key, setKey] = React.useState(field.slug);
  const [deleting, setDeleting] = React.useState(false);
  React.useEffect(() => setName(field.name), [field.id, field.name]);
  React.useEffect(() => setKey(field.slug), [field.id, field.slug]);

  const bound = uses.length > 0;
  const nextKey = key.trim();
  const keyError =
    nextKey === field.slug
      ? null
      : !KEY_RE.test(nextKey)
        ? "Keys start with a letter: lowercase letters, digits, - and _."
        : collection.fields.some((f) => f.id !== field.id && f.slug === nextKey)
          ? `${collection.name} already has the key ${nextKey}.`
          : null;
  const affected = records.find((r) => r.data[field.slug] != null && r.data[field.slug] !== "");
  /* The addable types, plus whatever this field already is. */
  const types = (FIELD_TYPES as readonly string[]).includes(field.type) ? FIELD_TYPES : [...FIELD_TYPES, field.type];

  const update = (updates: Partial<Omit<CMSField, "id">>) => {
    if (composer) void composer.cms.collections.updateField(collection.id, field.id, updates);
  };
  const commitName = () => {
    const next = name.trim();
    if (!next) setName(field.name);
    else if (next !== field.name) update({ name: next });
  };
  const commitKey = () => {
    if (keyError) return;
    if (nextKey !== field.slug) update({ slug: nextKey });
  };

  return (
    <aside className={ASIDE} data-testid="cms-field-inspector">
      <header className="tw:flex tw:h-11 tw:flex-none tw:items-center tw:gap-2 tw:px-4">
        <h3 className="tw:m-0 tw:flex-1 tw:truncate tw:text-[14px] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="cms-field-inspector-title">
          <span className="tw:mr-1 tw:text-[var(--bk-ink-soft)]" aria-hidden="true">{TYPE_GLYPH[field.type] ?? "•"}</span>
          {field.name}
        </h3>
        <IconButton label="Close field settings" size="sm" onClick={onClose} data-testid="cms-field-inspector-close">
          <X size={16} />
        </IconButton>
      </header>
      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-1 tw:overflow-y-auto tw:px-4 tw:pb-3">
        <h4 className={`${SECTION} tw:mb-2 tw:mt-2`}>Field</h4>
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-fi-name">Name</label>
          <TextInput
            id="cms-fi-name"
            sizing="sm"
            className={CONTROL}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => e.key === "Enter" && commitName()}
            data-testid="cms-fi-name"
          />
        </div>
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-fi-type">Type</label>
          <Select
            id="cms-fi-type"
            sizing="sm"
            className={CONTROL}
            value={field.type}
            disabled={bound}
            onChange={(e) => update({ type: e.target.value as CMSFieldType })}
            data-testid="cms-fi-type"
          >
            {types.map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABEL[t] ?? t}</option>
            ))}
          </Select>
        </div>
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-fi-key">Key</label>
          <TextInput
            id="cms-fi-key"
            sizing="sm"
            className={`${CONTROL} tw:[&_input]:[font-family:var(--bk-font-mono)]`}
            value={key}
            disabled={bound}
            onChange={(e) => setKey(e.target.value)}
            onBlur={commitKey}
            onKeyDown={(e) => e.key === "Enter" && commitKey()}
            data-testid="cms-fi-key"
          />
        </div>
        {keyError ? (
          <p className="tw:m-0 tw:pl-[96px] tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-fi-key-error">
            {keyError}
          </p>
        ) : null}
        <div className={ROW}>
          <span className={ROW_LABEL}>Required</span>
          <span className="tw:flex tw:gap-1" role="group" aria-label="Required">
            <Chip label="Yes" selected={Boolean(field.validation?.required)} onClick={() => update({ validation: { ...field.validation, required: true } })} data-testid="cms-fi-required-yes" />
            <Chip label="No" selected={!field.validation?.required} onClick={() => update({ validation: { ...field.validation, required: false } })} data-testid="cms-fi-required-no" />
          </span>
        </div>

        <h4 className={`${SECTION} tw:mb-2 tw:mt-3`}>Validation</h4>
        <div className={ROW}>
          <span className={ROW_LABEL}>Rule</span>
          <p className={TEXT} data-testid="cms-fi-rule">{ruleSummary(field.validation)}</p>
        </div>

        <h4 className={`${SECTION} tw:mb-2 tw:mt-3`}>Used by</h4>
        {bound ? (
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-2 tw:p-0" data-testid="cms-fi-uses">
            {uses.map((u, i) => (
              <li key={`${u.label}-${i}`} className={TEXT}>{u.label}</li>
            ))}
          </ul>
        ) : (
          <p className={`${TEXT} tw:text-[var(--bk-ink-muted)]`} data-testid="cms-fi-uses-none">Nothing is bound to this field.</p>
        )}
        <p className={`${NOTE} tw:mt-2`}>Field keys and types with active bindings must be kept to protect the existing template.</p>
        <div className="tw:mt-3 tw:flex tw:flex-col tw:items-start tw:gap-2">
          {affected ? (
            <Button
              size="xs"
              color="light"
              className="tw:h-7 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[12px]"
              onClick={() => cmsWorkspace.openRecord(affected.id)}
              data-testid="cms-fi-open-record"
            >
              Open affected record
            </Button>
          ) : null}
          <Button size="xs" variant="danger" className="tw:h-7 tw:px-3 tw:text-[12px]" onClick={() => setDeleting(true)} data-testid="cms-fi-delete">
            Delete field
          </Button>
        </div>
      </div>
      <footer className="tw:flex tw:h-12 tw:flex-none tw:items-center tw:border-t tw:border-[var(--bk-border)] tw:px-4">
        <Button size="xs" color="light" className="tw:h-7 tw:border-transparent tw:bg-transparent tw:px-2 tw:text-[12px]" onClick={onClose} data-testid="cms-fi-back">
          Back to Fields
        </Button>
      </footer>
      {deleting ? (
        <DeleteFieldDialog
          collection={collection}
          field={field}
          uses={uses}
          onClose={() => setDeleting(false)}
          onDelete={() => {
            setDeleting(false);
            void onDeleteField(field.id);
          }}
          onOpenUse={onOpenUse}
        />
      ) : null}
    </aside>
  );
}
