/**
 * AuthoredValue — a CSS value the section's controls cannot edit without
 * changing it, shown as written (2L9 247:23966 "Saved gradient", 161:12525
 * "Authored value"): its caption, the value in a grey box, a note saying
 * what is kept, "Edit …" (a text edit, written on blur only when `accept`
 * takes it; Escape keeps the value) and any further actions.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, Textarea } from "@/editor/chrome-ui";
import { WIDE_BUTTON } from "./controlClasses";

const COUNT_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];

/** "Three", as the notes say a count ("Three stops retained"). */
export const countWord = (n: number): string => COUNT_WORDS[n] ?? String(n);

export interface AuthoredValueProps {
  caption: string;
  value: string;
  note: string;
  editLabel: string;
  /** May the edited text be written? */
  accept: (next: string) => boolean;
  onCommit: (next: string) => void;
  testId?: string;
  /** Further full-width actions under Edit. */
  children?: React.ReactNode;
}

export function AuthoredValue({ caption, value, note, editLabel, accept, onCommit, testId, children }: AuthoredValueProps) {
  const [draft, setDraft] = React.useState<string | null>(null);
  return (
    <div data-testid={testId}>
      <div className="tw:mb-1 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{caption}</div>
      {draft === null ? (
        <p className="tw:m-0 tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:px-2 tw:py-2 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)] tw:break-words">
          {value}
        </p>
      ) : (
        <Textarea
          aria-label={caption}
          rows={3}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDraft(null);
          }}
          onBlur={() => {
            const next = draft.trim();
            if (next && next !== value && accept(next)) onCommit(next);
            setDraft(null);
          }}
          className="tw:text-[13px]"
        />
      )}
      <p className="tw:m-0 tw:py-2 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]">{note}</p>
      <div className="tw:flex tw:flex-col tw:gap-2">
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={() => setDraft(value)}>
          {editLabel}
        </Button>
        {children}
      </div>
    </div>
  );
}
