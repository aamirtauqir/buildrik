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
 * They move elements by left/top from their rendered boxes, so they are shut,
 * with the reason, while any member sits in the normal flow (static).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { AlignmentHandler, isMovable, type RenderedBox } from "@/engine/canvas/AlignmentHandler";
import { Button } from "@/editor/chrome-ui";
import { ActionRow } from "../sections/behaviourRows";

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

const IN_FLOW_REASON = "Align and Distribute move positioned elements only — set Position to Absolute or Relative first";

/** The element's box on the canvas, zoom removed (offsetWidth ignores transforms). */
function measureRenderedBox(id: string): RenderedBox | null {
  const node = document.querySelector<HTMLElement>(`[data-buildrick-id="${CSS.escape(id)}"]`);
  if (!node) return null;
  const rect = node.getBoundingClientRect();
  const scale = node.offsetWidth && rect.width ? rect.width / node.offsetWidth : 1;
  const computed = getComputedStyle(node);
  return {
    left: rect.left / scale,
    top: rect.top / scale,
    width: rect.width / scale,
    height: rect.height / scale,
    position: computed.position,
    cssLeft: parseFloat(computed.left) || 0,
    cssTop: parseFloat(computed.top) || 0,
  };
}

export function MultiSelectBar({ composer, selectedIds }: MultiSelectBarProps) {
  const handler = React.useMemo(() => (composer ? new AlignmentHandler(composer, measureRenderedBox) : null), [composer]);
  const ids = [...selectedIds];
  const n = ids.length;
  const inFlow = ids.some((id) => {
    const box = measureRenderedBox(id);
    return !box || !isMovable(box);
  });
  /* The engine groups siblings only; say why rather than a dead click. */
  const parents = ids.map((id) => composer?.elements.getElement(id)?.getParent?.()?.getId?.() ?? null);
  const sameParent = parents.length > 1 && parents.every((p) => p !== null && p === parents[0]);
  const canAlign = Boolean(handler) && n >= 2 && !inFlow;
  const canDistribute = canAlign && n >= 3;

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
        <div
          className={`${SEGMENT} tw:w-[204px]`}
          role="group"
          aria-labelledby="inspector-multi-align-label"
          title={inFlow ? IN_FLOW_REASON : undefined}
        >
          {align.map(([label, glyph, run]) => (
            <Button
              key={label}
              type="button"
              aria-label={label}
              title={label}
              className={OPTION}
              disabled={!canAlign}
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
          title={canDistribute ? undefined : inFlow ? IN_FLOW_REASON : "Distribute needs 3 or more elements"}
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
        Edits apply to all {n}. One Undo restores all {n}.
      </p>
    </div>
  );
}
