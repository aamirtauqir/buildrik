/**
 * "‹ Activity" — the way back after an Activity row opened its subject in the
 * editor (Review, Published or Session). One row, drawn under the panel
 * header, in both places a row can land.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import { Button } from "@/editor/chrome-ui";

/** The sub-screen an Activity row opens Review / History with
 *  (`from-activity`, `from-activity:published`, `from-activity:session`);
 *  TabRouter reads it back to draw this row. */
export const FROM_ACTIVITY = "from-activity";

export const BackToActivityRow: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <div className="tw:flex tw:h-8 tw:flex-none tw:items-center tw:border-b tw:border-[var(--bk-border)] tw:px-3" data-testid="back-to-activity">
    <Button
      color="light"
      size="xs"
      onClick={onBack}
      className="tw:h-6 tw:border-transparent tw:bg-transparent tw:px-1 tw:text-[12px] tw:font-normal tw:text-[var(--bk-accent)]"
    >
      ‹ Activity
    </Button>
  </div>
);
