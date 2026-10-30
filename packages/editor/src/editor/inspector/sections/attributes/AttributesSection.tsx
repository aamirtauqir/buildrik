/**
 * AttributesSection — Content › Advanced attributes (2L9 boards 161:8480,
 * 156:1316): closed by default with "{n} set"; open, the element's title,
 * tab index, its §17.H per-type rows and custom data-* attributes. The ID is
 * Content › Semantics'. Replaced the Settings tab's "Advanced" section.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Section } from "@/editor/inspector/shared/controls";
import { attributeFieldsFor } from "@/editor/inspector/config/attributeFields";
import { PropertyRows } from "../typeBlock/PropertyField";
import { CustomAttributesList, customAttributesOf, DataAttributeEditor } from "./DataAttributeEditor";
import { CSSClassesSection } from "../CSSClassesSection";

export interface AttributesSectionProps {
  composer: Composer | null;
  element: { id: string; type: string };
  targetIds: readonly string[];
  isOpen: boolean;
  onToggle: () => void;
}

/** "2 set" — how many attributes the section holds a value for (the boards
 *  print "0 set" too). Null only when the element is gone. */
export function attributesSummary(composer: Composer | null | undefined, element: { id: string; type: string }): string | null {
  const el = composer?.elements.getElement(element.id);
  if (!el) return null;
  const named = attributeFieldsFor(element.type).filter((f) => el.getAttribute?.(f.id));
  const data = customAttributesOf(el.getAttributes?.() ?? {});
  return `${named.length + data.length} set`;
}

export function AttributesSection({ composer, element, targetIds, isOpen, onToggle }: AttributesSectionProps) {
  const rows = React.useMemo(() => attributeFieldsFor(element.type), [element.type]);
  const [classesOpen, setClassesOpen] = React.useState(false);
  return (
    <Section title="Advanced attributes" isOpen={isOpen} onToggle={onToggle} id="inspector-section-attributes">
      <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={rows} />
      <CustomAttributesList elementId={element.id} composer={composer} />
      <div className="tw:pt-2" data-testid="inspector-data-attributes">
        <DataAttributeEditor elementId={element.id} composer={composer} />
      </div>
      {/* CSS classes live here, not as a tab section — no 2L9 board draws
          them there, and the class-first model that will place them is
          pending (blocked:owner-class-first). Closed until opened. */}
      <CSSClassesSection selectedElement={element} composer={composer} isOpen={classesOpen} onToggle={setClassesOpen} />
    </Section>
  );
}
