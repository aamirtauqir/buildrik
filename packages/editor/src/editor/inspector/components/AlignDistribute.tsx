/**
 * AlignDistribute — "Align and distribute" at the head of a multi-selection's
 * Style tab (2L9 B04 247:29578; owner 2026-10-31: the board's home, one click
 * away). Moved from the multi-select bar above the tabs.
 *
 *   Align and distribute
 *   Reference    [Selection bounds]
 *   Align        [⇤ ↔ ⇥ ↥ ↕ ↧]
 *   Distribute   [Horizontal | Vertical]      (needs 3 or more)
 *
 * The reference is the selection's own bounds — the one AlignmentHandler
 * measures against — so the select offers that and nothing it cannot do.
 * Align / Distribute are actions, not a state: no option stays lit.
 * They move elements by left/top from their rendered boxes, so they are shut,
 * with the reason, while any member sits in the normal flow (static).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { AlignmentHandler, isMovable, type RenderedBox } from "@/engine/canvas/AlignmentHandler";
import { Button } from "@/editor/chrome-ui";
import { SelectRow } from "../shared/controls/InputControls";
import { GROUP_TITLE } from "../shared/controls/controlClasses";

export interface AlignDistributeProps {
  composer: Composer | null | undefined;
  selectedIds: readonly string[];
}

/** One option of a board-22 segment: 20 tall, radius 3, white + border on hover. */
const OPTION =
  "tw:h-5 tw:min-w-0 tw:flex-1 tw:rounded-[3px] tw:border tw:border-transparent tw:bg-transparent tw:p-0 " +
  "tw:text-[12px] tw:font-normal tw:leading-4 tw:text-[var(--bk-ink-soft)] " +
  "tw:enabled:hover:border-[var(--bk-border)] tw:enabled:hover:bg-[var(--bk-bg-panel)] tw:enabled:hover:text-[var(--bk-accent-text)] " +
  "tw:disabled:opacity-100 tw:disabled:text-[var(--bk-ink-disabled)]";
const SEGMENT = "tw:flex tw:h-6 tw:min-w-0 tw:flex-1 tw:gap-0 tw:rounded-[4px] tw:bg-[var(--bk-bg-subtle)] tw:p-0.5";
const ROW = "tw:flex tw:h-8 tw:items-center tw:gap-2";
const REFERENCE = [{ value: "selection", label: "Selection bounds" }];
const LABEL = "tw:w-[88px] tw:shrink-0 tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

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

export function AlignDistribute({ composer, selectedIds }: AlignDistributeProps) {
  const handler = React.useMemo(() => (composer ? new AlignmentHandler(composer, measureRenderedBox) : null), [composer]);
  const ids = [...selectedIds];
  const n = ids.length;
  const inFlow = ids.some((id) => {
    const box = measureRenderedBox(id);
    return !box || !isMovable(box);
  });
  const canAlign = Boolean(handler) && n >= 2 && !inFlow;
  const canDistribute = canAlign && n >= 3;
  const [reference, setReference] = React.useState(REFERENCE[0].value);

  const align: [string, string, () => void][] = [
    ["Align left", "⇤", () => handler?.alignHorizontal(ids, "left")],
    ["Align centre", "↔", () => handler?.alignHorizontal(ids, "center")],
    ["Align right", "⇥", () => handler?.alignHorizontal(ids, "right")],
    ["Align top", "↥", () => handler?.alignVertical(ids, "top")],
    ["Align middle", "↕", () => handler?.alignVertical(ids, "middle")],
    ["Align bottom", "↧", () => handler?.alignVertical(ids, "bottom")],
  ];

  return (
    <section className="tw:flex tw:flex-col tw:px-3 tw:pb-3" aria-labelledby="inspector-align-title" data-testid="inspector-align-distribute">
      <h3 className={`${GROUP_TITLE} tw:mt-3! tw:mb-2! tw:m-0`} id="inspector-align-title">
        Align and distribute
      </h3>
      <SelectRow label="Reference" value={reference} placeholder={null} options={REFERENCE} onChange={setReference} />
      <div className={ROW}>
        <span className={LABEL} id="inspector-multi-align-label" data-testid="inspector-multi-align-label">
          Align
        </span>
        <div
          className={SEGMENT}
          role="group"
          aria-labelledby="inspector-multi-align-label"
          title={inFlow ? IN_FLOW_REASON : undefined}
        >
          {align.map(([label, glyph, run]) => (
            <Button key={label} type="button" aria-label={label} title={label} className={OPTION} disabled={!canAlign} onClick={run}>
              <span aria-hidden="true">{glyph}</span>
            </Button>
          ))}
        </div>
      </div>
      <div className={ROW}>
        <span className={LABEL} id="inspector-multi-distribute-label">
          Distribute
        </span>
        <div
          className={SEGMENT}
          role="group"
          aria-labelledby="inspector-multi-distribute-label"
          title={canDistribute ? undefined : inFlow ? IN_FLOW_REASON : "Distribute needs 3 or more elements"}
        >
          <Button type="button" className={OPTION} disabled={!canDistribute} data-testid="inspector-multi-distribute-h" onClick={() => handler?.distribute(ids, "horizontal")}>
            Horizontal
          </Button>
          <Button type="button" className={OPTION} disabled={!canDistribute} data-testid="inspector-multi-distribute-v" onClick={() => handler?.distribute(ids, "vertical")}>
            Vertical
          </Button>
        </div>
      </div>
    </section>
  );
}
