/**
 * GapRow — the one writer of `gap` / `row-gap` / `column-gap` (D-11: the gap
 * rows left Spacing; boards 16 and 17 draw "Gap [16 px]" inside the Flex
 * block and the grid Layout). Row and column gap wait behind the owner's
 * More settings.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { InputWithUnit } from "@/editor/inspector/shared/controls";

const GAP_UNITS = ["px", "rem", "em", "%"];

export interface GapRowProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  /** Also draw Row gap / Column gap (the owner's More settings). */
  advanced?: boolean;
}

export function GapRow({ styles, onChange, advanced = false }: GapRowProps) {
  return (
    <>
      <InputWithUnit label="Gap" property="gap" units={GAP_UNITS} value={styles.gap || ""} onChange={(v) => onChange("gap", v)} />
      {advanced && (
        <>
          <InputWithUnit
            label="Row gap"
            property="row-gap"
            units={GAP_UNITS}
            value={styles["row-gap"] || ""}
            onChange={(v) => onChange("row-gap", v)}
          />
          <InputWithUnit
            label="Column gap"
            property="column-gap"
            units={GAP_UNITS}
            value={styles["column-gap"] || ""}
            onChange={(v) => onChange("column-gap", v)}
          />
        </>
      )}
    </>
  );
}
