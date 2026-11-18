/**
 * InsertTargetStrip — where a click in Add lands, said before the click
 * (boards 7:18981 / 302:3965): "Insert into Hero" over "Home / Hero · At end".
 *
 * It follows the live selection: select another container and the target
 * moves with it (`authority: code:insert-target-is-live-selection` — the code
 * captures no target, so the board's stale-target state 10:370 cannot arise).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { ElementType } from "@/shared/types";
import { EVENTS } from "@/shared/constants/events";
import { resolveInsertTarget, type InsertTarget } from "../insertTarget";

const EVENTS_THAT_MOVE_IT = [
  EVENTS.SELECTION_CHANGED,
  EVENTS.SELECTION_ADDED,
  EVENTS.SELECTION_REMOVED,
  EVENTS.SELECTION_CLEARED,
  EVENTS.ELEMENT_SELECTED,
  EVENTS.ELEMENT_RENAMED,
  EVENTS.PAGE_CHANGED,
  EVENTS.PROJECT_CHANGED,
] as const;

/** The type the strip previews — a plain box lands where most rows do. */
const PREVIEW_TYPE: ElementType = "container";

function useInsertTarget(composer: Composer | null): InsertTarget | null {
  const read = React.useCallback(() => (composer ? resolveInsertTarget(composer, PREVIEW_TYPE) : null), [composer]);
  const [target, setTarget] = React.useState(read);
  React.useEffect(() => {
    if (!composer) return;
    const sync = () => setTarget(read());
    sync();
    for (const evt of EVENTS_THAT_MOVE_IT) composer.on(evt, sync);
    return () => {
      for (const evt of EVENTS_THAT_MOVE_IT) composer.off(evt, sync);
    };
  }, [composer, read]);
  return target;
}

export function InsertTargetStrip({ composer }: { composer: Composer | null }) {
  const target = useInsertTarget(composer);
  if (!target) return null;
  return (
    <div
      data-testid="add-insert-target"
      aria-live="polite"
      className="tw:flex tw:flex-col tw:gap-0.5 tw:px-2 tw:pt-2 tw:pb-1.5"
    >
      <span className="tw:truncate tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]" data-testid="add-insert-target-name">
        {`Insert into ${target.parentName}`}
      </span>
      <span className="tw:truncate tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="add-insert-target-path" title={target.path}>
        {`${target.path} · ${target.afterName ? `after ${target.afterName}` : "At end"}`}
      </span>
    </div>
  );
}
