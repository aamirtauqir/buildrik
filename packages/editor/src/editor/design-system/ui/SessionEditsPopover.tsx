/**
 * SessionEditsPopover — Brand's "Review changes" (spec §4): a NON-blocking list
 * of this session's token edits, each with Revert. It replaced the staged
 * "Apply N changes" review: every edit is already live and saved, so the list
 * only offers a way back. A Revert is one write (one ⌘Z) the workspace makes.
 *
 * No board draws it yet (Part 2 redesigns the panel); the row reuses the old
 * review's plate — `--bk-bg-subtle`, the was → now pair in mono.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Popover } from "@/editor/chrome-ui";

export interface SessionEdit {
  id: string;
  name: string;
  mode: "light" | "dark";
  /** The value before the session's first edit of this token + mode. */
  was: string;
  now: string;
}

const ROW = "tw:flex tw:items-center tw:gap-2.5 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5 tw:py-1.5";
const MONO = "tw:text-[11px] tw:leading-4 tw:[font-family:var(--bk-font-mono)]";

export function SessionEditsPopover({
  edits,
  onRevert,
  disabled = false,
}: {
  edits: readonly SessionEdit[];
  /** The index in `edits` of the row to put back. */
  onRevert: (index: number) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      label="Changes this session"
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="xs"
          className="tw:h-7 tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-normal"
          onClick={() => setOpen((v) => !v)}
          data-testid="brand-session-edits"
        >
          Review changes · {edits.length}
        </Button>
      }
    >
      <div className="tw:flex tw:w-80 tw:flex-col tw:gap-1 tw:p-2" data-testid="brand-session-edits-list">
        <p className="tw:m-0 tw:px-1 tw:pb-1 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]">
          Already applied and saved. Revert puts a value back.
        </p>
        {edits.map((e, i) => (
          <div key={`${e.id}-${e.mode}-${i}`} className={ROW} data-testid={`brand-session-edit-${e.id}`}>
            <span className="tw:min-w-0 tw:flex-1 tw:truncate tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink)]">
              {e.name}
              {e.mode === "dark" ? " · dark" : ""}
            </span>
            <span className={`${MONO} tw:text-[var(--bk-ink-soft)] tw:line-through`}>{e.was}</span>
            <span className="tw:text-xs tw:text-[var(--bk-ink-soft)]">→</span>
            <span className={`${MONO} tw:text-[var(--bk-ink)]`}>{e.now}</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={disabled}
              onClick={() => onRevert(i)}
              data-testid={`brand-session-revert-${e.id}`}
            >
              Revert
            </Button>
          </div>
        ))}
      </div>
    </Popover>
  );
}
