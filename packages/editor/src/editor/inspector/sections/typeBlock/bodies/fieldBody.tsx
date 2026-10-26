/**
 * Type-block body — a form field (input, textarea, select, upload), titled
 * "Field" (2L9 board 156:1316 F02, 156:2506 F04, 156:1911 F03):
 *
 *   ‹ Contact form   (above the block — TypeBlockSection; selects the form)
 *   Field
 *   Type         [Email ▾]
 *   Label        [Email]           its <label>, else its accessible name
 *   Placeholder  [you@example.com]
 *   Name         [email]
 *   Name is the key stored with each submission.
 *   ☑ Required
 *   Default value [ ]
 *
 * then the per-type rows the board does not draw but the field has (Rows,
 * Options). Disabled, Multiple and the ID are Advanced attributes; the
 * "‹ {form}" back link heads the tab (TypeBlockSection). Validation is its
 * own closed section
 * (`sections/registry/content.tsx`). The tree reading — label, unique key,
 * input ↔ textarea swap — is `../../formFieldModel`. Every write passes the
 * lock gate on the field (P-1) and is one Undo.
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { Element } from "@/engine/elements/Element";
import { writeElement } from "@/engine/commands/commandOperations";
import { SelectRow } from "@/editor/inspector/shared/controls";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { CommitRow, NoteRow } from "@/editor/inspector/sections/behaviourRows";
import { fieldLabelText, fieldType, formOf, nameTaken, replaceField, writeFieldLabel } from "@/editor/inspector/sections/formFieldModel";
import { handleTextareaDefaultChange } from "../attributeWriter";
import { isAttrOn } from "../blockRows";
import { PropertyRows, clobberingWarning, type PropertyConfig } from "../PropertyField";
import { useElementVersion } from "./bodyRows";

/** Every input type the field can be, then the textarea swap. */
const TYPE_OPTIONS = [
  ["text", "Text"],
  ["email", "Email"],
  ["password", "Password"],
  ["number", "Number"],
  ["tel", "Phone"],
  ["url", "URL"],
  ["date", "Date"],
  ["time", "Time"],
  ["datetime-local", "Date & time"],
  ["search", "Search"],
  ["file", "File"],
  ["hidden", "Hidden"],
  ["range", "Slider"],
  ["color", "Color"],
  ["textarea", "Textarea"],
].map(([value, label]) => ({ value, label }));

/** Rows a type has beyond the board's set (no board draws them; kept). */
const EXTRA_ROWS: Record<string, readonly PropertyConfig[]> = {
  textarea: [{ id: "rows", label: "Rows", type: "text", placeholder: "4" }],
  select: [{ id: "options", label: "Options (one per line)", type: "textarea", placeholder: "Option 1\nOption 2" }],
};

export const FieldBody: React.FC<TypeBlockBodyProps> = (props) => {
  const { composer, element } = props;
  useElementVersion(composer);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [nameDraft, setNameDraft] = React.useState<string | null>(null);
  React.useEffect(() => {
    setNameError(null);
    setNameDraft(null);
  }, [element.id]);
  const field = composer?.elements.getElement(element.id) as Element | undefined;
  if (!composer || !field) return null;
  const form = formOf(field);
  const scope = form ?? field.getParent() ?? field;
  const type = fieldType(field);
  /* The element's own type names the tag for the two that differ. */
  const tag = element.type === "textarea" || element.type === "select" ? element.type : field.getTagName().toLowerCase();

  const write = (label: string, fn: () => void) => writeElement(composer, field, label, fn);
  const setAttr = (attr: string, value: string) =>
    write(`field-${attr}`, () => {
      if (value.trim()) field.setAttribute(attr, value.trim());
      else field.removeAttribute(attr);
    });
  const setType = (next: string) => {
    if (next === type) return;
    let swapped = null as Element | null;
    write("field-type", () => {
      if (type === "textarea" || next === "textarea") swapped = replaceField(composer, field, next);
      else field.setAttribute("type", next);
    });
    /* The swap re-creates the field: the selection follows it. */
    if (swapped) composer.selection.select(swapped);
  };
  const setName = (name: string) => {
    if (form && nameTaken(form, field, name)) {
      setNameError(`“${name.trim()}” is already used. Choose a unique submission key.`);
      return;
    }
    setNameError(null);
    setAttr("name", name);
  };
  const setDefault = (value: string) =>
    write("field-default", () => {
      if (type === "textarea") handleTextareaDefaultChange(field, value);
      else if (value) field.setAttribute("value", value);
      else field.removeAttribute("value");
    });
  const defaultValue = (type === "textarea" ? field.getAttribute("value") || field.getContent?.() : field.getAttribute("value")) ?? "";
  const extraRows = EXTRA_ROWS[tag] ?? [];

  return (
    <>
      <SelectRow label="Type" placeholder={null} value={type} onChange={setType} options={tag === "select" ? [{ value: type, label: "Select" }] : TYPE_OPTIONS} />
      <CommitRow label="Label" value={fieldLabelText(scope, field)} onCommit={(v) => write("field-label", () => writeFieldLabel(scope, field, v))} testId="form-field-label" />
      {tag !== "select" ? (
        <CommitRow label="Placeholder" value={field.getAttribute("placeholder") ?? ""} onCommit={(v) => setAttr("placeholder", v)} testId="form-field-placeholder" />
      ) : null}
      <CommitRow label="Name" value={field.getAttribute("name") ?? ""} onCommit={setName} onDraft={setNameDraft} testId="form-field-name" />
      {nameError ? (
        <NoteRow tone="error" testId="form-field-name-error">
          {nameError}
        </NoteRow>
      ) : clobberingWarning(nameDraft ?? field.getAttribute("name") ?? "") ? (
        /* Stripped by the sanitizer at publish (DOM clobbering): said while
           it is typed, before it lands. */
        <NoteRow tone="error" testId="form-field-name-clobber">
          {clobberingWarning(nameDraft ?? field.getAttribute("name") ?? "")}
        </NoteRow>
      ) : (
        <NoteRow testId="form-field-name-note">Name is the key stored with each submission.</NoteRow>
      )}
      <CheckRow
        label="Required"
        checked={isAttrOn(field.getAttribute("required"))}
        onChange={(on) =>
          write("field-required", () => {
            if (on) field.setAttribute("required", "");
            else field.removeAttribute("required");
          })
        }
        testId="form-field-required"
      />
      {tag !== "select" ? <CommitRow label="Default value" value={defaultValue} onCommit={setDefault} testId="form-field-default" /> : null}
      {extraRows.length ? <PropertyRows composer={composer} element={element} targetIds={[element.id]} rows={extraRows} /> : null}
    </>
  );
};
