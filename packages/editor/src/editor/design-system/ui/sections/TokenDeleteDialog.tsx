/**
 * TokenDeleteDialog — Brand's safe delete, board BRP1-M6:
 *
 *   8224:232280  unused-confirm         "Delete Border?" · Cancel · Delete
 *   8224:231573  replacement-required   "Replace Primary before deleting?" — a
 *                                       same-kind replacement, then
 *                                       "Replace and delete" (one ⌘Z)
 *   8224:232979  usage-unknown          "Can't delete Primary" · Close · Try again
 *   8224:233678  replaced               the caller's toast, after the write
 *
 * The state is the token's SITE-WIDE count (`tokenUsage.getCount`): a known
 * 0 deletes; a number above 0 needs a replacement, which the registry writes
 * as `replacedBy` so every element keeps a valid value; "unknown" (saved
 * components still loading) refuses — the engine's removal guard would refuse
 * the write anyway, and the dialog says why instead. Seed tokens never reach
 * this dialog: their Delete is "Reset to default" (owner, OQ-7).
 *
 * Replaces the 2026-05-17 TokenReplaceModal (inline-styled, opened only for
 * the in-use case).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { ChevronDown } from "lucide-react";
import { resolveTokenLiteral, type TokenUsageCount } from "@buildrik/shared/tokens";
import { Button, OverlayMount } from "@/editor/chrome-ui";
import type { DesignToken } from "../../types";
import { displayValue } from "../colors/ColorTokenList";

export interface TokenDeleteDialogProps {
  open: boolean;
  token: DesignToken;
  /** Site-wide usage of `token` — decides which of the three states shows. */
  usage: TokenUsageCount;
  /** Every token: the replacement candidates and their labels. */
  allTokens: readonly DesignToken[];
  onClose: () => void;
  /** Unused: `undefined`. In use: the picked replacement. */
  onDelete: (opts: { replaceWith: string } | undefined) => void;
  /** "Try again" on the unknown state — re-read the count. */
  onRetry: () => void;
}

const kindOf = (t: DesignToken) => t.kind ?? (t.category === "colors" ? "color" : undefined);

/** Same kind, not soft-deleted, not the token itself; semantic tokens first. */
export function replacementCandidates(token: DesignToken, all: readonly DesignToken[]): DesignToken[] {
  const k = kindOf(token);
  const live = all.filter((t) => t.id !== token.id && !t.replacedBy && kindOf(t) === k);
  return [...live.filter((t) => t.layer !== "primitive"), ...live.filter((t) => t.layer === "primitive")];
}

const nameOf = (t: DesignToken) => t.friendlyName ?? t.name;

/** "Link · Blue 600" — what it points at (its palette entry), else its value. */
export function candidateLabel(t: DesignToken, all: readonly DesignToken[]): string {
  const light = t.modes.light;
  const target = "alias" in light ? all.find((x) => x.id === light.alias) : undefined;
  /* A palette entry named like the token itself says nothing: show the value. */
  const second = target && nameOf(target) !== nameOf(t) ? nameOf(target) : displayValue(resolveTokenLiteral(all, t.id, "light") ?? "");
  return `${nameOf(t)} · ${second}`;
}

/* 8224:232256: a 520 card, 24 in, 12 between, radius-md, the action row
   left-aligned under the copy. Title 20/30 semibold, copy 12/18 ink-soft. */
const CARD =
  "tw:flex tw:w-[520px] tw:max-w-[calc(100vw-32px)] tw:flex-col tw:items-start tw:gap-3 tw:rounded-[var(--bk-radius-md)] " +
  "tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-6 tw:[box-shadow:var(--bk-shadow-overlay)] tw:[font-family:var(--bk-font-ui)]";
const TITLE =
  "tw:m-0 tw:text-[length:var(--bk-text-20)] tw:font-semibold tw:leading-[var(--bk-leading-30)] tw:tracking-[-0.24px] tw:text-[var(--bk-ink)]";
const COPY = "tw:m-0 tw:w-full tw:text-[length:var(--bk-text-12)] tw:leading-[18px] tw:text-[var(--bk-ink-soft)]";
/* The board's 28-tall actions: 12 in, 13/20 medium. */
const ACTION = "tw:h-7 tw:min-h-0 tw:rounded-[var(--bk-radius-md)] tw:px-3 tw:py-1 tw:text-[length:var(--bk-text-13)] tw:font-medium tw:leading-5";
const SECONDARY = `${ACTION} tw:text-[var(--bk-gray-700)]`;
/* 8224:232271 "Replace and delete": flowbite red-600 (the shared danger
   button is red-700), red-700 on hover. */
const DANGER = `${ACTION} tw:bg-[var(--bk-red-600)] tw:enabled:hover:bg-[var(--bk-red-700)]`;
/* A clicked option keeps no focus ring (keyboard focus does). */
const NO_CLICK_RING = "tw:focus:ring-0 tw:focus:[box-shadow:none] tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

export const TokenDeleteDialog: React.FC<TokenDeleteDialogProps> = ({
  open,
  token,
  usage,
  allTokens,
  onClose,
  onDelete,
  onRetry,
}) => {
  const titleId = React.useId();
  const listId = React.useId();
  const name = nameOf(token);
  const candidates = React.useMemo(() => replacementCandidates(token, allTokens), [token, allTokens]);
  const [pick, setPick] = React.useState<string | null>(null);
  const [listOpen, setListOpen] = React.useState(true);
  React.useEffect(() => {
    if (!open) return;
    setPick(null);
    setListOpen(true);
  }, [open, token.id]);
  const picked = pick ? candidates.find((c) => c.id === pick) : undefined;
  const isColour = kindOf(token) === "color";

  const actions = (children: React.ReactNode) => <div className="tw:flex tw:items-center tw:gap-2">{children}</div>;

  let body: React.ReactNode;
  if (usage === "unknown") {
    body = (
      <>
        <p className={TITLE} id={titleId}>Can&apos;t delete {name}</p>
        <p className={COPY}>
          We can&apos;t count usage right now. Nothing has been deleted. Try again when all site content can be checked.
        </p>
        {actions(
          <>
            <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={onClose}>
              Close
            </Button>
            <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={onRetry} data-testid="brand-token-delete-retry">
              Try again
            </Button>
          </>,
        )}
      </>
    );
  } else if (usage === 0) {
    body = (
      <>
        <p className={TITLE} id={titleId}>Delete {name}?</p>
        <p className={COPY}>This token is not used by any elements.</p>
        {actions(
          <>
            <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="danger" size="xs" className={DANGER} onClick={() => onDelete(undefined)} data-testid="brand-token-delete-confirm">
              Delete
            </Button>
          </>,
        )}
      </>
    );
  } else {
    const elements = `${usage} element${usage === 1 ? "" : "s"}`;
    body = (
      <>
        <p className={TITLE} id={titleId}>Replace {name} before deleting?</p>
        <p className={COPY}>
          {name} is used by {elements}. Choose a replacement so every element keeps a valid {isColour ? "colour" : "value"}.
        </p>
        <div className="tw:flex tw:w-full tw:flex-col tw:gap-1">
          <span className="tw:text-[length:var(--bk-text-11)] tw:leading-4 tw:text-[var(--bk-ink-soft)]" id={`${listId}-label`}>
            Replace with
          </span>
          {/* 8224:232259: a 32-tall select-like field; its options open
              under it (8228:232587), open by default — the list is the pick. */}
          <Button
            type="button"
            variant="secondary"
            size="xs"
            aria-haspopup="listbox"
            aria-expanded={listOpen}
            aria-controls={listId}
            aria-labelledby={`${listId}-label`}
            onClick={() => setListOpen((v) => !v)}
            data-testid="brand-token-replace-field"
            className={
              "tw:h-8 tw:min-h-0 tw:w-full tw:justify-between tw:rounded-[var(--bk-radius-md)] tw:border-[var(--bk-border-input)] tw:bg-[var(--bk-bg-panel)] tw:px-3 " +
              "tw:text-[length:var(--bk-text-13)] tw:font-normal tw:leading-5 " +
              (picked ? "tw:text-[var(--bk-ink)]" : "tw:text-[var(--bk-ink-muted)]")
            }
          >
            <span className="tw:truncate">{picked ? candidateLabel(picked, allTokens) : "Choose a token"}</span>
            <ChevronDown size={16} aria-hidden className="tw:flex-none tw:text-[var(--bk-ink-muted)]" />
          </Button>
        </div>
        {listOpen && (
          <div
            role="listbox"
            id={listId}
            aria-labelledby={`${listId}-label`}
            className="tw:flex tw:max-h-60 tw:w-full tw:flex-col tw:items-start tw:gap-3 tw:overflow-y-auto tw:rounded-[var(--bk-radius-md)] tw:border tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-card)] tw:p-2"
          >
            {candidates.length === 0 ? (
              <p className={`${COPY} tw:p-1`}>No other token of this kind. Add one first, then delete.</p>
            ) : (
              candidates.map((c) => {
                const on = c.id === pick;
                return (
                  <Button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    variant={on ? "primary" : "ghost"}
                    size="xs"
                    onClick={() => setPick(c.id)}
                    data-replace-candidate={c.id}
                    className={`${ACTION} ${NO_CLICK_RING} tw:flex-none ${on ? "" : "tw:text-[var(--bk-gray-700)]"}`}
                  >
                    {candidateLabel(c, allTokens)}
                  </Button>
                );
              })
            )}
          </div>
        )}
        {picked && (
          <p className={COPY}>
            {elements} will use {nameOf(picked)}. Undo the replacement and deletion with one ⌘Z.
          </p>
        )}
        {actions(
          <>
            <Button type="button" variant="secondary" size="xs" className={SECONDARY} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="xs"
              className={DANGER}
              disabled={!picked}
              onClick={() => picked && onDelete({ replaceWith: picked.id })}
              data-token-replace-confirm
            >
              Replace and delete
            </Button>
          </>,
        )}
      </>
    );
  }

  return (
    <OverlayMount open={open} onClose={onClose} labelledBy={titleId}>
      <div
        className={CARD}
        data-testid={typeof usage === "number" && usage > 0 ? "brand-token-replace-modal" : "brand-token-delete-dialog"}
        data-delete-state={usage === "unknown" ? "unknown" : usage === 0 ? "unused" : "in-use"}
      >
        {body}
      </div>
    </OverlayMount>
  );
};
