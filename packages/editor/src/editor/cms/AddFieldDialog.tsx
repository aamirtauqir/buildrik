/**
 * AddFieldDialog — the two steps of + Add field:
 *  1. "Add field · <collection>" (4418:164208) — the type list;
 *  2. "Configure <Type> field" (4418:164219 text, :164230 number, :164236
 *     rich text, :164242 image, :164248 boolean, :164254 reference, :164260
 *     slug) — Name, Key, Required, and for a reference the collection it
 *     points at; "Existing records keep empty values until edited."
 * A key the collection already has stops at "Field key already exists"
 * (4418:164225), which offers a free one.
 *
 * Long text and Date have no boards; they stay in the list after Slug
 * because the add form always offered them.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection, CMSField, CMSFieldType } from "@/shared/types/cms";
import { Button, Chip, Modal, Select, TextInput } from "@/editor/chrome-ui";
import { FIELD_TYPES, FIELD_TYPE_LABEL } from "./fieldTypes";

const ROW = "tw:grid tw:grid-cols-[88px_1fr] tw:items-center tw:gap-2";
const ROW_LABEL = "tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
/* 4418:164225 / :164230 — body copy is 13/20 ink, the dialog's own text size. */
const NOTE = "tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]";
const TYPE_ROW =
  "tw:h-11 tw:w-full tw:justify-start tw:rounded-[6px] tw:border-0 tw:bg-transparent tw:px-2 tw:text-[13px] tw:font-normal " +
  "tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-gray-50)] tw:focus:ring-0";

const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const KEY_RE = /^[a-z][a-z0-9_-]*$/;

/** The first free key from a base: "name" → "name-2" → "name-3"… */
function freeKey(base: string, taken: Set<string>): string {
  const root = base || "field";
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n++;
  return `${root}-${n}`;
}

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
  const [clash, setClash] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const taken = React.useMemo(() => new Set(collection.fields.map((f) => f.slug)), [collection.fields]);
  const nextName = name.trim();
  /* The key follows the name until it is edited by hand. */
  const nextKey = (key ?? slugify(nextName)).trim();
  const keyError = nextKey && !KEY_RE.test(nextKey) ? "Keys start with a letter: lowercase letters, digits, - and _." : null;
  const label = type ? FIELD_TYPE_LABEL[type] ?? type : "";

  const save = async () => {
    if (!type || !nextName || !nextKey || keyError || busy) return;
    if (taken.has(nextKey)) {
      setClash(nextKey);
      return;
    }
    setBusy(true);
    try {
      await onAdd({
        name: nextName,
        slug: nextKey,
        type,
        ...(required ? { validation: { required: true } } : {}),
        ...(type === "reference" ? { referenceCollection: target } : {}),
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  if (clash) {
    const suggestion = freeKey(slugify(nextName) === clash ? clash : slugify(nextName) || clash, taken);
    return (
      <Modal
        open
        onClose={() => setClash(null)}
        title="Field key already exists"
        testId="cms-add-field-clash"
        footer={
          <>
            <Button variant="secondary" onClick={() => setClash(null)} data-testid="cms-add-field-clash-cancel">
              Cancel
            </Button>
            <Button
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
        title={`Add field · ${collection.name}`}
        subtitle="Choose the type of content this field will store."
        kind="form"
        testId="cms-add-field"
        footer={
          <Button variant="secondary" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
        }
      >
        <div className="tw:flex tw:flex-col" data-testid="cms-add-field-types">
          {FIELD_TYPES.map((t) => (
            <Button key={t} color="light" size="xs" className={TYPE_ROW} onClick={() => setType(t as CMSFieldType)} data-testid={`cms-add-field-type-${t}`}>
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
      title={`Configure ${label} field`}
      subtitle={`${collection.name} / ${label} field`}
      kind="form"
      dirty={nextName !== ""}
      testId="cms-add-field"
      footer={
        <>
          <Button variant="secondary" className="tw:mr-auto" onClick={() => setType(null)} data-testid="cms-add-field-back">
            Back to field types
          </Button>
          <Button variant="secondary" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
          <Button disabled={!nextName || !nextKey || Boolean(keyError) || busy} onClick={() => void save()} data-testid="cms-add-field-save">
            Save field
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
        ) : null}
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
        <p className={`${NOTE} tw:mt-2`}>Existing records keep empty values until edited.</p>
      </div>
    </Modal>
  );
}
