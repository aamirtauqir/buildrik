/**
 * Content › Validation — a form field's browser checks (2L9 board 156:1316:
 * shut under the Field block, reading "More settings" until one is set):
 * min / max length for text-like fields, min / max for numbers and dates —
 * the attributes the browser enforces on submit. One Undo each, lock-gated.
 *
 * @license BSD-3-Clause
 */
import * as React from "react";
import type { Composer } from "@/engine";
import { writeElement } from "@/engine/commands/commandOperations";
import { Section } from "../shared/controls";
import { CommitRow, NoteRow } from "./behaviourRows";
import { fieldType, validationRows } from "./formFieldModel";
import { useElementVersion } from "./typeBlock/bodies/bodyRows";

export interface ValidationSectionProps {
  elementId: string;
  composer: Composer | null;
  isOpen: boolean;
  onToggle: () => void;
}

/** "2 set" once a check is set, else the board's "More settings". */
export function validationSummary(composer: Composer | null | undefined, elementId: string): string {
  const el = composer?.elements.getElement(elementId);
  if (!el) return "More settings";
  const n = validationRows(fieldType(el)).filter((r) => el.getAttribute(r.attr)).length;
  return n ? `${n} set` : "More settings";
}

export function ValidationSection({ elementId, composer, isOpen, onToggle }: ValidationSectionProps) {
  useElementVersion(composer);
  const el = composer?.elements.getElement(elementId);
  if (!composer || !el) return null;
  const rows = validationRows(fieldType(el));
  return (
    <Section title="Validation" isOpen={isOpen} onToggle={onToggle} id="inspector-section-validation">
      {rows.length ? (
        rows.map((row) => (
          <CommitRow
            key={row.attr}
            label={row.label}
            value={el.getAttribute(row.attr) ?? ""}
            onCommit={(v) =>
              writeElement(composer, el, `field-${row.attr}`, () => {
                if (v.trim()) el.setAttribute(row.attr, v.trim());
                else el.removeAttribute(row.attr);
              })
            }
            testId={`form-field-${row.attr}`}
          />
        ))
      ) : (
        <NoteRow>This field type has no length or range checks.</NoteRow>
      )}
    </Section>
  );
}
