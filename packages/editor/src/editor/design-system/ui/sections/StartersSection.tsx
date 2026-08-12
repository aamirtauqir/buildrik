/**
 * StartersSection — Brand › Starters, board 152:137.
 *
 * Starters were reachable only through a modal: a 🎨 button in the Brand
 * toolbar emitting UI_OPEN_STARTERS. The board draws them as a destination with
 * its own crumb, which is why M5 left the row out at the time — a row that
 * opened a modal would have misreported what it was. This is that row's
 * destination.
 *
 * The board leads with what you LOSE — "Applying a starter overwrites your
 * tokens." — where the modal's footer leads with reassurance ("restyles tokens
 * but keeps your elements"). Both are true; the board's order is the honest one
 * for an action that replaces work you may have done by hand.
 *
 * Two columns, not the modal's three: this renders in a 320 panel.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";
import { STARTER_DS_REGISTRY } from "../../starters";
import { useApplyStarter } from "../../state/useApplyStarter";
import { StarterGrid } from "../StarterGalleryModal";

export interface StartersSectionProps {
  projectId?: string | null;
}

export const StartersSection: React.FC<StartersSectionProps> = ({ projectId }) => {
  const [selectedId, setSelectedId] = React.useState<string>(
    STARTER_DS_REGISTRY[0]?.id ?? "",
  );
  const applyStarter = useApplyStarter(projectId);
  const selected = STARTER_DS_REGISTRY.find((s) => s.id === selectedId);

  return (
    <div className="tw:flex tw:flex-col">
      <div
        role="note"
        className="tw:px-3 tw:py-2 tw:text-xs tw:leading-normal"
        style={{ background: "var(--bk-warning-tint)", color: "var(--bk-warning-text)" }}
      >
        Applying a starter overwrites your tokens.
      </div>

      <StarterGrid columns={2} selectedId={selectedId} onSelect={setSelectedId} />

      <div className="tw:flex tw:justify-end tw:px-3 tw:pb-3">
        <Button
          size="xs"
          type="button"
          disabled={!selected}
          data-apply-starter
          onClick={() => selectedId && applyStarter(selectedId)}
        >
          Apply {selected?.name ?? ""}
        </Button>
      </div>
    </div>
  );
};

export default StartersSection;
