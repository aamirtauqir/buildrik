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
  return (
    <Section title={elementTypeLabel(body.element.type)} isOpen={isOpen} onToggle={onToggle} id="inspector-section-type">
      <Body {...body} />
      {bindable ? <BindingPropertyRow composer={body.composer} elementId={body.element.id} onOpenCreateCollection={onOpenCreateCollection} /> : null}
    </Section>
  );
}
