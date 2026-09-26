/**
 * CsvImportDialog — CSV import (fix-all round, 2026-09-25; decision: "build
 * CSV import now… no OAuth"). Upload → preview/map columns → create records,
 * three steps in one dialog:
 *
 *  1. Upload — pick a .csv file, read it as text in the browser (the browser
 *     is the only place that can read a local file; nothing about the file's
 *     CONTENT is trusted here).
 *  2. Preview — the raw text is posted to `cms.entries.importCsvPreview`,
 *     which re-parses it server-side (headers, a sample of rows, a row
 *     count, a suggested field→column mapping) and enforces the size/row
 *     caps. The mapping can be adjusted before import.
 *  3. Import — `cms.entries.importCsv` re-parses the SAME csv text
 *     server-side against the confirmed mapping and creates one entry per
 *     row through `upsertEntry` — the identical write manual "Add record"
 *     makes, so validation/sanitization live in one place. A row that fails
 *     is reported by position; the rest of the file still imports.
 *
 * Parsing happens twice on the server (preview, then import) rather than
 * once on the client and trusted — the size/row caps and the eventual write
 * are enforced against what the SERVER decodes, not what the browser claims.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Upload } from "lucide-react";
import type { CMSCollection } from "@/shared/types/cms";
import { Button, Modal, Progress, Select, TextInput } from "@/editor/chrome-ui";
import { getBuildrikClient } from "@/services/api-client";
import { DASHBOARD_URL } from "@/shared/utils/runtimeEnv";
import { getSiteIdFromUrl } from "@/services/BuildrikSyncProvider";
import { hydrateCmsFromServer } from "@/services/cmsSync";

function client() {
  return getBuildrikClient(DASHBOARD_URL);
}

type Preview = {
  headers: string[];
  totalRows: number;
  sampleRows: Array<Record<string, string>>;
  suggestedMapping: Record<string, string>;
};

type ImportResult = { imported: number; total: number; errors: Array<{ row: number; message: string }> };

type Step =
  | { kind: "upload" }
  | { kind: "loading-preview"; csv: string }
  | { kind: "map"; csv: string; preview: Preview; mapping: Record<string, string> }
  | { kind: "importing"; csv: string; mapping: Record<string, string> }
  | { kind: "done"; result: ImportResult }
  | { kind: "error"; message: string };

const NO_HEADER = "";

export function CsvImportDialog({
  collection,
  onClose,
  onImported,
}: {
  collection: CMSCollection;
  onClose: () => void;
  /** Called once import creates at least one record, so the caller can
   *  refresh the records list. */
  onImported: () => void;
}) {
  const [step, setStep] = React.useState<Step>({ kind: "upload" });
  const fileRef = React.useRef<HTMLInputElement>(null);
  const siteId = getSiteIdFromUrl();

  const runPreview = async (csv: string) => {
    setStep({ kind: "loading-preview", csv });
    if (!siteId) {
      setStep({ kind: "error", message: "No site is open — reopen the editor from a site." });
      return;
    }
    try {
      const preview = await client().cms.entries.importCsvPreview.mutate({
        siteId,
        collectionId: collection.id,
        csv,
      });
      setStep({ kind: "map", csv, preview, mapping: preview.suggestedMapping });
    } catch (e) {
      setStep({ kind: "error", message: e instanceof Error ? e.message : "Couldn't read this file." });
    }
  };

  const pickFile = async (file: File) => {
    const text = await file.text();
    void runPreview(text);
  };

  const runImport = async () => {
    if (step.kind !== "map") return;
    const { csv, mapping } = step;
    setStep({ kind: "importing", csv, mapping });
    if (!siteId) {
      setStep({ kind: "error", message: "No site is open — reopen the editor from a site." });
      return;
    }
    try {
      const result = await client().cms.entries.importCsv.mutate({
        siteId,
        collectionId: collection.id,
        csv,
        columnMapping: mapping,
      });
      if (result.imported > 0) {
        await hydrateCmsFromServer();
        onImported();
      }
      setStep({ kind: "done", result });
    } catch (e) {
      setStep({ kind: "error", message: e instanceof Error ? e.message : "Import failed." });
    }
  };

  const input = (
    <TextInput
      ref={fileRef}
      type="file"
      accept="text/csv,.csv"
      className="tw:hidden"
      data-testid="cms-csv-import-input"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) void pickFile(file);
      }}
    />
  );

  let body: React.ReactNode;
  let footer: React.ReactNode;

  if (step.kind === "upload" || step.kind === "loading-preview") {
    body = (
      <div className="tw:flex tw:h-[280px] tw:flex-col tw:items-center tw:justify-center tw:gap-3 tw:text-center">
        <Upload size={22} className="tw:text-[var(--bk-ink-soft)]" aria-hidden="true" />
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">
          Pick a .csv file with a header row. Columns are matched to {collection.name}'s fields on the next step.
        </p>
        <Button
          size="xs"
          disabled={step.kind === "loading-preview"}
          onClick={() => fileRef.current?.click()}
          data-testid="cms-csv-import-pick"
        >
          {step.kind === "loading-preview" ? "Reading file…" : "Choose file…"}
        </Button>
      </div>
    );
    footer = (
      <Button variant="secondary" onClick={onClose} data-testid="cms-csv-import-cancel">
        Cancel
      </Button>
    );
  } else if (step.kind === "map") {
    const { preview, mapping } = step;
    body = (
      <div className="tw:flex tw:flex-col tw:gap-4">
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]" data-testid="cms-csv-import-summary">
          {preview.totalRows} row{preview.totalRows === 1 ? "" : "s"} found. Match each field to a column, or leave it unmapped to skip it.
        </p>
        <div className="tw:flex tw:flex-col tw:gap-2">
          {collection.fields.map((f) => (
            <div key={f.id} className="tw:flex tw:items-center tw:gap-2">
              <label className="tw:w-32 tw:flex-none tw:truncate tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" htmlFor={`cms-csv-map-${f.slug}`}>
                {f.name}
              </label>
              <Select
                id={`cms-csv-map-${f.slug}`}
                sizing="sm"
                className="tw:flex-1"
                value={mapping[f.slug] ?? NO_HEADER}
                data-testid={`cms-csv-map-${f.slug}`}
                onChange={(e) => {
                  const next = { ...mapping };
                  if (e.target.value === NO_HEADER) delete next[f.slug];
                  else next[f.slug] = e.target.value;
                  setStep({ ...step, mapping: next });
                }}
              >
                <option value={NO_HEADER}>— Skip —</option>
                {preview.headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
        {preview.sampleRows.length > 0 ? (
          <div className="tw:overflow-x-auto tw:rounded-[6px] tw:border tw:border-[var(--bk-border)]" data-testid="cms-csv-import-sample">
            <table className="tw:w-full tw:text-[12px] tw:leading-4">
              <thead>
                <tr>
                  {preview.headers.map((h) => (
                    <th key={h} className="tw:border-b tw:border-[var(--bk-border)] tw:px-2 tw:py-1 tw:text-left tw:font-medium tw:text-[var(--bk-ink-muted)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.sampleRows.map((row, i) => (
                  <tr key={i}>
                    {preview.headers.map((h) => (
                      <td key={h} className="tw:px-2 tw:py-1 tw:text-[var(--bk-ink)]">
                        {row[h]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    );
    footer = (
      <>
        <Button variant="secondary" onClick={onClose} data-testid="cms-csv-import-cancel">
          Cancel
        </Button>
        <Button
          disabled={Object.keys(mapping).length === 0}
          onClick={() => void runImport()}
          data-testid="cms-csv-import-confirm"
        >
          Import {preview.totalRows} row{preview.totalRows === 1 ? "" : "s"}
        </Button>
      </>
    );
  } else if (step.kind === "importing") {
    body = (
      <div className="tw:flex tw:h-[280px] tw:flex-col tw:items-center tw:justify-center tw:gap-3">
        <Progress progress={100} size="sm" aria-label="Importing" className="tw:w-48" theme={{ color: { default: "tw:bg-[var(--bk-accent)]" } }} />
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-muted)]">Importing…</p>
      </div>
    );
    footer = (
      <Button variant="secondary" disabled data-testid="cms-csv-import-cancel">
        Cancel
      </Button>
    );
  } else if (step.kind === "done") {
    const { result } = step;
    body = (
      <div className="tw:flex tw:flex-col tw:gap-2" data-testid="cms-csv-import-result">
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]">
          Imported {result.imported} of {result.total} row{result.total === 1 ? "" : "s"}.
        </p>
        {result.errors.map((err) => (
          <p key={err.row} className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-warning-text)]">
            Row {err.row}: {err.message}
          </p>
        ))}
      </div>
    );
    footer = (
      <Button onClick={onClose} data-testid="cms-csv-import-close">
        Done
      </Button>
    );
  } else {
    body = (
      <p role="alert" className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-error)]" data-testid="cms-csv-import-error">
        {step.message}
      </p>
    );
    footer = (
      <Button variant="secondary" onClick={onClose} data-testid="cms-csv-import-cancel">
        Close
      </Button>
    );
  }

  return (
    <Modal open onClose={onClose} title="Import CSV" subtitle={collection.name} kind="form" width="wide" testId="cms-csv-import" footer={footer}>
      {input}
      {body}
    </Modal>
  );
}
