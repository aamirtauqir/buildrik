/**
 * ComponentSourcePickBar — the canvas half of "Update {component} from a
 * selection" (2L9 B6-K13 217:40475, B6-K14 217:40648). While the session is
 * picking (component-library/sourcePick.ts), an accent-tint bar sits over the
 * canvas: it asks for a section, then names the one chosen, with Cancel and
 * Return to component review (enabled once a source is chosen).
 *
 * The source is the canvas selection, taken only from selections made while
 * the bar is up, and only when it can be a source (isPickableSource: not
 * locked, not under a lock, not content inside an instance, not a page root).
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { EVENTS } from "@/shared/constants";
import { Button } from "@/editor/chrome-ui";
import {
  cancelUpdateFromSelection,
  isPickableSource,
  returnToReview,
  setPickedSource,
  sourceLabel,
  useSourcePick,
} from "@/editor/sidebar/tabs/component-library/sourcePick";

export function ComponentSourcePickBar({ composer }: { composer: Composer | null }) {
  const pick = useSourcePick(composer);
  const picking = !!composer && pick?.phase === "picking";

  React.useEffect(() => {
    if (!composer || !picking) return;
    /* SelectionManager emits ELEMENT_SELECTED for a pick (single or multi)
       and SELECTION_CLEARED for none; the ids are read back from it. */
    const onSelect = () => {
      const ids = composer.selection.getSelectedIds();
      setPickedSource(composer, ids.length === 1 && isPickableSource(composer, ids[0]) ? ids[0] : null);
    };
    composer.on(EVENTS.ELEMENT_SELECTED, onSelect);
    composer.on(EVENTS.SELECTION_CLEARED, onSelect);
    return () => {
      composer.off(EVENTS.ELEMENT_SELECTED, onSelect);
      composer.off(EVENTS.SELECTION_CLEARED, onSelect);
    };
  }, [composer, picking]);

  /* The master was deleted while its source was being chosen: end it. */
  const master = picking ? composer?.components?.getComponent(pick.componentId) : null;
  React.useEffect(() => {
    if (composer && picking && !master) cancelUpdateFromSelection(composer);
  }, [composer, picking, master]);

  if (!composer || !pick || !picking || !master) return null;
  const name = master.name;
  const message = pick.sourceId
    ? `${sourceLabel(composer, pick.sourceId).full} is selected as the source for ${name}.`
    : `Choose the section to update ${name} from. Locked and nested component content can’t be chosen.`;

  return (
    /* 217:40815 — 880 wide, 48 high, accent tint, 16 in / 8 out, 8 between. */
    <div
      role="status"
      className="tw:mx-auto tw:my-2 tw:flex tw:min-h-12 tw:w-full tw:max-w-[880px] tw:items-center tw:gap-2 tw:rounded-md tw:bg-[var(--bk-accent-tint)] tw:py-2 tw:pr-2 tw:pl-4"
      data-testid="comp-source-pick-bar"
    >
      <p className="tw:m-0 tw:min-w-0 tw:flex-1 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink)]" data-testid="comp-source-pick-message">
        {message}
      </p>
      <Button
        color="light"
        size="xs"
        className="tw:h-8 tw:w-[88px] tw:shrink-0 tw:rounded tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:text-[13px] tw:font-medium tw:text-[var(--bk-ink)] tw:focus:ring-0"
        onClick={() => cancelUpdateFromSelection(composer)}
        data-testid="comp-source-pick-cancel"
      >
        Cancel
      </Button>
      <Button
        size="xs"
        className="tw:h-8 tw:w-[200px] tw:shrink-0 tw:rounded tw:text-[13px] tw:font-medium tw:focus:ring-0"
        disabled={!pick.sourceId}
        onClick={() => returnToReview(composer)}
        data-testid="comp-source-pick-return"
      >
        Return to component review
      </Button>
    </div>
  );
}
