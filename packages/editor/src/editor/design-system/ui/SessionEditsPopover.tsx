/**
 * SessionEditsPopover — Brand's "Review changes" (spec §4, boards BRP1-M2
 * 8222:230854 empty · 8222:231429 list · 8222:232022 stale · 8230:232344
 * one-row-reverted): a NON-blocking list of the tokens Brand changed this
 * session (useSessionEdits), one row per token, each with its own Revert.
 * Every edit is already live and saved, so the list only offers a way back.
 * A row whose token changed again since says so and cannot be reverted from
 * here — ⌘Z is the tool.
 *
 * The popover's anchor is the header's whole action cluster, so the card's
 * right edge lands on the workspace's right edge, as the board draws it.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button, Popover } from "@/editor/chrome-ui";
import { resolveTokenLiteral } from "@buildrik/shared/tokens";
import type { DesignToken } from "@/editor/design-system/types";
import type { SessionEdit } from "@/editor/design-system/state/useSessionEdits";

const SMALL = "tw:m-0 tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
/* The board's ghost action: 28 tall, 12 in, 13/20 medium in gray-700. Its
   disabled state is the label alone in --bk-ink-disabled — no plate, so a
   stale row reads as inert, not as a pressed button. */
const ACTION =
  "tw:h-7 tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5 tw:text-[var(--bk-gray-700)] " +
  "tw:disabled:bg-transparent tw:disabled:text-[var(--bk-ink-disabled)]";

/** A mode's value as the board writes it: the palette entry's name when the
 *  token points at one, the literal otherwise. */
function valueLabel(list: readonly DesignToken[], id: string, mode: "light" | "dark"): string {
  const t = list.find((x) => x.id === id);
  const ref = t && (mode === "dark" ? t.modes.dark : t.modes.light);
  if (ref && "alias" in ref && !ref.alias.startsWith("custom-")) {
    const target = list.find((x) => x.id === ref.alias);
    if (target) return target.name;
  }
  return (ref ? resolveTokenLiteral(list as DesignToken[], id, mode) : null) ?? "—";
}

/** "Primary · Light" + "Blue 500 → Blue 600" — what changed on the row's token. */
function describeEdit(e: Pick<SessionEdit, "tokenId" | "before" | "after">): { title: string; lines: string[] } {
  const was = e.before.find((t) => t.id === e.tokenId);
  const now = e.after.find((t) => t.id === e.tokenId);
  const name = (now ?? was)?.name ?? e.tokenId;
  if (!was) return { title: `${name} · Added`, lines: [valueLabel(e.after, e.tokenId, "light")] };
  if (!now) return { title: `${name} · Deleted`, lines: [`Was ${valueLabel(e.before, e.tokenId, "light")}`] };
  if (now.replacedBy !== was.replacedBy) {
    const to = now.replacedBy ? e.after.find((t) => t.id === now.replacedBy)?.name ?? now.replacedBy : "restored";
    return { title: `${name} · Renamed`, lines: [`${name} → ${to}`] };
  }
  const modes = (["light", "dark"] as const)
    .map((mode) => ({ mode, x: valueLabel(e.before, e.tokenId, mode), y: valueLabel(e.after, e.tokenId, mode) }))
    .filter((m) => m.x !== m.y);
  if (modes.length === 0) return { title: name, lines: [] };
  if (modes.length === 1) {
    const [m] = modes;
    return { title: `${name} · ${m.mode === "dark" ? "Dark" : "Light"}`, lines: [`${m.x} → ${m.y}`] };
  }
  return { title: `${name} · Light & dark`, lines: modes.map((m) => `${m.mode === "dark" ? "Dark" : "Light"} ${m.x} → ${m.y}`) };
}

export function SessionEditsPopover({
  edits,
  onRevert,
  disabled = false,
  extraActions,
}: {
  edits: readonly SessionEdit[];
  /** The `key` of the row to put back. */
  onRevert: (key: string) => void;
  disabled?: boolean;
  /** The header's other actions, drawn after the trigger inside the anchor. */
  extraActions?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      placement="bottom-end"
      block
      label="Review changes"
      className="tw:mt-[11px] tw:w-[460px]"
      trigger={
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:items-center tw:gap-2">
          <Button
            type="button"
            variant="secondary"
            size="xs"
            className="tw:h-7 tw:px-3 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5"
            onClick={() => setOpen((v) => !v)}
            disabled={disabled}
            data-testid="brand-session-edits"
          >
            Review changes · {edits.length}
          </Button>
          {extraActions}
        </div>
      }
    >
      <div className="tw:flex tw:max-h-[640px] tw:flex-col tw:gap-3 tw:overflow-y-auto tw:p-2" data-testid="brand-session-edits-list">
        <h3 className="tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[30px] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]">
          Review changes
        </h3>
        <p className={SMALL}>
          {edits.length === 0 ? "No changes to review yet." : "Edits in this session. Each edit is one ⌘Z step."}
        </p>
        {edits.map((e) => {
          const { title, lines } = describeEdit(e);
          return (
            <div key={e.key} className="tw:flex tw:flex-col tw:items-start tw:gap-2" data-testid="brand-session-edit" data-stale={e.stale || undefined}>
              <p className="tw:m-0 tw:text-[length:var(--bk-text-13)] tw:font-semibold tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="brand-session-edit-title">
                {title}
              </p>
              {lines.map((l) => (
                <p key={l} className={SMALL}>{l}</p>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={ACTION}
                disabled={disabled || e.stale}
                onClick={() => onRevert(e.key)}
                data-testid="brand-session-revert"
              >
                Revert
              </Button>
              {e.stale && (
                <p className={SMALL} data-testid="brand-session-stale">
                  Changed since — use ⌘Z
                </p>
              )}
            </div>
          );
        })}
        <div>
          <Button type="button" variant="ghost" size="xs" className={ACTION} onClick={() => setOpen(false)} data-testid="brand-session-close">
            Close
          </Button>
        </div>
      </div>
    </Popover>
  );
}
