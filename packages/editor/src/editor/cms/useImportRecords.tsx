/**
 * useImportRecords — B13 Import JSON (decision #31), moved here from the
 * retired Records modal: pick a .json file, write each usable row through
 * createContentItem (the same write Add record makes), show progress, then
 * either the file's refusal or "Imported N of M" with each skipped row.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { CMSCollection } from "@/shared/types/cms";
import { Button, Progress, TextInput } from "@/editor/chrome-ui";
import { parseRecordsJson, type SkippedRow } from "./parseRecordsJson";

type Outcome =
  | { kind: "error"; reason: string }
  | { kind: "result"; imported: number; total: number; skipped: SkippedRow[] }
  | null;

export interface RecordsImporter {
  pick: () => void;
  busy: boolean;
  /** The hidden file input — render once. */
  input: React.ReactNode;
  /** Progress bar / refusal / result strip — render where it should read. */
  status: React.ReactNode;
}

export function useImportRecords(composer: Composer | null, collection: CMSCollection | null): RecordsImporter {
  const ref = React.useRef<HTMLInputElement>(null);
  const [progress, setProgress] = React.useState<{ done: number; total: number } | null>(null);
  const [outcome, setOutcome] = React.useState<Outcome>(null);

  React.useEffect(() => setOutcome(null), [collection?.id]);

  const importFile = async (file: File) => {
    if (!composer || !collection) return;
    setOutcome(null);
    const parsed = parseRecordsJson(await file.text(), collection.fields);
    if (!parsed.ok) {
      setOutcome({ kind: "error", reason: parsed.reason });
      return;
    }
    const skipped = [...parsed.invalid];
    let imported = 0;
    setProgress({ done: 0, total: parsed.rows.length });
    for (const [i, { row, data }] of parsed.rows.entries()) {
      try {
        const created = await composer.cms.collections.createContentItem(collection.id, data);
        if (created) imported++;
        else skipped.push({ row, reason: "not saved" });
      } catch (e) {
        skipped.push({ row, reason: e instanceof Error ? e.message : "not saved" });
      }
      setProgress({ done: i + 1, total: parsed.rows.length });
    }
    setProgress(null);
    skipped.sort((a, b) => a.row - b.row);
    setOutcome({ kind: "result", imported, total: parsed.rows.length + parsed.invalid.length, skipped });
  };

  const input = (
    <TextInput
      ref={ref}
      type="file"
      accept="application/json,.json"
      className="tw:hidden"
      data-testid="cms-import-input"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (file) void importFile(file);
      }}
    />
  );

  let status: React.ReactNode = null;
  if (progress) {
    status = (
      <div className="tw:px-5 tw:py-2" data-testid="cms-import-progress">
        <Progress
          progress={progress.total ? Math.round((progress.done / progress.total) * 100) : 0}
          size="sm"
          aria-label={`Importing ${progress.done} of ${progress.total} records`}
          theme={{ color: { default: "tw:bg-[var(--bk-accent)]" } }}
        />
      </div>
    );
  } else if (outcome?.kind === "error") {
    status = (
      <p role="alert" className="tw:m-0 tw:px-5 tw:py-2 tw:text-xs tw:text-[var(--bk-error)]" data-testid="cms-import-error">
        {outcome.reason}
      </p>
    );
  } else if (outcome?.kind === "result") {
    status = (
      <div role="status" className="tw:flex tw:items-start tw:gap-3 tw:px-5 tw:py-2 tw:text-xs tw:text-[var(--bk-ink-soft)]" data-testid="cms-import-result">
        <div className="tw:flex-1">
          <p className="tw:m-0">
            Imported {outcome.imported} of {outcome.total} record{outcome.total === 1 ? "" : "s"}
          </p>
          {outcome.skipped.map((r) => (
            <p key={r.row} className="tw:m-0 tw:text-[var(--bk-warning-text)]">
              Row {r.row}: {r.reason}
            </p>
          ))}
        </div>
        <Button size="xs" variant="link" className="tw:min-h-0 tw:p-0 tw:text-xs" onClick={() => setOutcome(null)}>
          Dismiss
        </Button>
      </div>
    );
  }

  return { pick: () => ref.current?.click(), busy: progress !== null, input, status };
}

/** 4428:148905's secondary action. The board says "Import from Google Sheets";
 *  no Sheets connector exists, so it is the JSON import that does. */
export function ImportRecordsButton({ importer }: { importer: RecordsImporter }) {
  return (
    <Button
      size="xs"
      variant="secondary"
      className="tw:h-7 tw:px-3 tw:text-[13px] tw:leading-5 tw:font-medium tw:rounded-[6px]"
      disabled={importer.busy}
      data-testid="cms-ws-empty-import"
      onClick={importer.pick}
    >
      Import JSON
    </Button>
  );
}
