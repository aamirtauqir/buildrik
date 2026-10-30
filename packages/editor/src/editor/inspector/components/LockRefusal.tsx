/**
 * LockRefusal — an action the user chose was refused because its target was
 * locked by the time it ran (locked from Layers, another tab, a collaborator
 * — after the menu or picker opened). Said where it happened, with the way
 * out, until the element is unlocked or another element is selected:
 *
 *   paste-style     (2L9 G04 `271:124992`) — at the head of the tab body:
 *                   "Editing unavailable · {name} was locked before the style
 *                   could be pasted. No properties changed. · [Unlock]"
 *   add-interaction (2L9 G22 `271:131163`) — inside Interactions:
 *                   "Locked — unlock to edit · No interaction was added to
 *                   {name}. · [Unlock]"
 *
 * Paste style is caught from the command itself (COMMAND_RUN with nothing
 * pasted while the clipboard held styles and the target is locked), so the
 * ⋯ menu, the canvas menu and ⌥⌘V all say it. Unlock is the shared
 * `unlock-element` command, one undo step.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { EVENTS } from "@/shared/constants/events";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { WIDE_BUTTON } from "../shared/controls/controlClasses";
import { useElementVersion } from "../sections/typeBlock/bodies/bodyRows";

export type LockRefusalKind = "paste-style" | "add-interaction";

let refusal: { elementId: string; kind: LockRefusalKind } | null = null;
const listeners = new Set<() => void>();

export function setLockRefusal(next: { elementId: string; kind: LockRefusalKind } | null): void {
  refusal = next;
  listeners.forEach((l) => l());
}

/** The refusal of `kind` on this element while it is still locked, else false. */
export function useLockRefusal(composer: Composer | null | undefined, elementId: string, kind: LockRefusalKind): boolean {
  useElementVersion(composer);
  const current = React.useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => refusal,
  );
  const locked = composer?.elements?.getElement?.(elementId)?.isLocked?.() === true;
  return current?.elementId === elementId && current.kind === kind && locked;
}

/** Paste style that pasted nothing onto a locked target (any door). */
export function useWatchPasteRefusal(composer: Composer | null | undefined): void {
  React.useEffect(() => {
    if (!composer) return;
    const onRun = (e?: { id?: string; result?: unknown }) => {
      if (e?.id !== "paste-style" || e.result !== 0) return;
      const clipboard = composer.styleClipboard;
      const el = composer.selection.getSelected();
      if (!el?.isLocked() || !clipboard || Object.keys(clipboard).length === 0) return;
      setLockRefusal({ elementId: el.getId(), kind: "paste-style" });
    };
    composer.on(EVENTS.COMMAND_RUN, onRun);
    return () => {
      composer.off(EVENTS.COMMAND_RUN, onRun);
    };
  }, [composer]);
}

const COPY: Record<LockRefusalKind, { title?: string; status?: string; text: (name: string) => string }> = {
  "paste-style": {
    title: "Editing unavailable",
    text: (name) => `${name} was locked before the style could be pasted. No properties changed.`,
  },
  "add-interaction": {
    status: "Locked — unlock to edit",
    text: (name) => `No interaction was added to ${name}.`,
  },
};

export interface LockRefusalNoteProps {
  composer: Composer | null | undefined;
  elementId: string;
  kind: LockRefusalKind;
}

export function LockRefusalNote({ composer, elementId, kind }: LockRefusalNoteProps) {
  const shown = useLockRefusal(composer, elementId, kind);
  if (!shown) return null;
  const el = composer?.elements?.getElement?.(elementId);
  const name = el ? (getLayerName(el) ?? elementTypeLabel(el.getType())) : "This element";
  const copy = COPY[kind];
  return (
    <div
      role="status"
      data-testid={`inspector-lock-refusal-${kind}`}
      className={`tw:flex tw:flex-col tw:gap-2 ${copy.title ? "tw:px-3 tw:py-3" : "tw:py-2"}`}
    >
      {copy.title ? <p className="tw:m-0 tw:mb-2 tw:text-[13px] tw:font-semibold tw:leading-4 tw:text-[var(--bk-ink)]">{copy.title}</p> : null}
      {copy.status ? <p className="tw:m-0 tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)]">{copy.status}</p> : null}
      <p className="tw:m-0 tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-muted)]">{copy.text(name)}</p>
      <Button
        color="light"
        size="xs"
        className={`${WIDE_BUTTON} bdi-unlock`}
        data-testid="inspector-lock-refusal-unlock"
        onClick={() => {
          setLockRefusal(null);
          void composer?.commands.run("unlock-element", { elementId });
        }}
      >
        Unlock
      </Button>
    </div>
  );
}
