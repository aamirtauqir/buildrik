/**
 * MultiSelectBar — the multi-selection's own row under the header (DD-12,
 * board 22): Align ×6, Distribute ×2 (disabled under 3), Group, and the note
 * "Edits apply to all N. One Undo restores all N." The panel below is the
 * SAME panel as for one element — the sections every selected type has, with
 * "Mixed" where they differ — not a separate batch panel.
 *
 * W1 stub with its final props: the alignment handlers lifted from
 * MultiSelectToolbar. Lane L3-A lays it out to board 22 and deletes the
 * toolbar.
 *
 * @license BSD-3-Clause
 */

import {
  AlignCenter,
  AlignCenterVertical,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
} from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { AlignmentHandler } from "@/engine/canvas/AlignmentHandler";
import { Button, IconButton } from "@/editor/chrome-ui";

export interface MultiSelectBarProps {
  composer: Composer | null | undefined;
  selectedIds: readonly string[];
}

export function MultiSelectBar({ composer, selectedIds }: MultiSelectBarProps) {
  const handler = React.useMemo(() => (composer ? new AlignmentHandler(composer) : null), [composer]);
  const ids = [...selectedIds];
  const n = ids.length;
  /* The engine groups siblings only; say why rather than a dead click. */
  const parents = ids.map((id) => composer?.elements.getElement(id)?.getParent?.()?.getId?.() ?? null);
  const sameParent = parents.length > 1 && parents.every((p) => p !== null && p === parents[0]);

  const align: [string, React.ReactNode, () => void][] = [
    ["Align left", <AlignLeft key="l" size={14} />, () => handler?.alignHorizontal(ids, "left")],
    ["Align centre", <AlignCenter key="c" size={14} />, () => handler?.alignHorizontal(ids, "center")],
    ["Align right", <AlignRight key="r" size={14} />, () => handler?.alignHorizontal(ids, "right")],
    ["Align top", <AlignStartVertical key="t" size={14} />, () => handler?.alignVertical(ids, "top")],
    ["Align middle", <AlignCenterVertical key="m" size={14} />, () => handler?.alignVertical(ids, "middle")],
    ["Align bottom", <AlignEndVertical key="b" size={14} />, () => handler?.alignVertical(ids, "bottom")],
  ];

  return (
    <div className="tw:flex tw:flex-col tw:gap-1 tw:px-3 tw:py-2" data-testid="inspector-multi-bar">
      <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-0.5" role="group" aria-label="Align">
        {align.map(([label, icon, run]) => (
          <IconButton key={label} label={label} size="sm" disabled={!handler || n < 2} onClick={run}>
            {icon}
          </IconButton>
        ))}
        <IconButton label="Distribute horizontally" size="sm" disabled={!handler || n < 3} onClick={() => handler?.distribute(ids, "horizontal")}>
          <AlignHorizontalDistributeCenter size={14} />
        </IconButton>
        <IconButton label="Distribute vertically" size="sm" disabled={!handler || n < 3} onClick={() => handler?.distribute(ids, "vertical")}>
          <AlignVerticalDistributeCenter size={14} />
        </IconButton>
        <Button
          color="light"
          size="xs"
          className="tw:ml-auto tw:h-6 tw:px-2 tw:text-[12px]"
          disabled={!sameParent}
          title={sameParent ? "Group" : "Group needs elements that share a parent"}
          data-testid="inspector-multi-group"
          onClick={() => composer?.commands.run("group")}
        >
          Group
        </Button>
      </div>
      <p className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-ink-muted)]" data-testid="inspector-multi-note">
        Edits apply to all {n}. One Undo restores all {n}.
      </p>
    </div>
  );
}
