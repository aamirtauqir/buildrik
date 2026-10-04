/**
 * OptionsEditor — a multi-select field's options, one per line (PD-1 =
 * build). Used where a multi-select is configured: + Add field's configure
 * step and the field inspector. Committed on blur; blank lines and repeats
 * are dropped (shared cmsOptionsFrom).
 *
 * No board draws this control (listed in the C1 ledger's missing boards); it
 * is the chrome-ui Textarea in the dialogs' label/control row.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { cmsOptionsFrom } from "@buildrik/shared/schemas/cms";
import { Textarea } from "@/editor/chrome-ui";

export interface OptionsEditorProps {
  id: string;
  options: readonly string[];
  onChange: (options: string[]) => void;
  /** Commit on every keystroke (a dialog that saves later) instead of on blur. */
  live?: boolean;
}

export function OptionsEditor({ id, options, onChange, live = false }: OptionsEditorProps) {
  const [draft, setDraft] = React.useState(options.join("\n"));
  const joined = options.join("\n");
  React.useEffect(() => {
    if (!live) setDraft(joined);
  }, [joined, live]);
  const commit = (text: string) => {
    const next = cmsOptionsFrom(text);
    if (next.join("\n") !== joined) onChange(next);
  };
  return (
    <Textarea
      id={id}
      rows={3}
      placeholder="One option per line"
      className="tw:min-h-[58px] tw:rounded-[6px] tw:px-2 tw:py-1.5 tw:text-[12px] tw:leading-[18px]"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (live) commit(e.target.value);
      }}
      onBlur={() => commit(draft)}
      data-testid={id}
    />
  );
}
