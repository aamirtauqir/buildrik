/**
 * MultiSelectBar — the multi-selection's own rows under the header (DD-12,
 * board 22):
 *
 *                                Group
 *   Edits apply to all 3. One Undo restores all 3.
 *
 * The panel below is the SAME panel as for one element — the sections every
 * selected type has, with "Mixed" where they differ — not a separate batch
 * panel. Align / Distribute head the Style tab (AlignDistribute, B04).
 *
 * 2L9 B01: what a batch edit reaches is said up front — "2 of 3 eligible ·
 * Locked image is excluded and remains unchanged." (writes already skip
 * locked targets through the lock gate) — and a Selection list ("Inspect
 * Heading 1", …) narrows to one object, with "No DOM ID batch write. Choose
 * one object for identity, binding and child-list tasks."
 *
 * @license BSD-3-Clause
 */

import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { ActionRow } from "../sections/behaviourRows";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { lockOwner } from "@/engine/commands/commandOperations";

export interface MultiSelectBarProps {
  composer: Composer | null | undefined;
  selectedIds: readonly string[];
}

export function MultiSelectBar({ composer, selectedIds }: MultiSelectBarProps) {
  const ids = [...selectedIds];
  const n = ids.length;
  /* The engine groups siblings only; say why rather than a dead click. */
  const parents = ids.map((id) => composer?.elements.getElement(id)?.getParent?.()?.getId?.() ?? null);
  const sameParent = parents.length > 1 && parents.every((p) => p !== null && p === parents[0]);
  const els = ids.map((id) => composer?.elements.getElement(id) ?? null);
  /* Names as the Layers panel shows them; two plain "Heading"s become
     "Heading 1", "Heading 2" so the Inspect rows can be told apart. */
  const base = els.map((el) => getLayerName(el) ?? elementTypeLabel(el?.getType?.() ?? ""));
  const names = base.map((b, i) => (base.filter((x) => x === b).length > 1 ? `${b} ${base.slice(0, i + 1).filter((x) => x === b).length}` : b));
  const locked = els.map((el) => Boolean(lockOwner(el)));
  const eligible = locked.filter((l) => !l).length;
  const lockedNames = names.filter((_, i) => locked[i]);

  return (
    <div className="tw:flex tw:flex-col" data-testid="inspector-multi-bar">
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
      {/* 2L9 247:28097: "Selection" as a group, one full-width bordered
          "Inspect {name}" per object. */}
      <div className="tw:flex tw:flex-col tw:gap-2 tw:px-3 tw:pb-2" role="group" aria-labelledby="inspector-multi-selection-label">
        <span className={`${GROUP_TITLE} tw:mt-2!`} id="inspector-multi-selection-label">
          Selection
        </span>
        {ids.map((id, i) => (
          <Button
            key={id}
            type="button"
            color="light"
            size="xs"
            data-testid="inspector-multi-inspect"
            className={WIDE_BUTTON}
            onClick={() => {
              const el = els[i];
              if (el) composer?.selection.select(el);
            }}
          >
            Inspect {locked[i] ? `locked ${names[i].toLowerCase()}` : names[i]}
          </Button>
        ))}
        <p className="tw:m-0 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-multi-identity-note">
          No DOM ID batch write. Choose one object for identity, binding and child-list tasks.
        </p>
      </div>
    </div>
  );
}
