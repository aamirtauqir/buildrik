/**
 * AttributesSection — Behaviour › Attributes (board 2): closed by default
 * with a one-line summary ("id: hero-title · 1 attribute"); open, the
 * element's ID, title, tab index, its §17.H per-type rows and custom data-*
 * attributes. Replaced the Settings tab's "Advanced" section.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { Composer } from "@/engine";
import { Section } from "../../shared/controls";
import { attributeFieldsFor } from "../../config/attributeFields";
import { PropertyRows } from "../typeBlock/PropertyField";
import { DataAttributeEditor } from "./DataAttributeEditor";

export interface AttributesSectionProps {
  composer: Composer | null;
  element: { id: string; type: string };
  targetIds: readonly string[];
  isOpen: boolean;
  onToggle: () => void;
}

/** "id: hero-title · 1 attribute" — the id when set, then how many other
 *  attributes the section holds a value for. Null when there is nothing. */
export function attributesSummary(composer: Composer | null | undefined, element: { id: string; type: string }): string | null {
  const el = composer?.elements.getElement(element.id);
  if (!el) return null;
  const id = el.getAttribute?.("id") || "";
  const named = attributeFieldsFor(element.type).filter((f) => f.id !== "id" && el.getAttribute?.(f.id));
  const data = Object.keys(el.getAttributes?.() ?? {}).filter((k) => k.startsWith("data-") && !k.startsWith("data-buildrick"));
  const count = named.length + data.length;
  const parts = [id ? `id: ${id}` : null, count > 0 ? `${count} attribute${count === 1 ? "" : "s"}` : null].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function AttributesSection({ composer, element, targetIds, isOpen, onToggle }: AttributesSectionProps) {
  const rows = React.useMemo(() => attributeFieldsFor(element.type), [element.type]);
  return (
    <Section title="Attributes" isOpen={isOpen} onToggle={onToggle} id="inspector-section-attributes">
      <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={rows} />
      <div className="tw:pt-2" data-testid="inspector-data-attributes">
        <DataAttributeEditor elementId={element.id} composer={composer} />
      </div>
    </Section>
  );
}
