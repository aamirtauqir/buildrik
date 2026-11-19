/**
 * FieldInspector — the Fields tab's right column with a field selected
 * (2L9 B5-C11 165:2917): the field's name as the heading, then Display name,
 * Key and Type stacked over filled controls, "Key and type are locked
 * because this field is used." with "Show N usages", Required, Placeholder,
 * Help text and one "Save field".
 *
 * Edits wait for Save field (the board's explicit save). A type change over
 * stored values goes through its own preview (TypeChangeDialog); turning
 * Required on over empty published records asks first (RequiredImpactDialog).
 * Beyond the board, kept from the code: a reference's collection, an option
 * field's options, the default value, the type's min/max rules, the usage
 * list behind "Show N usages", Open affected record and Delete field.
 *
 * FG-043 (owner 2026-10-10, kept 2026-11-19): a Date field's fold adds Format
 * (short / long / ISO — its presentation config, how it reads on a page) and
 * Earliest / Latest (inclusive days, its validation). They wait for Save field
 * like the rest; an earliest after the latest is refused by the shared
 * `cmsFieldValidationSchema`, which the server applies too.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection, CMSContentItem, CMSField, CMSFieldType } from "@/shared/types/cms";
import { Button, Checkbox, Select, TextInput } from "@/editor/chrome-ui";
import { cmsWorkspace } from "./cmsWorkspaceStore";
import { FIELD_RULES, FIELD_TYPES, FIELD_TYPE_LABEL, TYPED_VALUE_TYPES, fieldKeyError, parseDefault, type FieldRuleKey } from "./fieldTypes";
import type { FieldUse } from "./fieldUsage";
import { DeleteFieldDialog } from "./DeleteFieldDialog";
import { RequiredImpactDialog } from "./RequiredImpactDialog";
import { TypeChangeDialog, type TypeChangeMode } from "./TypeChangeDialog";
import { CMS_DATE_FORMATS, cmsFieldValidationSchema, formatCmsDate, isEmptyCmsValue, type CmsDateFormat } from "@buildrik/shared/schemas/cms";
import { OptionsEditor } from "./OptionsEditor";

/* 165:2917 — a 320 column on 16 gutters. */
const ASIDE =
  "tw:flex tw:w-[320px] tw:flex-none tw:flex-col tw:bg-[var(--bk-bg-panel)]";
const STACK = "tw:flex tw:flex-col tw:gap-2";
const LABEL = "tw:text-[12px] tw:leading-[18px] tw:font-medium tw:text-[var(--bk-ink)]";
const CONTROL =
  "tw:[&_input]:h-7 tw:[&_input]:py-0 tw:[&_input]:pl-2.5 tw:[&_input]:text-[12px] tw:[&_input]:rounded-[6px] " +
  "tw:[&_input]:bg-[var(--bk-bg-subtle)] tw:[&_input]:border-transparent " +
  "tw:[&_select]:h-7 tw:[&_select]:py-0 tw:[&_select]:pl-2.5 tw:[&_select]:text-[12px] tw:[&_select]:rounded-[6px] " +
  "tw:[&_select]:bg-[var(--bk-bg-subtle)] tw:[&_select]:border-transparent";
const NOTE = "tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export interface FieldInspectorProps {
  composer: Composer | null;
  collection: CMSCollection;
  /** Every collection — a reference field's target. */
  collections: CMSCollection[];
  field: CMSField;
  records: CMSContentItem[];
  uses: FieldUse[];
  /** Escape steps out of the field. */
  onClose: () => void;
  onDeleteField: (fieldId: string) => Promise<void>;
  onOpenUse: (elementId: string) => void;
  /** Required's "Set a default value" (257:53846): saves the default, fills
   *  the empty published records, turns Required on; resolves with the count. */
  onSetDefault: (field: CMSField, value: unknown) => Promise<number>;
  /** A type change over stored values (257:51318): converts or clears them. */
  onChangeType: (field: CMSField, to: CMSFieldType, mode: TypeChangeMode) => Promise<void>;
}

const text = (v: unknown) => (v === undefined || v === null ? "" : String(v));

/** FG-043: Format's choices, each with how a sample day reads. */
const SAMPLE_DAY = "2026-10-03";
const DATE_FORMAT_LABEL: Record<CmsDateFormat, string> = {
  short: `Short · ${formatCmsDate(SAMPLE_DAY, "short")}`,
  long: `Long · ${formatCmsDate(SAMPLE_DAY, "long")}`,
  iso: `ISO · ${formatCmsDate(SAMPLE_DAY, "iso")}`,
};
/** No format: the value reads as stored. */
const AS_ENTERED: CmsDateFormat | "" = "";
const isDateType = (type: CMSFieldType) => type === "date" || type === "datetime";

export function FieldInspector({ composer, collection, collections, field, records, uses, onClose, onDeleteField, onOpenUse, onSetDefault, onChangeType }: FieldInspectorProps) {
  const [askingRequired, setAskingRequired] = React.useState(false);
  const [retyping, setRetyping] = React.useState<CMSFieldType | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [showUses, setShowUses] = React.useState(false);
  const [showMore, setShowMore] = React.useState(false);
  const holdsValues = records.some((r) => !isEmptyCmsValue(r.data[field.slug]));
  const emptyPublished = records.filter((r) => r.status === "published" && isEmptyCmsValue(r.data[field.slug])).length;

  /* The draft Save field commits, reset whenever another field (or a saved
     version of this one) comes in. */
  const initial = React.useMemo(
    () => ({
      name: field.name,
      key: field.slug,
      required: Boolean(field.validation?.required),
      placeholder: field.placeholder ?? "",
      helpText: field.helpText ?? "",
      defaultValue: text(field.defaultValue),
      rules: Object.fromEntries((FIELD_RULES[field.type] ?? []).map((r) => [r.key, text(field.validation?.[r.key])])) as Partial<Record<FieldRuleKey, string>>,
      dateFormat: field.presentation?.dateFormat ?? AS_ENTERED,
      minDate: field.validation?.minDate ?? "",
      maxDate: field.validation?.maxDate ?? "",
    }),
    [field],
  );
  const [draft, setDraft] = React.useState(initial);
  React.useEffect(() => setDraft(initial), [initial]);
  const set = <K extends keyof typeof initial>(k: K, v: (typeof initial)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const bound = uses.length > 0;
  const nextName = draft.name.trim();
  const nextKey = draft.key.trim();
  const keyError =
    nextKey === field.slug
      ? null
      : collection.fields.some((f) => f.id !== field.id && f.slug === nextKey)
        ? `${collection.name} already has the key ${nextKey}.`
        : fieldKeyError(nextKey, new Set());
  const rules = Object.fromEntries(
    Object.entries(draft.rules).map(([k, v]) => [k, v && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined]),
  ) as Partial<Record<FieldRuleKey, number>>;
  const isDate = isDateType(field.type);
  const dateBounds = { minDate: draft.minDate || undefined, maxDate: draft.maxDate || undefined };
  const boundsCheck = isDate ? cmsFieldValidationSchema.safeParse(dateBounds) : null;
  const boundsError = boundsCheck && !boundsCheck.success ? (boundsCheck.error.issues[0]?.message ?? "Check Earliest and Latest.") : null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const canSave = dirty && nextName !== "" && !keyError && !boundsError;
  const affected = records.find((r) => !isEmptyCmsValue(r.data[field.slug]));
  /* The addable types, plus whatever this field already is. */
  const types = (FIELD_TYPES as readonly string[]).includes(field.type) ? FIELD_TYPES : [...FIELD_TYPES, field.type];

  /* C-6: a refused change used to be dropped by `void`; it now says so. */
  const [saveFailed, setSaveFailed] = React.useState(false);
  React.useEffect(() => setSaveFailed(false), [field.id]);
  const update = (updates: Partial<Omit<CMSField, "id">>) => {
    if (!composer) return;
    setSaveFailed(false);
    composer.cms.collections
      .updateField(collection.id, field.id, updates)
      .then((saved) => setSaveFailed(saved === null))
      .catch(() => setSaveFailed(true));
  };
  const changes = (required: boolean): Partial<Omit<CMSField, "id">> => ({
    ...(nextName !== field.name ? { name: nextName } : {}),
    ...(nextKey !== field.slug ? { slug: nextKey } : {}),
    placeholder: draft.placeholder.trim() || undefined,
    helpText: draft.helpText.trim() || undefined,
    defaultValue: parseDefault(field.type, draft.defaultValue),
    validation: { ...field.validation, ...rules, ...(isDate ? dateBounds : {}), required },
    ...(isDate ? { presentation: { ...field.presentation, dateFormat: draft.dateFormat || undefined } } : {}),
  });
  const save = () => {
    if (!canSave) return;
    /* 257:53654 — published records that leave it empty are named first. */
    if (draft.required && !field.validation?.required && emptyPublished > 0) {
      setAskingRequired(true);
      return;
    }
    update(changes(draft.required));
  };

  if (showUses) {
    /* 165:3173 — "{field} · N usages", one row per use, "‹ Back to field". */
    return (
      <aside className={ASIDE} data-testid="cms-field-inspector">
        <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-3 tw:overflow-y-auto tw:px-4 tw:pb-4 tw:pt-2.5">
          <h3 className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]">
            {field.name} · {uses.length} usage{uses.length === 1 ? "" : "s"}
          </h3>
          <ul className="tw:m-0 tw:flex tw:list-none tw:flex-col tw:gap-1.5 tw:p-0" data-testid="cms-fi-uses">
            {uses.map((u, i) => (
              <li key={`${u.label}-${i}`}>
                {u.elementId ? (
                  <Button size="xs" variant="ghost" className="tw:h-8 tw:w-full tw:justify-center tw:px-3 tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)]" onClick={() => onOpenUse(u.elementId!)}>
                    {u.label}
                  </Button>
                ) : (
                  <span className="tw:flex tw:h-8 tw:items-center tw:justify-center tw:px-3 tw:text-[13px] tw:text-[var(--bk-ink)]">{u.label}</span>
                )}
              </li>
            ))}
          </ul>
          {/* 165:3173: usages as centred lines, the way back centred under them. */}
          <Button size="xs" variant="link" className="tw:h-8 tw:self-center tw:p-0 tw:text-[13px] tw:font-normal" onClick={() => setShowUses(false)} data-testid="cms-fi-back-to-field">
            ‹ Back to field
          </Button>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={ASIDE}
      data-testid="cms-field-inspector"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:flex-col tw:gap-3.5 tw:overflow-y-auto tw:px-4 tw:pb-4 tw:pt-2.5">
        <h3 className="tw:m-0 tw:truncate tw:text-[13px] tw:leading-5 tw:font-semibold tw:text-[var(--bk-ink)]" data-testid="cms-field-inspector-title">
          {field.name}
        </h3>
        <div className={STACK}>
          <label className={LABEL} htmlFor="cms-fi-name">Display name</label>
          <TextInput id="cms-fi-name" sizing="sm" className={CONTROL} value={draft.name} onChange={(e) => set("name", e.target.value)} data-testid="cms-fi-name" />
        </div>
        <div className={STACK}>
          <label className={LABEL} htmlFor="cms-fi-key">Key</label>
          <TextInput
            id="cms-fi-key"
            sizing="sm"
            className={`${CONTROL} tw:[&_input]:[font-family:var(--bk-font-mono)]`}
            value={draft.key}
            disabled={bound}
            onChange={(e) => set("key", e.target.value)}
            data-testid="cms-fi-key"
          />
          {keyError ? (
            <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-fi-key-error">
              {keyError}
            </p>
          ) : null}
        </div>
        <div className={STACK}>
          <label className={LABEL} htmlFor="cms-fi-type">Type</label>
          <Select
            id="cms-fi-type"
            sizing="sm"
            className={CONTROL}
            value={field.type}
            disabled={bound}
            onChange={(e) => {
              const to = e.target.value as CMSFieldType;
              /* 257:51318 — stored values are previewed before the type moves. */
              if (holdsValues) setRetyping(to);
              else update({ type: to });
            }}
            data-testid="cms-fi-type"
          >
            {types.map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABEL[t] ?? t}</option>
            ))}
          </Select>
          {bound ? (
            <p className={NOTE} data-testid="cms-fi-locked">Key and type are locked because this field is used.</p>
          ) : null}
        </div>
        {field.type === "reference" ? (
          <div className={STACK}>
            <label className={LABEL} htmlFor="cms-fi-collection">Collection</label>
            <Select
              id="cms-fi-collection"
              sizing="sm"
              className={CONTROL}
              value={field.referenceCollection ?? ""}
              disabled={bound}
              onChange={(e) => update({ referenceCollection: e.target.value || undefined })}
              data-testid="cms-fi-collection"
            >
              <option value="">Choose a collection…</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        ) : null}
        {field.type === "multiselect" || field.type === "select" ? (
          <div className={STACK}>
            <span className={LABEL}>Options</span>
            <OptionsEditor id="cms-fi-options" options={field.options ?? []} onChange={(next) => update({ options: next })} multiple={field.type === "multiselect"} />
          </div>
        ) : null}
        {bound ? (
          <div className="tw:flex tw:justify-center tw:py-2">
            <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px] tw:font-medium" onClick={() => setShowUses(true)} data-testid="cms-fi-show-uses">
              Show {uses.length} usage{uses.length === 1 ? "" : "s"}
            </Button>
          </div>
        ) : null}
        <label className="tw:flex tw:items-center tw:gap-2 tw:py-1 tw:pl-3 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink)]">
          <Checkbox checked={draft.required} onChange={(e) => set("required", e.target.checked)} data-testid="cms-fi-required" />
          Required
        </label>
        {TYPED_VALUE_TYPES.has(field.type) ? (
          <div className={STACK}>
            <label className={LABEL} htmlFor="cms-fi-placeholder">Placeholder</label>
            <TextInput id="cms-fi-placeholder" sizing="sm" className={CONTROL} value={draft.placeholder} onChange={(e) => set("placeholder", e.target.value)} data-testid="cms-fi-placeholder" />
          </div>
        ) : null}
        <div className={STACK}>
          <label className={LABEL} htmlFor="cms-fi-help">Help text</label>
          <TextInput id="cms-fi-help" sizing="sm" className={CONTROL} value={draft.helpText} onChange={(e) => set("helpText", e.target.value)} data-testid="cms-fi-help" />
        </div>
        <Button className="tw:h-8 tw:w-full tw:text-[13px] tw:font-medium" disabled={!canSave} onClick={save} data-testid="cms-fi-save">
          Save field
        </Button>
        {saveFailed ? (
          <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-fi-save-error">
            Could not save that change to {field.name}. Try again.
          </p>
        ) : null}
        {/* Beyond the board: the default and the type's rules, folded under
            Save field so the board's column reads as drawn. */}
        {TYPED_VALUE_TYPES.has(field.type) || (FIELD_RULES[field.type] ?? []).length > 0 ? (
          <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:self-start tw:p-0 tw:text-[12px] tw:font-medium" aria-expanded={showMore} onClick={() => setShowMore((v) => !v)} data-testid="cms-fi-more">
            {isDate
              ? showMore ? "Hide format, default and rules" : "Format, default and rules ›"
              : showMore ? "Hide default and rules" : "Default and rules ›"}
          </Button>
        ) : null}
        {showMore ? (
          <>
            {isDate ? (
              <div className={STACK}>
                <label className={LABEL} htmlFor="cms-fi-date-format">Format</label>
                <Select
                  id="cms-fi-date-format"
                  sizing="sm"
                  className={CONTROL}
                  value={draft.dateFormat}
                  onChange={(e) => set("dateFormat", CMS_DATE_FORMATS.find((f) => f === e.target.value) ?? "")}
                  data-testid="cms-fi-date-format"
                >
                  <option value="">As entered</option>
                  {CMS_DATE_FORMATS.map((f) => (
                    <option key={f} value={f}>{DATE_FORMAT_LABEL[f]}</option>
                  ))}
                </Select>
              </div>
            ) : null}
            {TYPED_VALUE_TYPES.has(field.type) ? (
              <div className={STACK}>
                <label className={LABEL} htmlFor="cms-fi-default">Default value</label>
                <TextInput id="cms-fi-default" sizing="sm" className={CONTROL} value={draft.defaultValue} onChange={(e) => set("defaultValue", e.target.value)} data-testid="cms-fi-default" />
              </div>
            ) : null}
            {(FIELD_RULES[field.type] ?? []).map((r) => (
              <div key={r.key} className={STACK}>
                <label className={LABEL} htmlFor={`cms-fi-rule-${r.key}`}>{r.label}</label>
                <TextInput
                  id={`cms-fi-rule-${r.key}`}
                  sizing="sm"
                  type="number"
                  placeholder="None"
                  className={CONTROL}
                  value={draft.rules[r.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, rules: { ...d.rules, [r.key]: e.target.value } }))}
                  data-testid={`cms-fi-rule-${r.key}`}
                />
              </div>
            ))}
            {isDate ? (
              <>
                {(
                  [
                    ["minDate", "Earliest", "cms-fi-date-min"],
                    ["maxDate", "Latest", "cms-fi-date-max"],
                  ] as const
                ).map(([key, label, id]) => (
                  <div key={key} className={STACK}>
                    <label className={LABEL} htmlFor={id}>{label}</label>
                    <TextInput id={id} sizing="sm" type="date" className={CONTROL} value={draft[key]} onChange={(e) => set(key, e.target.value)} data-testid={id} />
                  </div>
                ))}
                {boundsError ? (
                  <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-fi-date-error">
                    {boundsError}
                  </p>
                ) : null}
                <p className={NOTE}>Both days are inclusive. Leave empty for no limit.</p>
              </>
            ) : null}
          </>
        ) : null}
        <div className="tw:flex tw:items-center tw:justify-between tw:gap-2">
          {affected ? (
            <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px] tw:font-normal" onClick={() => cmsWorkspace.openRecord(affected.id)} data-testid="cms-fi-open-record">
              Open affected record
            </Button>
          ) : (
            <span />
          )}
          <Button size="xs" variant="link" className="tw:h-auto tw:min-h-0 tw:p-0 tw:text-[12px] tw:font-normal tw:text-[var(--bk-error-text)]" onClick={() => setDeleting(true)} data-testid="cms-fi-delete">
            Delete field…
          </Button>
        </div>
      </div>
      {retyping ? (
        <TypeChangeDialog
          collection={collection}
          field={field}
          to={retyping}
          records={records}
          onClose={() => setRetyping(null)}
          onApply={(mode) => onChangeType(field, retyping, mode)}
          usedBy={uses.length}
        />
      ) : null}
      {askingRequired ? (
        <RequiredImpactDialog
          field={field}
          emptyCount={emptyPublished}
          onClose={() => setAskingRequired(false)}
          onMakeRequired={() => update(changes(true))}
          onSetDefault={(value) => {
            const saved = changes(false);
            update(saved);
            return onSetDefault({ ...field, ...saved } as CMSField, value);
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteFieldDialog
          collection={collection}
          field={field}
          uses={uses}
          onClose={() => setDeleting(false)}
          onDelete={() => onDeleteField(field.id)}
          onOpenUse={onOpenUse}
          siteName={composer?.getProjectMetadata?.()?.name || "Untitled site"}
          valueCount={records.filter((r) => !isEmptyCmsValue(r.data[field.slug])).length}
        />
      ) : null}
    </aside>
  );
}
