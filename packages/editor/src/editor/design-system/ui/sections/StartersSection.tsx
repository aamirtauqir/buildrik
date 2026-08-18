/**
 * StartersSection — Brand › Starters, boards 152:137 and 306:2186.
 *
 * The board leads with what you LOSE — "Applying a starter overwrites your
 * tokens." — above the grid, because that is the fact you need before the
 * click, not after it.
 *
 * There is no Apply button on either board: the CARD is the control, and
 * 306:2186 answers it with a "Starter applied" pill. The section used to
 * select on click and commit from a separate "Apply <name>" button below the
 * grid — a second step the design does not draw, and a label that stopped
 * being true once applying became staging.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { StarterGrid } from "../StarterGalleryModal";
import { STARTER_DS_REGISTRY } from "../../starters";
import { useApplyStarter } from "../../state/useApplyStarter";

export interface StartersSectionProps {
  projectId?: string | null;
}

export const StartersSection: React.FC<StartersSectionProps> = ({ projectId }) => {
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [applied, setApplied] = React.useState<string | null>(null);
  const applyStarter = useApplyStarter(projectId);

  /* The pill is the board's answer to the click. It clears itself so a second
     starter reads as its own event rather than a badge that has always been
     there. */
  React.useEffect(() => {
    if (!applied) return;
    const t = setTimeout(() => setApplied(null), 4000);
    return () => clearTimeout(t);
  }, [applied]);

  const choose = (id: string) => {
    const starter = STARTER_DS_REGISTRY.find((s) => s.id === id);
    if (!starter) return;
    setSelectedId(id);
    applyStarter(id);
    setApplied(starter.name);
  };

  return (
    <div className="tw:flex tw:flex-col">
      {applied ? (
        <div className="tw:px-3 tw:pt-2">
          <span
            role="status"
            className="tw:inline-flex tw:items-center tw:rounded-full tw:border tw:border-[var(--bk-success)] tw:px-2.5 tw:py-0.5 tw:text-xs tw:text-[var(--bk-success-text)] tw:bg-[var(--bk-success-tint)]"
          >
            Starter applied
          </span>
        </div>
      ) : null}

      <div
        role="note"
        className="tw:px-3 tw:py-2 tw:text-xs tw:leading-normal"
        style={{ background: "var(--bk-warning-tint)", color: "var(--bk-warning-text)" }}
      >
        Applying a starter overwrites your tokens.
      </div>

      <StarterGrid columns={2} selectedId={selectedId} onSelect={choose} showDescription={false} />
    </div>
  );
};

export default StartersSection;
