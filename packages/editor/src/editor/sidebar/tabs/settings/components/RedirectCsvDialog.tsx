/**
 * RedirectCsvDialog — 8136:215047 `Import redirects` (560), 8136:215307
 * import-error; the success is the screen's toast (8136:215568).
 *
 * `Choose CSV file` opens the file picker (a hidden chrome-ui TextInput, its ref
 * reaching the real `<input type=file>`); the chosen file's name replaces the prompt
 * and arms `Import CSV`. The import is all-or-nothing on the server
 * (`redirects.import_csv`, BE-7): a refused file leaves the dialog open with
 * the server's sentence — it names the line — in the error red, and nothing
 * imported. The server reads the first line as the header, so a file that
 * starts straight with a rule gets the header put in front of it here rather
 * than losing its first rule.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, ModalBody, ModalContent, ModalRoot, TextInput } from "@/editor/chrome-ui";
import {
  LIBRARY_MODAL_BODY,
  LIBRARY_MODAL_BTN_GHOST,
  LIBRARY_MODAL_BTN_PRIMARY,
  LIBRARY_MODAL_FOOT,
  LIBRARY_MODAL_TITLE,
} from "@/editor/media/components/libraryModal";
import { SET_BTN } from "../shared";

/** The server skips line 1 as a header; a file whose first line is already a rule gets one. */
function withCsvHeader(text: string): string {
  const first = text.replace(/^﻿/, "").trimStart();
  const firstCell = first.split(/\r?\n/, 1)[0]?.split(",")[0]?.replace(/^"|"$/g, "").trim() ?? "";
  return firstCell.startsWith("/") ? `from,to,type\n${first}` : first;
}

export interface RedirectCsvDialogProps {
  open: boolean;
  /** Sends the CSV; resolves with the rows created, rejects with the server's sentence. */
  onImport(csv: string): Promise<void>;
  onCancel(): void;
}

const LINE_13 = "tw:m-0 tw:text-[length:var(--bk-text-13)] tw:leading-5";

export function RedirectCsvDialog({ open, onImport, onCancel }: RedirectCsvDialogProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) return;
    setFile(null);
    setError(null);
    setBusy(false);
  }, [open]);

  const run = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onImport(withCsvHeader(await file.text()));
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "The file could not be imported. Nothing was imported.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalRoot open={open} onClose={busy ? undefined : onCancel}>
      <ModalContent size="question" srTitle="Import redirects" data-testid="set-rd-csv">
        <h2 className={LIBRARY_MODAL_TITLE}>Import redirects</h2>
        <ModalBody className="tw:flex tw:flex-col tw:items-start tw:gap-4">
          <p className={LIBRARY_MODAL_BODY}>Choose a CSV file with up to 1000 rows.</p>
          <TextInput
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="tw:hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setError(null);
              e.target.value = "";
            }}
            data-testid="set-rd-csv-input"
          />
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className={`${SET_BTN} tw:max-w-full tw:border-transparent tw:bg-transparent tw:text-[var(--bk-ink)] tw:enabled:hover:bg-[var(--bk-bg-subtle)]`}
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            data-testid="set-rd-csv-choose"
          >
            <span className="tw:truncate">{file ? file.name : "Choose CSV file"}</span>
          </Button>
          <p className={`${LINE_13} tw:font-medium tw:text-[var(--bk-ink)]`}>Format: /from,to[,301|302]</p>
          {error ? (
            <p className={`${LINE_13} tw:text-[var(--bk-error-text)]`} role="alert" data-testid="set-rd-csv-error">
              {error}
            </p>
          ) : null}
        </ModalBody>
        <div className={LIBRARY_MODAL_FOOT}>
          <Button
            size="xs"
            variant="ghost"
            className={LIBRARY_MODAL_BTN_GHOST}
            disabled={busy}
            onClick={onCancel}
            data-testid="set-rd-csv-cancel"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            className={LIBRARY_MODAL_BTN_PRIMARY}
            disabled={!file || busy}
            aria-busy={busy || undefined}
            onClick={() => void run()}
            data-testid="set-rd-csv-import"
          >
            {busy ? "Importing…" : "Import CSV"}
          </Button>
        </div>
      </ModalContent>
    </ModalRoot>
  );
}
