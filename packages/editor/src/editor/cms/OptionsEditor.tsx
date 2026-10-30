/**
 * OptionsEditor — an option field's choices (2L9 B5-T12 `167:6844`): one
 * "Label and saved value" field per option, "+ Add option" under them, and
 * what a record may pick ("Records choose one option." / "…any number of
 * options."). Used by + Add field's configure step and the field inspector.
 * Blank rows and repeats are dropped on commit (shared `cmsOptionsFrom`).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { cmsOptionsFrom } from "@buildrik/shared/schemas/cms";
import { Button, TextInput } from "@/editor/chrome-ui";

export interface OptionsEditorProps {
  id: string;
  options: readonly string[];
  onChange: (options: string[]) => void;
  /** Commit on every keystroke (a dialog that saves later) instead of on blur. */
  live?: boolean;
  /** A multi-option field — records may pick several. */
  multiple?: boolean;
}

const LABEL = "tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]";

export function OptionsEditor({ id, options, onChange, live = false, multiple = false }: OptionsEditorProps) {
  const [rows, setRows] = React.useState<string[]>(() => (options.length ? [...options] : [""]));
  const joined = options.join("\n");
  React.useEffect(() => {
    if (!live) setRows(joined ? joined.split("\n") : [""]);
  }, [joined, live]);
  const commit = (next: string[]) => {
    const clean = cmsOptionsFrom(next.join("\n"));
    if (clean.join("\n") !== joined) onChange(clean);
  };
  const edit = (i: number, value: string) => {
    const next = rows.map((r, j) => (j === i ? value : r));
    setRows(next);
    if (live) commit(next);
  };
  return (
    <div className="tw:flex tw:flex-col tw:gap-3" data-testid={id}>
      {rows.map((value, i) => (
        <div key={i} className="tw:flex tw:flex-col tw:gap-1.5">
          <label className={LABEL} htmlFor={`${id}-${i}`}>
            Label and saved value
          </label>
          <TextInput
            id={`${id}-${i}`}
            sizing="sm"
            autoComplete="off"
            value={value}
            onChange={(e) => edit(i, e.target.value)}
            onBlur={() => commit(rows)}
            data-testid={`${id}-${i}`}
          />
        </div>
      ))}
      <div>
        <Button variant="secondary" size="xs" className="tw:h-8 tw:px-6 tw:text-[13px]" onClick={() => setRows((r) => [...r, ""])} data-testid={`${id}-add`}>
          + Add option
        </Button>
      </div>
      <p className="tw:m-0 tw:text-[12px] tw:leading-[18px] tw:text-[var(--bk-ink-muted)]">
        {multiple ? "Records choose any number of options." : "Records choose one option."}
      </p>
    </div>
  );
}
