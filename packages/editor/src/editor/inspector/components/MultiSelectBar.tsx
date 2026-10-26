/**
 * MultiSelectBar — the multi-selection's own rows under the header (DD-12,
 * board 22):
 *
 *   Align        [⇤ ↔ ⇥ ↥ ↕ ↧]
 *   Distribute   [Horizontal | Vertical]      (needs 3 or more)
 *                                Group
 *   Edits apply to all 3. One Undo restores all 3.
 *
 * The panel below is the SAME panel as for one element — the sections every
 * selected type has, with "Mixed" where they differ — not a separate batch
 * panel. Align / Distribute are actions, not a state: no option stays lit.
 *
 * 2L9 B01: what a batch edit reaches is said up front — "2 of 3 eligible ·
 * Locked image is excluded and remains unchanged." (writes already skip
 * locked targets through the lock gate) — and a Selection list ("Inspect
 * Heading 1", …) narrows to one object, with "No DOM ID batch write. Choose
 * one object for identity, binding and child-list tasks."
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { AlignmentHandler } from "@/engine/canvas/AlignmentHandler";
import { Button } from "@/editor/chrome-ui";
import { ActionRow } from "../sections/behaviourRows";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";

export interface MultiSelectBarProps {
  composer: Composer | null | undefined;
  selectedIds: readonly string[];
}

/** One option of a board-22 segment: 20 tall, radius 3, white + border on hover. */
const OPTION =
  "tw:h-5 tw:min-w-0 tw:flex-1 tw:rounded-[3px] tw:border tw:border-transparent tw:bg-transparent tw:p-0 " +
  "tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)] " +
  "tw:enabled:hover:border-[var(--bk-border)] tw:enabled:hover:bg-[var(--bk-bg-panel)] tw:enabled:hover:text-[var(--bk-accent-text)] " +
  "tw:disabled:opacity-100 tw:disabled:text-[var(--bk-ink-disabled)]";
const SEGMENT = "tw:flex tw:h-6 tw:shrink-0 tw:gap-0 tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:p-0.5";
const ROW = "tw:flex tw:h-8 tw:items-center tw:gap-2 tw:px-3";
const LABEL = "tw:shrink-0 tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

export function MultiSelectBar({ composer, selectedIds }: MultiSelectBarProps) {
  const handler = React.useMemo(() => (composer ? new AlignmentHandler(composer) : null), [composer]);
  const ids = [...selectedIds];
  const n = ids.length;
  /* The engine groups siblings only; say why rather than a dead click. */
  const parents = ids.map((id) => composer?.elements.getElement(id)?.getParent?.()?.getId?.() ?? null);
  const sameParent = parents.length > 1 && parents.every((p) => p !== null && p === parents[0]);
  const canDistribute = Boolean(handler) && n >= 3;
  const els = ids.map((id) => composer?.elements.getElement(id) ?? null);
  /* Names as the Layers panel shows them; two plain "Heading"s become
     "Heading 1", "Heading 2" so the Inspect rows can be told apart. */
  const base = els.map((el) => getLayerName(el) ?? elementTypeLabel(el?.getType?.() ?? ""));
  const names = base.map((b, i) => (base.filter((x) => x === b).length > 1 ? `${b} ${base.slice(0, i + 1).filter((x) => x === b).length}` : b));
  const locked = els.map((el) => Boolean(el?.isLocked?.()));
  const eligible = locked.filter((l) => !l).length;
  const lockedNames = names.filter((_, i) => locked[i]);

  const align: [string, string, () => void][] = [
    ["Align left", "⇤", () => handler?.alignHorizontal(ids, "left")],
    ["Align centre", "↔", () => handler?.alignHorizontal(ids, "center")],
    ["Align right", "⇥", () => handler?.alignHorizontal(ids, "right")],
    ["Align top", "↥", () => handler?.alignVertical(ids, "top")],
    ["Align middle", "↕", () => handler?.alignVertical(ids, "middle")],
    ["Align bottom", "↧", () => handler?.alignVertical(ids, "bottom")],
  ];

  return (
    <div className="tw:flex tw:flex-col" data-testid="inspector-multi-bar">
      <div className={ROW}>
        <span className={`${LABEL} tw:w-16`} id="inspector-multi-align-label" data-testid="inspector-multi-align-label">
          Align
        </span>
        <div className={`${SEGMENT} tw:w-[204px]`} role="group" aria-labelledby="inspector-multi-align-label">
          {align.map(([label, glyph, run]) => (
            <Button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              className={OPTION}
              disabled={!handler || n < 2}
              onClick={run}
            >
              <span aria-hidden="true">{glyph}</span>
            </Button>
          ))}
        </div>
      </div>
      <div className={ROW}>
        <span className={`${LABEL} tw:w-[108px]`} id="inspector-multi-distribute-label">
          Distribute
        </span>
        <div
          className={`${SEGMENT} tw:w-40`}
          role="group"
          aria-labelledby="inspector-multi-distribute-label"
          title={canDistribute ? undefined : "Distribute needs 3 or more elements"}
        >
          <Button
            type="button"
            className={OPTION}
            disabled={!canDistribute}
            data-testid="inspector-multi-distribute-h"
            onClick={() => handler?.distribute(ids, "horizontal")}
          >
            Horizontal
          </Button>
          <Button
            type="button"
            className={OPTION}
            disabled={!canDistribute}
            data-testid="inspector-multi-distribute-v"
            onClick={() => handler?.distribute(ids, "vertical")}
          >
            Vertical
          </Button>
        </div>
      </div>
      <div className="tw:px-3" title={sameParent ? undefined : "Group needs elements that share a parent"}>
        <ActionRow testId="inspector-multi-group" disabled={!sameParent} onClick={() => composer?.commands.run("group")}>
          Group
        </ActionRow>
      </div>
      <p className="tw:m-0 tw:px-4 tw:py-2 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-multi-note">
        {lockedNames.length === 0
          ? `Edits apply to all ${n}. One Undo restores all ${n}.`
          : `${eligible} of ${n} eligible. Locked ${lockedNames.join(", ")} ${lockedNames.length === 1 ? "is" : "are"} excluded and ${lockedNames.length === 1 ? "remains" : "remain"} unchanged.`}
      </p>
      <div className="tw:flex tw:flex-col tw:px-3 tw:pb-2" role="group" aria-labelledby="inspector-multi-selection-label">
        <span className={`${LABEL} tw:py-1 tw:px-1`} id="inspector-multi-selection-label">
          Selection
        </span>
        {ids.map((id, i) => (
          <Button
            key={id}
            type="button"
            color="light"
            size="xs"
            data-testid="inspector-multi-inspect"
            className="tw:h-7 tw:w-full tw:justify-start tw:border-0 tw:bg-transparent tw:px-1 tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent-text)] tw:hover:bg-[var(--bk-bg-subtle)] tw:focus:ring-0"
            onClick={() => {
              const el = els[i];
              if (el) composer?.selection.select(el);
            }}
          >
            Inspect {locked[i] ? `locked ${names[i].toLowerCase()}` : names[i]}
          </Button>
        ))}
        <p className="tw:m-0 tw:px-1 tw:pt-1 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-multi-identity-note">
          No DOM ID batch write. Choose one object for identity, binding and child-list tasks.
        </p>
      </div>
    </div>
  );
}
