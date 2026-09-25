/**
 * The Data lists' row dialogs — Sources and Variables ⋯ (6930:80567:
 * Rename · Re-sync · Delete…). Delete uses chrome-ui's ConfirmDialog; the
 * ones below take input, plus "+ Connect a source" (6881:86167).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Modal, Textarea, TextInput } from "@/editor/chrome-ui";

const LABEL = "tw:block tw:mb-1.5 tw:text-[11px] tw:leading-4 tw:font-semibold tw:text-[var(--bk-ink)]";
const ERROR = "tw:mt-1.5 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-error-text)]";

export function RenameDialog({
  open,
  onClose,
  title,
  label,
  initial,
  validate,
  onSave,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  label: string;
  initial: string;
  /** An error sentence for the trimmed value, or null when it can be saved. */
  validate: (next: string) => string | null;
  onSave: (next: string) => void;
  testId: string;
}) {
  const [draft, setDraft] = React.useState(initial);
  const next = draft.trim();
  const error = next === initial ? null : validate(next);
  const canSave = next !== "" && next !== initial && !error;
  const save = () => {
    if (!canSave) return;
    onSave(next);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      kind="form"
      dirty={next !== initial}
      testId={testId}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid={`${testId}-cancel`}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={save} data-testid={`${testId}-save`}>
            Rename
          </Button>
        </>
      }
    >
      <label className={LABEL} htmlFor={`${testId}-input`}>
        {label}
      </label>
      <TextInput
        id={`${testId}-input`}
        sizing="sm"
        autoFocus
        autoComplete="off"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        data-testid={`${testId}-input`}
      />
      {error ? (
        <p className={ERROR} role="alert" data-testid={`${testId}-error`}>
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

/**
 * Re-sync for a source with no provider of its own — imported JSON. The
 * dialog opens on the data the site holds now; what is saved replaces it,
 * and bound elements read the new data at once.
 */
export function ResyncJsonDialog({
  open,
  onClose,
  name,
  current,
  onResync,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  current: unknown;
  onResync: (data: unknown) => void;
}) {
  const [initial] = React.useState(() => JSON.stringify(current ?? null, null, 2));
  const [json, setJson] = React.useState(initial);
  const [error, setError] = React.useState<string | null>(null);
  const resync = () => {
    try {
      onResync(JSON.parse(json));
      onClose();
    } catch {
      setError("Not valid JSON — check the syntax and try again.");
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Re-sync “${name}”`}
      subtitle="This source was imported as JSON. Paste its current data — bound elements update at once."
      kind="form"
      dirty={json !== initial}
      testId="content-source-resync"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="content-source-resync-cancel">
            Cancel
          </Button>
          <Button disabled={!json.trim() || json === initial} onClick={resync} data-testid="content-source-resync-save">
            Re-sync
          </Button>
        </>
      }
    >
      <label className={LABEL} htmlFor="content-source-resync-json">
        Data (JSON)
      </label>
      <Textarea
        id="content-source-resync-json"
        className="tw:min-h-40 tw:resize-y tw:[font-family:var(--bk-font-mono)] tw:text-xs"
        value={json}
        onChange={(e) => {
          setJson(e.target.value);
          setError(null);
        }}
        data-testid="content-source-resync-json"
      />
      {error ? (
        <p className={ERROR} role="alert" data-testid="content-source-resync-error">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

/** 6881:86167 — "+ Connect a source" asks in a dialog, not inline in the
 *  drawer. The board offers Google Sheets; the only connector that exists is a
 *  JSON paste, so the body says that and the primary adds it. */
export function ConnectSourceDialog({
  onClose,
  onImport,
}: {
  onClose: () => void;
  /** Adds the source; an error sentence when the JSON cannot be used. */
  onImport: (json: string) => string | null;
}) {
  const [json, setJson] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const add = () => {
    const err = onImport(json);
    if (err) setError(err);
    else onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Connect a source"
      kind="form"
      dirty={json.trim() !== ""}
      testId="content-source-connect"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} data-testid="content-source-connect-cancel">
            Cancel
          </Button>
          <Button disabled={!json.trim()} onClick={add} data-testid="content-source-connect-add">
            Add source
          </Button>
        </>
      }
    >
      <p className="tw:m-0 tw:mb-3">
        Paste the data as JSON — each list becomes records a collection can use. Edits sync one way, from the source in.
      </p>
      <Textarea
        className="tw:min-h-32 tw:resize-y tw:[font-family:var(--bk-font-mono)] tw:text-xs"
        placeholder='{"products": [{"name": "…"}]}'
        value={json}
        onChange={(e) => {
          setJson(e.target.value);
          setError(null);
        }}
        aria-label="Source JSON"
        autoFocus
      />
      {error ? (
        <p className={ERROR} role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}
