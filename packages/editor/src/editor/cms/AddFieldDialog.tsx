/**
 * AddFieldDialog — the two steps of + Add field:
 *  1. "Add field" (2L9 167:3871) — every type the schema stores;
 *  2. "Add <type> field · <collection> · New field" (167:4135…) — Name, Key,
 *     Type (changes in place), Required, and for a reference the collection
 *     it points at, for an option type its options. Save reads Saving…
 *     (167:8474); a refused save keeps the settings and offers Retry
 *     (167:8747).
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
import { Button, Checkbox, Modal, Select, TextInput } from "@/editor/chrome-ui";
import { FIELD_RULES, FIELD_TYPES, FIELD_TYPE_LABEL, OPTION_TYPES, TYPED_VALUE_TYPES, fieldKeyError, fieldKeyFrom, freeKey, parseDefault, type FieldRuleKey } from "./fieldTypes";
import { cmsValueError } from "@buildrik/shared/schemas/cms";
import { OptionsEditor } from "./OptionsEditor";
import type { OpenMediaLibrary } from "./RecordFieldControl";
import type { MediaAssetType } from "@/shared/types/media";
import { useAssetPick } from "@/editor/sidebar/tabs/media/data/assetPick";

/* 2L9 167:4135…167:8207: the label OVER its field, 13/20 medium ink; the
   field filled grey with no rule; 12/18 muted hints under it. */
const ROW = "tw:flex tw:flex-col tw:gap-1.5";
const ROW_LABEL = "tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";
const FILLED = "tw:[&_input]:border-transparent tw:[&_input]:bg-[var(--bk-bg-subtle)] tw:[&_select]:border-transparent tw:[&_select]:bg-[var(--bk-bg-subtle)]";
const HINT = "tw:m-0 tw:text-[12px] tw:leading-[18px]";
/* 4418:164225 / :164230 — body copy is 14/20 ink, the dialog's own text size
   (measured: "Existing records keep empty values until edited." is 315px). */
const NOTE = "tw:m-0 tw:text-[14px] tw:leading-5 tw:text-[var(--bk-ink)]";
/* 2L9 167:4135…167:8207, type by type: which take a default here, which
   show their limits here (the field inspector still edits every rule a type
   has), and the line under the default. */
/* 167:7406 / 167:7671: an image or file field's default is an asset from
   the library, of the kinds the field takes. */
const ASSET_TYPES: Partial<Record<CMSFieldType, { allowed: MediaAssetType[]; hint: string }>> = {
  image: { allowed: ["image"], hint: "Images only." },
  file: { allowed: ["image", "video", "font"], hint: "Allowed uploads: images, video and fonts. PDFs are not supported." },
};
const DEFAULTABLE: ReadonlySet<CMSFieldType> = new Set([...TYPED_VALUE_TYPES, "richtext", "boolean"]);
const ADD_RULE_TYPES: ReadonlySet<CMSFieldType> = new Set(["text", "textarea", "number"]);
function defaultHint(type: CMSFieldType, raw: string): string | null {
  switch (type) {
    case "email":
      return "Default and record values must be valid email addresses.";
    case "url":
      return "Use a complete supported URL. Invalid values remain visible for correction.";
    case "slug":
      return "Use lowercase letters, numbers and hyphens. URL uniqueness is checked in Dynamic pages.";
    case "number":
      return "Empty limits are unset; they do not mean zero.";
    case "date":
    case "datetime":
      return raw.trim() ? null : "No default is set.";
    default:
      return null;
  }
}

/* 167:3871: a two-column grid of outlined tiles, 30 tall, 13 regular, left. */
const TYPE_ROW =
  "tw:h-[30px] tw:w-full tw:justify-start tw:rounded-[var(--bk-radius-sm)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:px-1.5 " +
  "tw:text-[13px] tw:font-normal tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0";


export function AddFieldDialog({
  collection,
  collections,
  onClose,
  onAdd,
  onOpenMediaLibrary,
}: {
  collection: CMSCollection;
  /** Every collection — a reference field's target. */
  collections: CMSCollection[];
  onClose: () => void;
  onAdd: (field: Omit<CMSField, "id" | "order">) => Promise<void>;
  /** The media library's pick — an image / file field's default asset
   *  (167:7406 / 167:7671). Absent: no default asset is offered. */
  onOpenMediaLibrary?: OpenMediaLibrary;
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
  /* The default asset is the asset's own src — what a record's image or file
     value stores (RecordFieldControl). While the library is picking, this
     dialog steps aside so the drawer can be used; it returns when the pick
     lands or is cancelled. */
  const [assetSrc, setAssetSrc] = React.useState("");
  const [picking, setPicking] = React.useState(false);
  const pickPending = useAssetPick();
  React.useEffect(() => {
    if (picking && !pickPending) setPicking(false);
  }, [picking, pickPending]);

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
  const defaultValue = type && ASSET_TYPES[type] ? assetSrc || undefined : type ? parseDefault(type, defaultRaw) : undefined;
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

  if (picking) return null;

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
        width="lg"
        testId="cms-add-field"
        footer={
          <Button variant="secondary" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
        }
      >
        {/* 4418:164208 draws the prompt as body copy (14 ink), not a muted subtitle. */}
        <p className="tw:m-0 tw:mb-2">Choose the kind of content this field stores.</p>
        <div className="tw:grid tw:grid-cols-2 tw:gap-x-3 tw:gap-y-2" data-testid="cms-add-field-types">
          {FIELD_TYPES.map((t) => (
            <Button key={t} color="light" size="xs" className={TYPE_ROW} onClick={() => setType(t)} data-testid={`cms-add-field-type-${t}`}>
              {FIELD_TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
      </Modal>
    );
  }

  const ruleRows = (ADD_RULE_TYPES.has(type) ? FIELD_RULES[type] ?? [] : []).map((r) => (
    <div key={r.key} className={ROW}>
      <label className={ROW_LABEL} htmlFor={`cms-add-field-rule-${r.key}`}>{r.label}</label>
      <TextInput
        id={`cms-add-field-rule-${r.key}`}
        sizing="sm"
        type="number"
        value={rules[r.key] ?? ""}
        onChange={(e) => setRules((p) => ({ ...p, [r.key]: e.target.value }))}
        data-testid={`cms-add-field-rule-${r.key}`}
      />
    </div>
  ));

  return (
    <Modal
      open
      onClose={onClose}
      title={`Add ${label.toLowerCase()} field`}
      subtitle={`${collection.name} · New field`}
      kind="form"
      width="lg"
      dirty={nextName !== ""}
      testId="cms-add-field"
      footer={
        <>
          {/* 2L9 167:4135: Cancel and Add field; the type changes in place
              (the Type select), so there is no step back. */}
          <Button variant="secondary" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
          <Button disabled={!nextName || !nextKey || Boolean(keyError) || Boolean(defaultError) || busy} onClick={() => void save()} data-testid="cms-add-field-save">
            {busy ? "Saving…" : failed ? "Retry" : "Add field"}
          </Button>
        </>
      }
    >
      <div className={`tw:flex tw:flex-col tw:gap-3 ${FILLED}`}>
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
            value={nextKey}
            onChange={(e) => setKey(e.target.value)}
            data-testid="cms-add-field-key"
          />
        </div>
        {keyError ? (
          <p className={`${HINT} tw:-mt-2 tw:text-[var(--bk-error-text)]`} role="alert" data-testid="cms-add-field-key-error">
            {keyError}
          </p>
        ) : (
          <p className={`${HINT} tw:-mt-2 tw:text-[var(--bk-ink-muted)]`} data-testid="cms-add-field-key-hint">
            Used in bindings and patterns. Must be unique in {collection.name}.
          </p>
        )}
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-add-field-type">Type</label>
          <Select
            id="cms-add-field-type"
            sizing="sm"
            value={type}
            onChange={(e) => {
              /* A rule, default or option list belongs to the type it was
                 typed for; a new type starts from its own. */
              setType(e.target.value as CMSFieldType);
              setRules({});
              setDefaultRaw("");
              setOptions([]);
            }}
            data-testid="cms-add-field-type"
          >
            {FIELD_TYPES.map((t) => (
              <option key={t} value={t}>{FIELD_TYPE_LABEL[t]}</option>
            ))}
          </Select>
        </div>
        <label className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
          <Checkbox checked={required} onChange={(e) => setRequired(e.currentTarget.checked)} data-testid="cms-add-field-required" />
          Required
        </label>
        {type === "reference" ? (
          <div className={ROW}>
            <label className={ROW_LABEL} htmlFor="cms-add-field-collection">Collection</label>
            <Select id="cms-add-field-collection" sizing="sm" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="cms-add-field-collection">
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <p className={`${HINT} tw:text-[var(--bk-ink-muted)]`}>One record per value. Multi-reference fields are not available.</p>
          </div>
        ) : null}
        {OPTION_TYPES.has(type) ? (
          <div className={ROW}>
            <span className={ROW_LABEL}>Options</span>
            <OptionsEditor id="cms-add-field-options" options={options} onChange={setOptions} live multiple={type === "multiselect"} />
          </div>
        ) : null}
        {type === "number" ? ruleRows : null}
        {DEFAULTABLE.has(type) ? (
          <div className={ROW}>
            <label className={ROW_LABEL} htmlFor="cms-add-field-default">Default value</label>
            {type === "boolean" ? (
              <Select id="cms-add-field-default" sizing="sm" value={defaultRaw === "true" ? "true" : ""} onChange={(e) => setDefaultRaw(e.target.value)} data-testid="cms-add-field-default">
                <option value="">No</option>
                <option value="true">Yes</option>
              </Select>
            ) : (
              <TextInput
                id="cms-add-field-default"
                sizing="sm"
                autoComplete="off"
                type={type === "date" ? "date" : type === "datetime" ? "datetime-local" : "text"}
                value={defaultRaw}
                onChange={(e) => setDefaultRaw(e.target.value)}
                data-testid="cms-add-field-default"
              />
            )}
          </div>
        ) : null}
        {defaultError ? (
          <p className={`${HINT} tw:-mt-2 tw:text-[var(--bk-error-text)]`} role="alert" data-testid="cms-add-field-default-error">
            {defaultError}
          </p>
        ) : defaultHint(type, defaultRaw) ? (
          <p className={`${HINT} tw:-mt-2 tw:text-[var(--bk-ink-muted)]`} data-testid="cms-add-field-default-hint">
            {defaultHint(type, defaultRaw)}
          </p>
        ) : null}
        {type === "number" ? null : ruleRows}
        {ASSET_TYPES[type] && onOpenMediaLibrary ? (
          <div className={ROW} data-testid="cms-add-field-asset">
            {assetSrc ? (
              <span className="tw:flex tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
                <span className="tw:min-w-0 tw:flex-1 tw:truncate" data-testid="cms-add-field-asset-name">{assetSrc.split("/").pop()}</span>
                <Button variant="ghost" size="xs" onClick={() => setAssetSrc("")} data-testid="cms-add-field-asset-remove">
                  Remove
                </Button>
              </span>
            ) : null}
            <Button
              variant="secondary"
              size="sm"
              className="tw:h-8 tw:w-[228px] tw:font-normal"
              data-testid="cms-add-field-asset-choose"
              onClick={() => {
                const t = ASSET_TYPES[type]!;
                setPicking(true);
                onOpenMediaLibrary(t.allowed, (asset) => {
                  setAssetSrc(asset.src);
                  setPicking(false);
                }, `${nextName || label} · default`);
              }}
            >
              Choose default asset…
            </Button>
            <p className={`${HINT} tw:text-[var(--bk-ink-muted)]`}>{ASSET_TYPES[type]!.hint}</p>
          </div>
        ) : null}
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-add-field-placeholder">Placeholder</label>
          <TextInput id="cms-add-field-placeholder" sizing="sm" autoComplete="off" value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} data-testid="cms-add-field-placeholder" />
        </div>
        <div className={ROW}>
          <label className={ROW_LABEL} htmlFor="cms-add-field-help">Help text</label>
          <TextInput id="cms-add-field-help" sizing="sm" autoComplete="off" value={helpText} onChange={(e) => setHelpText(e.target.value)} data-testid="cms-add-field-help" />
        </div>
        {failed ? (
          <p className={`${HINT} tw:text-[var(--bk-error-text)]`} role="alert" data-testid="cms-add-field-failed">
            Couldn’t save. Your field settings are still here.
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
