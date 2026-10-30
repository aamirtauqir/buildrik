/**
 * StatusLine — why the controls below are read-only, and the one way out
 * (DD-18, Q4). Replaced LockedBanner.
 *   locked   → "Editing unavailable" · "This element is locked. Inspecting
 *              it through Layers keeps its values visible." · a full-width
 *              primary "Unlock" (2L9 S22 255:92819, at the head of the tab
 *              body; the shared `unlock-element` command, one undo step);
 *              an ancestor's lock → "Locked by {layer}" · "Show {layer} in
 *              Layers" (147:77668 — it is unlocked there);
 *   conflict → "This site changed elsewhere — resolve to keep editing ·
 *              Resolve" (board 29; reopens the conflict dialog).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { lockOwner } from "@/engine/commands/commandOperations";
import { ELEMENT_ACTIONS } from "@/editor/shared/elementActions";

export interface StatusLineProps {
  composer: Composer | null | undefined;
  elementId: string;
  locked: boolean;
  conflict: { pending: boolean; resolve: () => void };
}

/* A 24px target drawn as the boards' 16px text link: the negative margin gives
   the extra 8 back to the line (ContextRow's LINK). */
const ACTION =
  "tw:h-6 tw:-my-1 tw:shrink-0 tw:border-0 tw:bg-transparent tw:px-1 tw:text-[11px] tw:font-medium tw:text-[var(--bk-accent-text)] tw:underline tw:hover:bg-transparent";

const LINE = "tw:flex tw:items-center tw:justify-between tw:gap-2 tw:px-4 tw:py-1.5 tw:text-[11px] tw:leading-4";
/* Boards 23 / 29 pad the line 6 · 16: 28 tall on one line (23), 44 on two (29). Board 29 tints the save-conflict line; the locked line (board 23) is plain. */
const TONE = {
  warning: "tw:bg-[var(--bk-warning-tint)] tw:text-[var(--bk-warning-text)]",
  muted: "tw:text-[var(--bk-ink-muted)]",
} as const;

export function StatusLine({ composer, elementId, locked, conflict }: StatusLineProps) {
  if (locked && !conflict.pending) {
    const el = composer?.elements?.getElement?.(elementId);
    const name = el ? (getLayerName(el) ?? elementTypeLabel(el.getType())) : "element";
    const owner = lockOwner(el);
    if (composer && el && owner && owner !== el) {
      /* Boards 147:77668: the lock is an ancestor's (a lock covers everything
         inside it). It is released on that layer, so the way out is to show
         it — selected, in Layers — where its own Unlock is. */
      const ownerName = getLayerName(owner) ?? elementTypeLabel(owner.getType());
      return (
        <div role="status" data-testid="inspector-status-line" data-tone="locked" className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pt-3 tw:pb-2">
          <span className="tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Editing unavailable</span>
          <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]" data-testid="inspector-locked-by">
            Locked by {ownerName}
          </span>
          <Button
            size="xs"
            color="light"
            data-testid="inspector-show-lock-owner"
            className={WIDE_BUTTON}
            onClick={() => ELEMENT_ACTIONS["show-in-layers"].run({ composer, element: owner, isRoot: false })}
          >
            Show {ownerName} in Layers
          </Button>
        </div>
      );
    }
    /* Board 147:78110: a lock on an element with children covers them too. */
    const covers = (el?.getChildren?.().length ?? 0) > 0;
    return (
      <div role="status" data-testid="inspector-status-line" data-tone="locked" className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pt-3 tw:pb-2">
        <span className="tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Editing unavailable</span>
        <span className="tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-soft)]">
          {covers && el
            ? `This ${elementTypeLabel(el.getType()).toLowerCase()} and its descendants are locked.`
            : "This element is locked. Inspecting it through Layers keeps its values visible."}
        </span>
        <Button
          size="xs"
          data-testid="inspector-unlock"
          aria-label={`Unlock ${name}`}
          className={`${WIDE_BUTTON} tw:text-white!`}
          onClick={() => void composer?.commands.run("unlock-element", { elementId })}
        >
          Unlock
        </Button>
      </div>
    );
  }
  if (!conflict.pending) return null;
  const line = {
    text: "This site changed elsewhere — resolve to keep editing",
    action: "Resolve",
    run: conflict.resolve,
    id: "inspector-resolve",
    tone: "warning" as const,
  };
  return (
    <div
      role="status"
      data-testid="inspector-status-line"
      data-tone={line.tone}
      className={`${LINE} ${TONE[line.tone]}`}
    >
      <span className="tw:min-w-0">{line.text}</span>
      <Button color="light" size="xs" data-testid={line.id} className={ACTION} onClick={() => void line.run()}>
        {line.action}
      </Button>
    </div>
  );
}

/**
 * The inspector's view-only line while the site has not loaded (Task 1.6) —
 * a quiet echo of the load-error banner, in the board's words for the cause:
 * B7-G02 "View only until the site loads", B7-G22 "View only · this site was
 * deleted", B7-G18 "View only · your role changed". No action: the banner owns
 * the way out.
 */
export function ViewOnlyLine({ cause }: { cause: "missing" | "forbidden" | "other" }) {
  const text =
    cause === "missing"
      ? "View only · this site was deleted"
      : cause === "forbidden"
        ? "View only · your role changed"
        : "View only until the site loads";
  return (
    <div role="status" data-testid="inspector-view-only" className={`${LINE} ${TONE.muted}`}>
      <span className="tw:min-w-0">{text}</span>
    </div>
  );
}

/**
 * 2L9 S02 (255:82909): the project did not load for a connection reason
 * (`network` / `offline` — the loader's retriable kinds that are not a
 * sign-in) — the Inspector says the saved project is safe and offers the same
 * in-place retry the load-error banner runs (`useSiteLoadStatus().retry`).
 * Without a published retry there is nothing honest to offer, so no button.
 */
export function LoadFailedCard({ retry }: { retry: (() => Promise<boolean>) | null }) {
  const [busy, setBusy] = React.useState(false);
  const mounted = React.useRef(true);
  React.useEffect(
    () => () => {
      mounted.current = false;
    },
    []
  );
  return (
    <div role="status" data-testid="inspector-load-failed" className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:py-3">
      <p className="tw:m-0 tw:mb-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">Project could not load</p>
      <p className="tw:m-0 tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)]">
        Check your connection, then retry. Your saved project has not been replaced.
      </p>
      {retry ? (
        <Button
          size="xs"
          className="tw:h-8 tw:w-full tw:justify-center tw:text-[13px] tw:font-normal tw:focus:ring-0"
          data-testid="inspector-load-retry"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void retry().finally(() => {
              if (mounted.current) setBusy(false);
            });
          }}
        >
          Retry loading
        </Button>
      ) : null}
    </div>
  );
}
