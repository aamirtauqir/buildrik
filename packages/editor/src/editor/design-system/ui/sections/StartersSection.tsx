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
import { SectionStatusBadge } from "../SectionStatusBadge";
import { StarterGrid } from "../StarterGrid";
import { STARTER_DS_REGISTRY } from "../../starters";
import { useApplyStarter } from "../../state/useApplyStarter";

export interface StartersSectionProps {
  projectId?: string | null;
}

export const StartersSection: React.FC<StartersSectionProps> = ({ projectId }) => {
  const [selectedId, setSelectedId] = React.useState<string>("");
  const [applied, setApplied] = React.useState<string | null>(null);
  const applyStarter = useApplyStarter(projectId);

  /* The pill is the board's answer to the click, and 306:2186 draws it as a
     standing part of the screen — no fade, no timer. It used to clear itself
     after 4s "so a second starter reads as its own event", which cost more
     than it bought: the staged change it reports outlives the badge by
     however long the user takes to reach Save, so the screen stopped saying
     what state it was in while still being in it. It is per-VISIT rather than
     forever — `applied` is local state and this section unmounts the moment
     the panel walks back to the root — and a second starter overwrites the
     name, so a second click still reads as its own event. */

  const choose = (id: string) => {
    const starter = STARTER_DS_REGISTRY.find((s) => s.id === id);
    if (!starter) return;
    setSelectedId(id);
    applyStarter(id);
    setApplied(starter.name);
  };

  return (
    <div className="tw:flex tw:flex-col">
      {/* Board 306:2186 draws this as the family's Badge instance (333:2358) in
          a 16-inset "Badge row" (2173:11816) — the same component the Presets
          and Import / export screens already render. It was a third hand-rolled
          pill: no `font-medium`, a 12px inset, and `--bk-success-text` where the
          board names `green/700`. */}
      {applied ? <SectionStatusBadge status="starter-applied" role="status" /> : null}

      {/* Boards 152:145 / 306:2191 write this warning out in full, and every
          clause of it is true of `useApplyStarter`: `stageTokens` writes the
          CSS custom properties on `documentElement` immediately (the canvas
          preview), it clears `undoStack`/`redoStack` (per-token undo), it
          touches only the colour, spacing and type registries (the other
          eleven kinds keep their values), and nothing persists until the
          Review modal — the confirm that names every staged edit — reaches
          `setProjectSettings`. "Applying a starter overwrites your tokens."
          was a one-line paraphrase that got the scariest part backwards: it
          reads as immediate and irreversible, and it is neither.

          11/16 on a 248 measure inside a 16/14 inset, radius 8 — 152:144. */}
      <div
        role="note"
        data-testid="brand-starters-warning"
        /* `min-h`, not `h`: 152:144 and 306:2190 both fix this callout at 150,
           and a hard height would clip the paragraph on a widened drawer
           (`--drawer-w` is 560 for Media and 700 expanded). The board's own
           frame is `h-[150px] overflow-clip`; the floor is the honest half. */
        className="tw:min-h-[150px] tw:rounded-lg tw:px-4 tw:py-3.5 tw:bg-[var(--bk-warning-tint)]"
      >
        <p
          data-testid="brand-starters-warning-text"
          className="tw:m-0 tw:text-[11px] tw:leading-4 tw:text-[var(--bk-warning-text)]"
        >
          Selecting a starter previews it on the canvas. Applying replaces your
          colour, type and spacing tokens and clears per-token undo; the other
          eleven kinds keep their values. The confirm names every staged edit it
          will overwrite before it does.
        </p>
      </div>

      <StarterGrid columns={2} selectedId={selectedId} onSelect={choose} showDescription={false} />
    </div>
  );
};

export default StartersSection;
