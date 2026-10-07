/**
 * SessionEditsPopover — Brand's "Review changes" (spec §4): a NON-blocking list
 * of every token write made in Brand this session (useSessionEdits), each with
 * Revert. Every edit is already live and saved, so the list only offers a way
 * back. A row whose result the site no longer holds (a later edit, ⌘Z) says so
 * and cannot be reverted from here.
 *
 * No board draws it yet (Part 2 redesigns the panel); the row reuses the old
 * review's plate — `--bk-bg-subtle`, the was → now pair in mono.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Popover } from "@/editor/chrome-ui";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/editor/design-system/types";
import type { SessionEdit } from "@/editor/design-system/state/useSessionEdits";

const ROW = "tw:flex tw:flex-col tw:gap-1 tw:rounded-md tw:bg-[var(--bk-bg-subtle)] tw:px-2.5 tw:py-1.5";
const SMALL = "tw:text-[length:var(--bk-text-11)] tw:leading-4";
const MONO = `${SMALL} tw:[font-family:var(--bk-font-mono)]`;

const WORDS: Record<string, string> = {
  "Edit token": "Changed a token",
  "Add token": "Added a token",
  "Delete token": "Deleted a token",
  "Rename token": "Renamed a token",
  "Set dark value": "Set a dark value",
  "Apply spacing preset": "Applied a spacing preset",
  "Reset spacing": "Reset spacing",
  "Apply starter": "Applied a starter",
  "Import tokens": "Imported tokens",
};

/** What a write did, token by token — the edit's own `custom-*` primitives
 *  are its implementation, not a change of their own. */
function changes(before: readonly DesignToken[], after: readonly DesignToken[]): string[] {
  const was = new Map(before.map((t) => [t.id, t]));
  const now = new Map(after.map((t) => [t.id, t]));
  const out: string[] = [];
  for (const id of new Set([...was.keys(), ...now.keys()])) {
    const a = was.get(id);
    const b = now.get(id);
    const t = b ?? a!;
    if (t.layer === "primitive" && id.startsWith("custom-")) continue;
    if (!a) out.push(`+ ${t.name}`);
    else if (!b) out.push(`− ${t.name}`);
    else if (b.replacedBy !== a.replacedBy) out.push(`${t.name} → ${b.replacedBy ?? "restored"}`);
    else {
      for (const mode of ["light", "dark"] as const) {
        const x = resolveTokenLiteral(before, id, mode) ?? "";
        const y = resolveTokenLiteral(after, id, mode) ?? "";
        if (x !== y) out.push(`${t.name}${mode === "dark" ? " · dark" : ""}  ${x || "—"} → ${y || "—"}`);
      }
    }
  }
  return out;
}

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
      <div className="tw:flex tw:max-h-96 tw:w-80 tw:flex-col tw:gap-1 tw:overflow-y-auto tw:p-2" data-testid="brand-session-edits-list">
        <p className={`tw:m-0 tw:px-1 tw:pb-1 tw:text-[length:var(--bk-text-12)] tw:leading-4 tw:text-[var(--bk-ink-muted)]`}>
          Already applied and saved. Revert puts the brand back as it was before that change.
        </p>
        {edits.map((e, i) => {
          const lines = changes(e.before, e.after);
          return (
            <div key={e.at + "-" + i} className={ROW} data-testid="brand-session-edit" data-stale={e.stale || undefined}>
              <div className="tw:flex tw:items-center tw:gap-2">
                <span className={`${SMALL} tw:min-w-0 tw:flex-1 tw:truncate tw:font-medium tw:text-[var(--bk-ink)]`}>
                  {WORDS[e.label] ?? e.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={disabled || e.stale}
                  onClick={() => onRevert(i)}
                  data-testid="brand-session-revert"
                >
                  Revert
                </Button>
              </div>
              {lines.slice(0, 3).map((l) => (
                <span key={l} className={`${MONO} tw:truncate tw:text-[var(--bk-ink-soft)]`}>{l}</span>
              ))}
              {lines.length > 3 && <span className={`${SMALL} tw:text-[var(--bk-ink-muted)]`}>+{lines.length - 3} more</span>}
              {e.stale && (
                <span className={`${SMALL} tw:text-[var(--bk-ink-muted)]`} data-testid="brand-session-stale">
                  Changed since — use ⌘Z
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Popover>
  );
}
