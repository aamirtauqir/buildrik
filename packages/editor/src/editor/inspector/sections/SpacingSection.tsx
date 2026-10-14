/**
 * Spacing Section — the SpacingBox and nothing else (DD-9b, boards 1, 16,
 * 17, 21, 26): margin outside, padding inside, "Link sides" under it.
 *
 * The padding / margin pairs and the Gap / Row gap / Column gap rows are gone
 * (DD-9): gap belongs to the flex / grid container that uses it
 * (`layout/GapRow.tsx`). Every side's input carries its CSS property, so an
 * override dot lights on the side that has one (board 26, "● 32").
 *
 * @license BSD-3-Clause
 */

import { Link } from "lucide-react";
import * as React from "react";
import type { Composer } from "@/engine";
import { Button } from "@/editor/chrome-ui";
import { Section, SpacingBox } from "../shared/controls";
import { parseCssShorthand } from "../shared/utils/parseCssShorthand";

type Side = "top" | "right" | "bottom" | "left";
const SIDES: readonly Side[] = ["top", "right", "bottom", "left"];

export interface SpacingSectionProps {
  styles: Record<string, string>;
  onChange: (property: string, value: string) => void;
  onBatchChange: (changes: Record<string, string>) => void;
  propertyStates?: Record<string, { hidden?: boolean; disabled?: boolean; reason?: string }>;
  isOpen?: boolean;
  onToggle?: (open: boolean) => void;
  mixedKeys?: ReadonlySet<string>;
  isMultiSelect?: boolean;
  /** Threaded so binding chips can jump to the Design panel. */
  composer?: Composer | null;
}

const LINK_BUTTON =
  "tw:h-6 tw:gap-1.5 tw:border-0 tw:bg-transparent tw:px-1 tw:text-[12px] tw:font-normal tw:hover:bg-transparent " +
  "tw:focus:ring-0 tw:focus-visible:[box-shadow:var(--bk-shadow-focus)]";

/** A box's four sides: longhands first, the shorthand behind them. */
function sidesOf(styles: Record<string, string>, box: "margin" | "padding"): Record<Side, string> {
  const short = parseCssShorthand(styles[box] || "");
  return {
    top: styles[`${box}-top`] || short.top,
    right: styles[`${box}-right`] || short.right,
    bottom: styles[`${box}-bottom`] || short.bottom,
    left: styles[`${box}-left`] || short.left,
  };
}

export const SpacingSection: React.FC<SpacingSectionProps> = ({
  styles,
  onChange,
  onBatchChange,
  propertyStates = {},
  isOpen,
  onToggle,
  composer,
}) => {
  const [linked, setLinked] = React.useState(false);
  const margin = sidesOf(styles, "margin");
  const padding = sidesOf(styles, "padding");

  const write = (box: "margin" | "padding") => (side: Side, value: string) => {
    if (linked) onBatchChange(Object.fromEntries(SIDES.map((s) => [`${box}-${s}`, value])));
    else onChange(`${box}-${side}`, value);
  };
  const disabled = (box: "margin" | "padding") =>
    Object.fromEntries(SIDES.map((s) => [s, propertyStates[`${box}-${s}`]?.disabled])) as Partial<Record<Side, boolean>>;

  return (
    <Section title="Spacing" isOpen={isOpen} onToggle={onToggle} id="inspector-section-spacing">
      <SpacingBox
        margin={margin}
        padding={padding}
        onMarginChange={write("margin")}
        onPaddingChange={write("padding")}
        disabledMargin={disabled("margin")}
        disabledPadding={disabled("padding")}
        composer={composer}
      />
      <div className="tw:px-3">
        <Button
          size="xs"
          color="light"
          data-testid="inspector-spacing-link"
          aria-pressed={linked}
          onClick={() => setLinked((v) => !v)}
          className={`${LINK_BUTTON} ${linked ? "tw:text-[var(--bk-accent-text)]" : "tw:text-[var(--bk-ink-soft)]"}`}
        >
          <Link size={12} aria-hidden="true" />
          Link sides
        </Button>
      </div>
    </Section>
  );
};

export default SpacingSection;
