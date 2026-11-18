/**
 * ResetStyleReview — 2L9 255:91826 (S20): Reset style asks first, naming the
 * layer and the exact properties it removes, as the tab's whole body:
 *
 *   Reset local style
 *   Hero heading · Desktop · Default state
 *   Remove 4 local properties: font family, font size, font weight and line height.
 *   Each property will inherit its own resolved parent value. Tablet, Mobile
 *   and authored states remain unchanged.
 *   [ Remove 4 local properties ]   [ Cancel ]
 *
 * What it removes is what the `reset-style` command clears — the element's
 * own Desktop · Default styles (`setStyles({})`); breakpoint layers and
 * :state rules live in the StyleEngine and stay. Remove runs the same
 * element action the canvas menu and ⌘K run (one Undo, "Styles reset ·
 * Undo"); the review opens from the Inspector's ⋯.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Button, useToast } from "@/editor/chrome-ui";
import { ELEMENT_ACTIONS } from "@/editor/shared/elementActions";
import { useInspectorField } from "../shared/controls/InspectorFieldContext";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { GROUP_TITLE, WIDE_BUTTON } from "../shared/controls/controlClasses";

const NOTE = "tw:m-0 tw:py-1.5 tw:text-[12px] tw:leading-4 tw:text-[var(--bk-ink-muted)]";

/** "font family, font size and line height". */
export function propertyList(properties: readonly string[]): string {
  const names = properties.map((p) => p.replace(/-/g, " "));
  return names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function ResetStyleReview({ composer, elementId, onClose }: { composer: Composer; elementId: string; onClose: () => void }) {
  const { addToast } = useToast();
  const { discrete } = useInspectorField();
  const el = composer.elements.getElement(elementId);
  if (!el) return null;
  const remove = () => {
    const rootId = composer.elements.getActivePage?.()?.root.id;
    discrete(() => ELEMENT_ACTIONS["reset-style"].run({ composer, element: el, isRoot: el.getId() === rootId, addToast }));
    onClose();
  };
  const properties = Object.keys(el.getStyles() as Record<string, unknown>);
  const n = properties.length;
  const noun = `${n} local propert${n === 1 ? "y" : "ies"}`;
  return (
    <div className="tw:flex tw:flex-col tw:px-3 tw:pb-3" role="group" aria-label="Reset local style" data-testid="inspector-reset-review">
      <div className={`${GROUP_TITLE} tw:mt-4!`}>Reset local style</div>
      <p className={NOTE}>{getLayerName(el) ?? elementTypeLabel(el.getType())} · Desktop · Default state</p>
      <p className={NOTE} data-testid="inspector-reset-properties">
        {n ? `Remove ${noun}: ${propertyList(properties)}.` : "This element sets no local properties."}
      </p>
      <p className={NOTE}>
        Each property will inherit its own resolved parent value. Tablet, Mobile and authored states remain unchanged.
      </p>
      <div className="tw:flex tw:flex-col tw:gap-2 tw:pt-1">
        <Button variant="primary" size="xs" className={`${WIDE_BUTTON} tw:text-white!`} disabled={n === 0} onClick={remove} data-testid="inspector-reset-remove">
          Remove {noun}
        </Button>
        <Button color="light" size="xs" className={WIDE_BUTTON} onClick={onClose} data-testid="inspector-reset-cancel">
          Cancel
        </Button>
      </div>
    </div>
  );
}
