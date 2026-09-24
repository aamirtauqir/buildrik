/**
 * AddFieldDialog — "Add field · <collection>" (4418:164208): name, the type
 * the field will store, Required. Keys follow the name (the engine slugs it),
 * so a name another field already has is refused here, not in storage.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { CMSCollection } from "@/shared/types/cms";
import { Button, Checkbox, Modal, TextInput } from "@/editor/chrome-ui";
import { FIELD_TYPES, FIELD_TYPE_LABEL } from "./fieldTypes";

const LABEL = "tw:block tw:mb-1.5 tw:text-[11px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]";
const TYPE =
  "tw:flex tw:h-8 tw:items-center tw:rounded-[6px] tw:border tw:px-2.5 tw:text-[13px] tw:leading-5 tw:cursor-pointer";
const TYPE_ON = `${TYPE} tw:border-[var(--bk-accent)] tw:bg-[var(--bk-accent-tint)] tw:text-[var(--bk-accent-text)]`;
const TYPE_OFF = `${TYPE} tw:border-[var(--bk-border)] tw:text-[var(--bk-ink)] tw:hover:bg-[var(--bk-gray-50)]`;

export function AddFieldDialog({
  collection,
  onClose,
  onAdd,
}: {
  collection: CMSCollection;
  onClose: () => void;
  onAdd: (name: string, type: string, required: boolean) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<string>("text");
  const [required, setRequired] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const next = name.trim();
  const taken = collection.fields.some((f) => f.name.toLowerCase() === next.toLowerCase());
  const add = async () => {
    if (!next || taken || busy) return;
    setBusy(true);
    try {
      await onAdd(next, type, required);
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Add field · ${collection.name}`}
      subtitle="Choose the type of content this field will store."
      kind="form"
      dirty={next !== ""}
      testId="cms-add-field"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="cms-add-field-cancel">
            Cancel
          </Button>
          <Button disabled={!next || taken || busy} onClick={() => void add()} data-testid="cms-add-field-save">
            Add field
          </Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Field type" className="tw:grid tw:grid-cols-3 tw:gap-2" data-testid="cms-add-field-types">
        {FIELD_TYPES.map((t) => (
          <Button
            key={t}
            role="radio"
            aria-checked={type === t}
            color="light"
            size="xs"
            className={type === t ? TYPE_ON : TYPE_OFF}
            onClick={() => setType(t)}
            data-testid={`cms-add-field-type-${t}`}
          >
            {FIELD_TYPE_LABEL[t]}
          </Button>
        ))}
      </div>
      <label className={`${LABEL} tw:mt-4`} htmlFor="cms-add-field-name">
        Field name
      </label>
      <TextInput
        id="cms-add-field-name"
        sizing="sm"
        autoFocus
        autoComplete="off"
        placeholder="e.g. Price"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") void add();
        }}
        data-testid="cms-add-field-name"
      />
      {taken ? (
        <p className="tw:m-0 tw:mt-1.5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]" role="alert" data-testid="cms-add-field-error">
          {collection.name} already has a field called {next}.
        </p>
      ) : null}
      <label className="tw:mt-3 tw:inline-flex tw:cursor-pointer tw:items-center tw:gap-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
        <Checkbox checked={required} onChange={(e) => setRequired(e.target.checked)} data-testid="cms-add-field-required" />
        Required
      </label>
    </Modal>
  );
}
