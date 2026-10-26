/**
 * TypeBlockSection — the frame of the type block (board 1's "Heading"
 * block): the element type's name as the section title, its defining
 * settings as the body. Always open (DD-11). The body is chosen by the TRUE
 * type through the capability table (Q2): a checkbox reads "Checkbox", never
 * "Container".
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import { Section } from "@/editor/inspector/shared/controls";
import { TYPE_BLOCKS, type TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import { elementTypeLabel } from "@/shared/constants/elementTypeLabels";
import { capabilitiesFor } from "@/shared/constants/elementCapabilities";
import { BindingPropertyRow } from "../binding/BindingPropertyRow";
import { Button } from "@/editor/chrome-ui";
import { getLayerName } from "@/editor/panels/layers/hooks/layersPersistence";
import { formOf } from "../formFieldModel";

export interface TypeBlockSectionProps extends TypeBlockBodyProps {
  isOpen: boolean;
  onToggle: () => void;
  /** CMS binding's "+ New collection…" door (no collections yet). */
  onOpenCreateCollection?: () => void;
}

export function TypeBlockSection({ isOpen, onToggle, onOpenCreateCollection, ...body }: TypeBlockSectionProps) {
  const caps = capabilitiesFor(body.element.type);
  const Body = caps.typeBlock ? TYPE_BLOCKS[caps.typeBlock] : undefined;
  if (!Body) return null;
  /* 2L9 B5-D01: the bindable property is a row of the block itself; one
     element's binding, so a multi-selection gets none. */
  const bindable = caps.cmsBindable && !caps.isStructuralChild && body.targetIds.length <= 1;
  /* 2L9 F02: a form's field is headed by "‹ {form}", above its block. */
  const field = caps.typeBlock === "input" ? body.composer?.elements.getElement(body.element.id) : null;
  const form = field ? formOf(field) : null;
  return (
    <>
      {form && body.composer ? (
        <Button
          type="button"
          variant="link"
          size="xs"
          data-testid="field-back-to-form"
          onClick={() => body.composer?.selection.select(form)}
          className="tw:self-center tw:h-8 tw:w-full tw:justify-center tw:text-[12px] tw:font-normal"
        >
          ‹ {getLayerName(form) ?? "Form"}
        </Button>
      ) : null}
      <Section title={caps.typeBlock === "input" ? "Field" : elementTypeLabel(body.element.type)} isOpen={isOpen} onToggle={onToggle} id="inspector-section-type">
        {/* 2L9 161:8480 / F2.02: the property's own row ("Text", its bind
            button) heads the block; its controls follow. */}
        {bindable ? <BindingPropertyRow composer={body.composer} elementId={body.element.id} onOpenCreateCollection={onOpenCreateCollection} /> : null}
        <Body {...body} />
      </Section>
    </>
  );
}
