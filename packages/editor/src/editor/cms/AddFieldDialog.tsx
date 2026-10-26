/**
 * AddFieldDialog — the two steps of + Add field:
 *  1. "Add field" (2L9 167:3871) — every type the schema stores;
 *  2. "Add <type> field · <collection> · New field" (167:4135…) — Name, Key,
 *     Required, and for a reference the collection it points at, for an
 *     option type its options; "Existing records keep empty values until
 *     edited." Save reads Saving… (167:8474); a refused save keeps the
 *     settings and offers Retry (167:8747).
 * A key the collection already has stops at "Field key already exists"
 * (4418:164225), which offers a free one.
 *
 * Then the field's settings (167:4135): Default value, the type's
 * minimum / maximum, Placeholder and Help text — the same ones the field
 * inspector edits later.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSField, CMSFieldType } from "@/shared/types/cms";
import { Button, Chip, Modal, Select, TextInput } from "@/editor/chrome-ui";
import { FIELD_RULES, FIELD_TYPES, FIELD_TYPE_LABEL, OPTION_TYPES, TYPED_VALUE_TYPES, fieldKeyError, fieldKeyFrom, freeKey, parseDefault, type FieldRuleKey } from "./fieldTypes";
import { cmsValueError } from "@buildrik/shared/schemas/cms";
import { OptionsEditor } from "./OptionsEditor";

const ROW = "tw:grid tw:grid-cols-[88px_1fr] tw:items-center tw:gap-2";
const ROW_LABEL = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
/* 4418:164225 / :164230 — body copy is 14/20 ink, the dialog's own text size
   (measured: "Existing records keep empty values until edited." is 315px). */
const NOTE = "tw:m-0 tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]";
const TYPE_ROW =
  "tw:h-11 tw:w-full tw:justify-start tw:rounded-[6px] tw:border-0 tw:bg-transparent tw:px-3 tw:text-[13px] tw:font-medium " +
  "tw:text-[var(--bk-gray-700)] tw:enabled:hover:bg-[var(--bk-gray-50)] tw:focus:ring-0";


export function AddFieldDialog({
  collection,
  collections,
  onClose,
  onAdd,
}: {
  collection: CMSCollection;
  /** Every collection — a reference field's target. */
  collections: CMSCollection[];
  onClose: () => void;
  onAdd: (field: Omit<CMSField, "id" | "order">) => Promise<void>;
}) {
  const [type, setType] = React.useState<CMSFieldType | null>(null);
  const [name, setName] = React.useState("");
  const [key, setKey] = React.useState<string | null>(null);
  const [required, setRequired] = React.useState(false);
  const [target, setTarget] = React.useState(collection.id);
  const [options, setOptions] = React.useState<string[]>([]);
  const [clash, setClash] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  const [defaultRaw, setDefaultRaw] = React.useState("");
  const [rules, setRules] = React.useState<Partial<Record<FieldRuleKey, string>>>({});
  const [placeholder, setPlaceholder] = React.useState("");
  const [helpText, setHelpText] = React.useState("");

  const taken = React.useMemo(() => new Set(collection.fields.map((f) => f.slug)), [collection.fields]);
  const nextName = name.trim();
  /* The key follows the name until it is edited by hand. */
  const nextKey = (key ?? fieldKeyFrom(nextName)).trim();
  /* The clash has its own dialog (4418:164225); format and reserved names
     read under the key. */
  const keyError = nextKey ? fieldKeyError(nextKey, new Set()) : null;
  const label = type ? FIELD_TYPE_LABEL[type] : "";
  const ruleValues = Object.fromEntries(
    Object.entries(rules).flatMap(([k, v]) => (v && v.trim() !== "" && Number.isFinite(Number(v)) ? [[k, Number(v)]] : [])),
  ) as Partial<Record<FieldRuleKey, number>>;
  const validation = { ...(required ? { required: true } : {}), ...ruleValues };
  const defaultValue = type ? parseDefault(type, defaultRaw) : undefined;
  /* A default has to pass the field's own rules, or every new record starts
     out unpublishable. */
  const defaultError =
    type && defaultValue !== undefined ? cmsValueError({ name: "Default value", slug: nextKey, type, validation }, defaultValue) : null;

  const save = async () => {
    if (!type || !nextName || !nextKey || keyError || defaultError || busy) return;
    if (taken.has(nextKey)) {
      setClash(nextKey);
      return;
    }
    setBusy(true);
    setFailed(false);
    try {
      await onAdd({
        name: nextName,
        slug: nextKey,
        type,
        ...(Object.keys(validation).length ? { validation } : {}),
        ...(defaultValue !== undefined ? { defaultValue } : {}),
        ...(placeholder.trim() ? { placeholder: placeholder.trim() } : {}),
        ...(helpText.trim() ? { helpText: helpText.trim() } : {}),
        ...(type === "reference" ? { referenceCollection: target } : {}),
        ...(OPTION_TYPES.has(type) ? { options } : {}),
      });
      onClose();
    } catch {
      /* 167:8747 — the dialog stays with everything typed into it. */
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (clash) {
    const suggestion = freeKey(fieldKeyFrom(nextName) === clash ? clash : fieldKeyFrom(nextName) || clash, taken);
    return (
      <Modal
        open
        onClose={() => setClash(null)}
        title="Field key already exists"
        testId="cms-add-field-clash"
        footer={
          <>
            {/* 4418:164225 — two text buttons, no primary. */}
            <Button variant="ghost" onClick={() => setClash(null)} data-testid="cms-add-field-clash-cancel">
              Cancel
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setKey(suggestion);
                setClash(null);
              }}
              data-testid="cms-add-field-clash-use"
            >
              Use {suggestion}
            </Button>
          </>
        }
      >
        <p className={NOTE}>The key {clash} is already used. Existing records are unchanged. Choose a unique key.</p>
      </Modal>
    );
  }

  if (!type) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Add field"
        kind="form"
        testId="cms-add-field"
        footer={
          <Button variant="ghost" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
        }
      >
        {/* 4418:164208 draws the prompt as body copy (14 ink), not a muted subtitle. */}
        <p className="tw:m-0 tw:mb-2">Choose the kind of content this field stores.</p>
        <div className="tw:flex tw:flex-col" data-testid="cms-add-field-types">
          {FIELD_TYPES.map((t) => (
            <Button key={t} color="light" size="xs" className={TYPE_ROW} onClick={() => setType(t)} data-testid={`cms-add-field-type-${t}`}>
              {FIELD_TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${label.toLowerCase()} field`}
      subtitle={`${collection.name} · New field`}
      kind="form"
      dirty={nextName !== ""}
      testId="cms-add-field"
      footer={
        <>
          {/* 4418:164230 — both ways out are text buttons, right-aligned beside Save. */}
          <Button variant="ghost" onClick={() => setType(null)} data-testid="cms-add-field-back">
            Back to field types
          </Button>
          <Button variant="ghost" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
          <Button disabled={!nextName || !nextKey || Boolean(keyError) || Boolean(defaultError) || busy} onClick={() => void save()} data-testid="cms-add-field-save">
            {busy ? "Saving…" : failed ? "Retry" : "Add field"}
          </Button>
        </>
      }
    >
      <div className="tw:flex tw:flex-col tw:gap-2">
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-add-field-name">Name</label>
          <TextInput
            id="cms-add-field-name"
            sizing="sm"
            autoFocus
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void save()}
            data-testid="cms-add-field-name"
          />
        </div>
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-add-field-key">Key</label>
          <TextInput
            id="cms-add-field-key"
            sizing="sm"
            autoComplete="off"
            className="tw:[&_input]:[font-family:var(--bk-font-mono)]"
            value={nextKey}
            onChange={(e) => setKey(e.target.value)}
            data-testid="cms-add-field-key"
          />
        </div>
        {keyError ? (
          <p className="tw:m-0 tw:pl-[96px] tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-add-field-key-error">
            {keyError}
          </p>
        ) : (
          <p className="tw:m-0 tw:pl-[96px] tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="cms-add-field-key-hint">
            Used in bindings and patterns. Must be unique in {collection.name}.
          </p>
        )}
        <div className={ROW}>
          <span className={ROW_LABEL}>Required</span>
          <span className="tw:flex tw:gap-1" role="group" aria-label="Required">
            <Chip label="Yes" selected={required} onClick={() => setRequired(true)} data-testid="cms-add-field-required-yes" />
            <Chip label="No" selected={!required} onClick={() => setRequired(false)} data-testid="cms-add-field-required-no" />
          </span>
        </div>
        {type === "reference" ? (
          <div className={ROW}>
            <label className={ROW_LABEL} htmlFor="cms-add-field-collection">Collection</label>
            <Select id="cms-add-field-collection" sizing="sm" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="cms-add-field-collection">
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        ) : null}
        {OPTION_TYPES.has(type) ? (
          <div className={`${ROW} tw:items-start`}>
            <label className={`${ROW_LABEL} tw:pt-1.5`} htmlFor="cms-add-field-options">Options</label>
            <OptionsEditor id="cms-add-field-options" options={options} onChange={setOptions} live />
          </div>
        ) : null}
        {TYPED_VALUE_TYPES.has(type) ? (
          <div className={ROW}>
            <label className={ROW_LABEL} htmlFor="cms-add-field-default">Default value</label>
            <TextInput id="cms-add-field-default" sizing="sm" autoComplete="off" value={defaultRaw} onChange={(e) => setDefaultRaw(e.target.value)} data-testid="cms-add-field-default" />
          </div>
        ) : null}
        {defaultError ? (
          <p className="tw:m-0 tw:pl-[96px] tw:text-[11px] tw:leading-4 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-add-field-default-error">
            {defaultError}
          </p>
        ) : null}
        {(FIELD_RULES[type] ?? []).map((r) => (
          <div key={r.key} className={ROW}>
            <label className={ROW_LABEL} htmlFor={`cms-add-field-rule-${r.key}`}>{r.label}</label>
            <TextInput
              id={`cms-add-field-rule-${r.key}`}
              sizing="sm"
              type="number"
              placeholder="None"
              value={rules[r.key] ?? ""}
              onChange={(e) => setRules((p) => ({ ...p, [r.key]: e.target.value }))}
              data-testid={`cms-add-field-rule-${r.key}`}
            />
          </div>
        ))}
        {TYPED_VALUE_TYPES.has(type) ? (
          <div className={ROW}>
            <label className={ROW_LABEL} htmlFor="cms-add-field-placeholder">Placeholder</label>
            <TextInput id="cms-add-field-placeholder" sizing="sm" autoComplete="off" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} data-testid="cms-add-field-placeholder" />
          </div>
        ) : null}
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-add-field-help">Help text</label>
          <TextInput id="cms-add-field-help" sizing="sm" autoComplete="off" value={helpText} onChange={(e) => setHelpText(e.target.value)} data-testid="cms-add-field-help" />
        </div>
        <p className={`${NOTE} tw:mt-2`}>Existing records keep empty values until edited.</p>
        {failed ? (
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-add-field-failed">
            Couldn’t save. Your field settings are still here.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
