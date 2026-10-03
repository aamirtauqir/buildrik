/**
 * RedirectCsvDialog — 8136:215047 `Import redirects` (560), 8136:215307
 * import-error; the success is the screen's toast (8136:215568).
 *
 * `Choose CSV file` opens the file picker (a hidden chrome-ui TextInput, its ref
 * reaching the real `<input type=file>`); the chosen file's name replaces the prompt
 * and arms `Import CSV`. The import is all-or-nothing on the server
 * (`redirects.import_csv`, BE-7): a refused file leaves the dialog open with
 * the server's sentence — the line and why ("Line 4: Destination is
 * required — nothing imported") — in the error red, and nothing imported.
 * After a refusal `Import CSV` stays off until another file is chosen (the
 * same file would be refused again); a failure that is not a refusal (the
 * network) leaves it on to retry. The server reads the first line as the header, so a file that
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
function withCsvHeader(text: string): { csv: string; added: boolean } {
  const first = text.replace(/^﻿/, "").trimStart();
  const firstCell = first.split(/\r?\n/, 1)[0]?.split(",")[0]?.replace(/^"|"$/g, "").trim() ?? "";
  return firstCell.startsWith("/") ? { csv: `from,to,type\n${first}`, added: true } : { csv: first, added: false };
}

/** The server numbers lines of the CSV it received; with a header put in
    front, that is one more than the line in the person's own file. */
function toFileLines(message: string, added: boolean): string {
  return added ? message.replace(/\bline (\d+)/gi, (m, n: string) => m.replace(n, String(Number(n) - 1))) : message;
}

/** The server answered and refused the file (a 4xx), as opposed to never answering. */
function isRefusal(e: unknown): boolean {
  const status = (e as { data?: { httpStatus?: unknown } | null } | null)?.data?.httpStatus;
  return typeof status === "number" && status >= 400 && status < 500;
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
  /* The file the server refused — Import stays off until it changes (8136:215307). */
  const [refused, setRefused] = React.useState(false);

  React.useEffect(() => {
    if (open) return;
    setFile(null);
    setError(null);
    setRefused(false);
    setBusy(false);
  }, [open]);

  const run = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    const { csv, added } = withCsvHeader(await file.text());
    try {
      await onImport(csv);
    } catch (e) {
      setError(e instanceof Error && e.message ? toFileLines(e.message, added) : "The file could not be imported. Nothing was imported.");
      setRefused(isRefusal(e));
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
              setRefused(false);
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
            disabled={!file || busy || refused}
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
