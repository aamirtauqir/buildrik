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

export interface TypeBlockSectionProps extends TypeBlockBodyProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function TypeBlockSection({ isOpen, onToggle, ...body }: TypeBlockSectionProps) {
  const id = capabilitiesFor(body.element.type).typeBlock;
  const Body = id ? TYPE_BLOCKS[id] : undefined;
  if (!Body) return null;
  return (
    <Section title={elementTypeLabel(body.element.type)} isOpen={isOpen} onToggle={onToggle} id="inspector-section-type">
      <Body {...body} />
    </Section>
  );
}
