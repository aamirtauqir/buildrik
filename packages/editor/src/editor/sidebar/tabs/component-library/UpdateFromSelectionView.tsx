/**
 * UpdateFromSelectionView — "Update {component} from a selection" inside the
 * Components area, in the list's place (2L9 B6-K12 217:40171, B6-K15
 * 217:40825). The canvas half (K13/K14) is ComponentSourcePickBar.
 *
 *   choose  "Choose a section on the canvas…" · Choose on canvas · Cancel
 *   review  the master now beside the source, then what the update would do —
 *           instances affected, overrides kept, overrides that no longer
 *           apply (ComponentManager.previewMasterUpdate, the same arithmetic
 *           the update itself runs) — and Choose another · Cancel · Update.
 *
 * Not drawn: the board's "Hero card is a Component library item…" line, which
 * belongs to versioned library updates (not in this version).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Button, useToast } from "@/editor/chrome-ui";
import type { Composer } from "@/engine";
import type { ComponentDefinition } from "@/shared/types/components";
import { usedOnPlaces } from "./UsedOnView";
import {
  cancelUpdateFromSelection,
  chooseOnCanvas,
  commitUpdateFromSelection,
  sourceLabel,
  type SourcePick,
} from "./sourcePick";

const TITLE = "tw:m-0 tw:text-[20px] tw:leading-[30px] tw:font-semibold tw:text-[var(--bk-ink)]";
const BTN = "tw:h-8 tw:rounded tw:text-[13px] tw:font-medium tw:focus:ring-0";
const SECONDARY = `${BTN} tw:border-[var(--bk-border)] tw:bg-[var(--bk-bg-panel)] tw:text-[var(--bk-ink)]`;
const ROW = "tw:flex tw:w-full tw:items-center tw:gap-3 tw:border-b tw:border-[var(--bk-border)] tw:py-2 tw:text-[13px] tw:leading-5";
const PREVIEW = "tw:flex tw:h-[180px] tw:w-full tw:items-center tw:justify-center tw:overflow-hidden tw:rounded tw:bg-[var(--bk-bg-subtle)]";

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export interface UpdateFromSelectionViewProps {
  composer: Composer;
  component: ComponentDefinition;
  pick: SourcePick;
}

export const UpdateFromSelectionView: React.FC<UpdateFromSelectionViewProps> = ({ composer, component, pick }) => {
  const { addToast } = useToast();
  const [busy, setBusy] = React.useState(false);
  const back = (
    /* 217:41119 — a 13/500 accent link back to the master's summary. */
    <Button
      variant="link"
      size="xs"
      className="tw:h-8 tw:justify-start tw:pl-3 tw:text-[13px] tw:font-medium"
      onClick={() => cancelUpdateFromSelection(composer)}
      data-testid="comp-update-back"
    >
      ‹ Back to {component.name}
    </Button>
  );

  if (pick.phase !== "review" || !pick.sourceId) {
    /* 217:40171 (K12). */
    return (
      <div className="tw:flex tw:flex-col tw:items-start" data-testid="comp-update-choose">
        {back}
        <h2 className={TITLE}>Update {component.name} from a selection</h2>
        <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-ink-soft)]">
          Choose a section on the canvas. Its content and styles become the new {component.name}. Overrides on other instances are kept
          where they still apply.
        </p>
        <div className="tw:flex tw:flex-col tw:gap-1 tw:pt-1">
          <Button size="xs" className={`${BTN} tw:w-40`} onClick={() => chooseOnCanvas(composer)} data-testid="comp-update-choose-canvas">
            Choose on canvas
          </Button>
          <Button color="light" size="xs" className={`${SECONDARY} tw:w-24`} onClick={() => cancelUpdateFromSelection(composer)} data-testid="comp-update-cancel">
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  /* 217:40825 (K15). The source can be deleted between choosing and Update. */
  const sourceGone = !composer.elements.getElement(pick.sourceId);
  const source = sourceLabel(composer, pick.sourceId);
  const preview = composer.components.previewMasterUpdate(component.id, pick.sourceId);
  const places = usedOnPlaces(composer, component.id);
  const pages = new Set(places.map((p) => p.page.id)).size;
  const instances = preview?.instances ?? 0;
  const lost = (preview?.lost ?? []).map(({ elementId, count: n }) => {
    const where = sourceLabel(composer, elementId);
    return `${n} · ${where.page ? `${where.page} › ` : ""}${where.name}`;
  });

  const update = async () => {
    setBusy(true);
    addToast(await commitUpdateFromSelection(composer, component, pick.sourceId!));
    setBusy(false);
  };

  return (
    <div className="tw:flex tw:flex-col tw:items-start" data-testid="comp-update-review">
      {back}
      <h2 className={TITLE}>
        Update {component.name} from {source.full}
      </h2>
      <div className="tw:flex tw:w-full tw:gap-6 tw:pt-2">
        {/* 217:41124 — two 536 columns, 24 apart: a 13/500 label over a 180 preview. */}
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-2">
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">{component.name} now</p>
          <div className={PREVIEW} data-testid="comp-update-now">
            {component.thumbnail ? <img src={component.thumbnail} alt={component.name} className="tw:max-h-full tw:max-w-full tw:object-contain" /> : null}
          </div>
        </div>
        <div className="tw:flex tw:min-w-0 tw:flex-1 tw:flex-col tw:gap-2">
          <p className="tw:m-0 tw:text-[13px] tw:leading-5 tw:font-medium tw:text-[var(--bk-ink)]">From {source.name}</p>
          <div className={PREVIEW} data-testid="comp-update-from" />
        </div>
      </div>
      {[
        ["Instances affected", instances === 0 ? "None" : `${instances} on ${count(pages, "page", "pages")}`, "affected"],
        ["Overrides kept", String(preview?.overridesKept ?? 0), "kept"],
        ["Overrides that no longer apply", lost.length === 0 ? "None" : lost.join("; "), "lost"],
      ].map(([label, value, id]) => (
        <div key={id} className={ROW} data-testid={`comp-update-${id}`}>
          <span className="tw:w-[260px] tw:shrink-0 tw:font-medium tw:text-[var(--bk-ink)]">{label}</span>
          <span className="tw:min-w-0 tw:flex-1 tw:text-[var(--bk-ink-soft)]">{value}</span>
        </div>
      ))}
      {sourceGone ? (
        <p className="tw:m-0 tw:pt-3 tw:text-[13px] tw:leading-5 tw:text-[var(--bk-warning-text)]" role="status" data-testid="comp-update-gone">
          The chosen section is no longer on the page. Choose another.
        </p>
      ) : null}
      {/* 217:41140 — right-aligned, 8 apart, 12 above. */}
      <div className="tw:flex tw:w-full tw:justify-end tw:gap-2 tw:pt-3">
        <Button color="light" size="xs" className={`${SECONDARY} tw:w-[140px]`} onClick={() => chooseOnCanvas(composer)} data-testid="comp-update-another">
          Choose another
        </Button>
        <Button color="light" size="xs" className={`${SECONDARY} tw:w-24`} onClick={() => cancelUpdateFromSelection(composer)} data-testid="comp-update-cancel">
          Cancel
        </Button>
        <Button size="xs" className={`${BTN} tw:w-24`} disabled={busy || sourceGone} onClick={() => void update()} data-testid="comp-update-commit">
          Update
        </Button>
      </div>
    </div>
  );
};
