/**
 * StartersSection — Brand › Starters, board 7316:85139 (C1 (ii); was the
 * drawer's 152:137 / 306:2186 grid).
 *
 * One card, a 48px row per starter: its name over its one-line description,
 * ending in ›. The ROW is the control, as the card was: a click stages the
 * starter's colour, type and spacing tokens in the draft (useApplyStarter) —
 * the header's caption says so ("Pick a starter, then apply it to the draft"),
 * the Draft chip lights, the live preview repaints, Save's review names every
 * overwrite. The chosen row stays tinted for the visit.
 *
 * Gone with the grid, none of it on the board: the gradient thumbnails, the
 * 150px warning callout and the "Starter applied" pill (the Draft chip and the
 * tinted row carry that now). StarterGrid had no other consumer and is deleted.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { STARTER_DS_REGISTRY } from "../../starters";
import { useApplyStarter } from "../../state/useApplyStarter";
import { BrandCard, BrandChevron, BrandRow } from "../BrandCard";

export interface StartersSectionProps {
  projectId?: string | null;
}

export const StartersSection: React.FC<StartersSectionProps> = ({ projectId }) => {
  const [selectedId, setSelectedId] = React.useState<string>("");
  const applyStarter = useApplyStarter(projectId);

  return (
    <BrandCard label="Starter design systems" role="radiogroup" data-testid="starter-list">
      {STARTER_DS_REGISTRY.map((s) => (
        <BrandRow
          key={s.id}
          role="radio"
          aria-checked={selectedId === s.id}
          aria-pressed={undefined}
          data-testid={`starter-row-${s.id}`}
          selected={selectedId === s.id}
          onSelect={() => {
            setSelectedId(s.id);
            applyStarter(s.id);
          }}
          trailing={<BrandChevron />}
          name={<span data-testid={`starter-name-${s.id}`}>{s.name}</span>}
          sub={s.description}
        />
      ))}
    </BrandCard>
  );
};

export default StartersSection;
