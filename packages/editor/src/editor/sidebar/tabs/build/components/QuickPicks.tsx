/**
 * QuickPicks — Pill chips (cornerRadius 999) matching .pen PcGJY/dMgOj refs.
 * 3-per-row flex-wrap, no empty slots, filled picks + "+" chip at end.
 * @license BSD-3-Clause
 */

import { Plus } from "lucide-react";
import * as React from "react";
import { flatCatalog } from "../catalog/catalog";
import type { FlatElEntry } from "../catalog/types";
import type { DragStartFn, ElClickFn } from "../hooks/useBuildTab";
import { SvgIcon } from "./SvgIcon";

interface QuickPicksProps {
  picks: string[];
  onRemove: (blockId: string) => void;
  onPlusClick: () => void;
  onDragStart: DragStartFn;
  onElClick: ElClickFn;
  ftueSeen: boolean;
  onDismissFtue: () => void;
}

const blockIdMap = new Map(flatCatalog.map((el) => [el.blockId, el]));

export const QuickPicks: React.FC<QuickPicksProps> = ({
  picks,
  onRemove,
  onPlusClick,
  onDragStart,
  onElClick,
  ftueSeen,
  onDismissFtue,
}) => {
  const filledPicks = picks
    .map((id) => blockIdMap.get(id))
    .filter((el): el is FlatElEntry => el != null);

  const handleChipClick = React.useCallback(
    (el: FlatElEntry) => {
      if (!ftueSeen) onDismissFtue();
      onElClick(el);
    },
    [ftueSeen, onDismissFtue, onElClick]
  );

  return (
    <div className="bld-qp">
      <div className="bld-sec-label">QUICK PICKS</div>
      <div className="bld-qp-chips">
        {filledPicks.map((el) => (
          <div
            key={el.blockId}
            className="bld-qp-chip bld-qp-chip--filled"
            draggable
            onDragStart={(e) => onDragStart(e, el)}
            onClick={() => handleChipClick(el)}
            onContextMenu={(e) => {
              e.preventDefault();
              onRemove(el.blockId);
            }}
            title={`${el.name} — right-click to unpin`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleChipClick(el);
              }
            }}
          >
            <span className="bld-qp-chip-icon">
              <SvgIcon html={el.iconHtml} />
            </span>
            <span className="bld-qp-chip-name">{el.name}</span>
          </div>
        ))}

        {/* Ghost chips — teach users personalization exists */}
        {Array.from({ length: Math.max(0, 7 - picks.length) }).map((_, i) => (
          <div key={`ghost-${i}`} className="bld-qp-chip bld-qp-chip--ghost" aria-hidden="true">
            <Plus size={14} />
          </div>
        ))}

        {/* "+" chip — hidden when 7 picks (full) */}
        {picks.length < 7 && (
          <button
            className="bld-qp-chip bld-qp-chip--add"
            onClick={onPlusClick}
            title="Pin an element for quick access"
            aria-label="Pin element"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {!ftueSeen && (
        <div className="bld-ftue" onClick={onDismissFtue} role="status">
          Pin your favorite elements here
        </div>
      )}
    </div>
  );
};
