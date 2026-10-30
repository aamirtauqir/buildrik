/**
 * BatchEligibility — 2L9 247:28097 (B01): a selection mixing elements that
 * take typography with ones that do not (or are locked) gets the Style tab's
 * typography as an explicit batch:
 *
 *   Typography eligibility
 *   2 headings can change font size. Locked image is excluded and remains
 *   unchanged.
 *   Font size  [ Mixed ]
 *   [ Apply to 2 eligible headings ]
 *
 * Eligible = the selected elements whose type has the Typography section and
 * that the write gate lets through (not locked); everything else is named as
 * excluded. The size is a draft until Apply, which writes it to the eligible
 * ones only, in one step.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { Button } from "@/editor/chrome-ui";
import { lockOwner, writableElements } from "@/engine/commands/commandOperations";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { InputWithUnit } from "../shared/controls";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";

const NOTE = "tw:m-0 tw:py-1.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** "heading" → "headings"; one → itself. */
const kindOf = (els: readonly Element[], n: number) => {
  const types = new Set(els.map((e) => e.getType()));
  const word = types.size === 1 ? elementTypeLabel([...types][0]).toLowerCase() : "elements";
  return n === 1 ? word.replace(/s$/, "") : word.endsWith("s") ? word : `${word}s`;
};
const andList = (xs: readonly string[]) => (xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

/** Whether a type takes typography at all (its own or "text inside"). */
const takesTypography = (type: string): boolean => capabilitiesFor(type).typography !== "none";

export interface BatchEligibilityProps {
  composer: Composer;
  elements: readonly Element[];
}

export function BatchEligibility({ composer, elements }: BatchEligibilityProps) {
  const eligible = elements.filter((e) => takesTypography(e.getType()) && !lockOwner(e));
  const excluded = elements.filter((e) => !eligible.includes(e));
  const sizes = eligible.map((e) => e.getStyles()["font-size"] ?? "");
  const mixed = sizes.some((s) => s !== sizes[0]);
  const [draft, setDraft] = React.useState<string | null>(null);
  if (eligible.length === 0 || excluded.length === 0) return null;

  const kind = kindOf(eligible, eligible.length);
  const named = excluded.map((e) => {
    const name = getLayerName(e) ?? elementTypeLabel(e.getType()).toLowerCase();
    return lockOwner(e) ? `Locked ${name.charAt(0).toLowerCase()}${name.slice(1)}` : name;
  });
  const excludedText = `${andList(named).charAt(0).toUpperCase()}${andList(named).slice(1)} ${excluded.length === 1 ? "is" : "are"} excluded and ${excluded.length === 1 ? "remains" : "remain"} unchanged.`;

  const apply = () => {
    if (!draft) return;
    composer.beginTransaction("batch-multi-style");
    try {
      for (const e of writableElements(composer, eligible)) e.setStyle("font-size", draft);
    } finally {
      composer.endTransaction();
    }
    setDraft(null);
  };

  return (
    <div className="tw:flex tw:flex-col tw:px-3 tw:pb-3" data-testid="inspector-batch-eligibility">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Typography eligibility</div>
      <p className={NOTE}>
        {eligible.length} {kind} can change font size. {excludedText}
      </p>
      <InputWithUnit
        label="Font size"
        value={draft ?? (mixed ? "" : (sizes[0] ?? ""))}
        mixed={draft === null && mixed}
        placeholder=""
        units={["px", "em", "rem", "%", "vw"]}
        onChange={(v) => setDraft(v)}
      />
      <Button color="light" size="xs" className={`${WIDE_BUTTON} tw:mt-2`} disabled={!draft} onClick={apply} data-testid="inspector-batch-apply">
        Apply to {eligible.length} eligible {kind}
      </Button>
    </div>
  );
}
