/**
 * Type-block bodies — form fields (boards 14, 15).
 *
 *   Input (+ textarea, select, upload) — Input type, Name, Placeholder,
 *     Default, Required, Disabled (board 14); the others by analogy.
 *   Choice (checkbox, radio, switch) — Edit text on canvas, Name, Checked by
 *     default, Required (board 15). The element is the <label>; every setting
 *     is written on the <input> it wraps — the one a submitted form reads —
 *     through the label's own lock gate, in one transaction.
 *
 * Input read-only and autocomplete, and textarea max length, live in
 * Attributes (§17.H).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import type { Composer } from "@/engine";
import type { Element } from "@/engine/elements/Element";
import { writableElements } from "@/engine/commands/commandOperations";
import { InputRow } from "../../../shared/controls";
import { handleGenericAttributeChange, runTxn, writeAttribute } from "../attributeWriter";
import { isAttrOn, useElementRead } from "../blockRows";
import { CheckRow } from "../../../shared/controls/CheckRow";
import { EditTextRow } from "../EditTextRow";
import { PropertyRows, type PropertyConfig } from "../PropertyField";

const INPUT_TYPES = [
  ["text", "Text"],
  ["email", "Email"],
  ["password", "Password"],
  ["number", "Number"],
  ["tel", "Phone"],
  ["url", "URL"],
  ["date", "Date"],
  ["time", "Time"],
  ["datetime-local", "Date & Time"],
  ["search", "Search"],
  ["file", "File"],
  ["hidden", "Hidden"],
  ["range", "Range"],
  ["color", "Color"],
].map(([value, label]) => ({ value, label }));

const NAME: PropertyConfig = { id: "name", label: "Name", type: "text", placeholder: "field_name" };
const PLACEHOLDER: PropertyConfig = { id: "placeholder", label: "Placeholder", type: "text", placeholder: "Enter text…" };
const DEFAULT: PropertyConfig = { id: "value", label: "Default", type: "text", placeholder: "" };

/** The text / select rows per field type; the boolean rows follow them. */
const ROWS: Record<string, readonly PropertyConfig[]> = {
  input: [{ id: "type", label: "Input type", type: "select", options: INPUT_TYPES }, NAME, PLACEHOLDER, DEFAULT],
  textarea: [NAME, PLACEHOLDER, DEFAULT, { id: "rows", label: "Rows", type: "text", placeholder: "4" }],
  select: [NAME, { id: "options", label: "Options (one per line)", type: "textarea", placeholder: "Option 1\nOption 2" }],
  upload: [NAME],
};

const FLAGS: Record<string, readonly [string, string][]> = {
  input: [["required", "Required"], ["disabled", "Disabled"]],
  textarea: [["required", "Required"], ["disabled", "Disabled"]],
  select: [["required", "Required"], ["disabled", "Disabled"], ["multiple", "Multiple"]],
  upload: [["required", "Required"], ["disabled", "Disabled"]],
};

function FlagRow({ name, label, ...props }: TypeBlockBodyProps & { name: string; label: string }) {
  const [on, reread] = useElementRead(props, (el) => isAttrOn(el.getAttribute?.(name)), false);
  return (
    <CheckRow
      label={label}
      checked={on}
      onChange={(checked) => {
        if (!props.composer) return;
        writeAttribute(props.composer, props.targetIds, name, checked ? "true" : "");
        reread();
      }}
    />
  );
}

const InputBody: React.FC<TypeBlockBodyProps> = (props) => {
  const type = ROWS[props.element.type] ? props.element.type : "input";
  return (
    <>
      <PropertyRows composer={props.composer} element={props.element} targetIds={props.targetIds} rows={ROWS[type]} />
      {FLAGS[type].map(([name, label]) => (
        <FlagRow key={name} {...props} name={name} label={label} />
      ))}
    </>
  );
};

// ============================================================================
// CHOICE — checkbox, radio, switch
// ============================================================================

const isInput = (el: Element) => el.getTagName?.()?.toLowerCase() === "input";
const innerInput = (el: Element): Element | undefined => el.getChildren?.().find(isInput);
/** The text beside the box — what "Edit text on canvas" edits. The label
 *  itself holds the input too, and the canvas will not edit a node that
 *  wraps another element. */
const innerText = (el: Element): Element | undefined => el.getChildren?.().find((c) => !isInput(c));

/** Write `name` on the input each writable choice wraps — the lock gate runs
 *  on the choice (a lock covers the element itself, not what it owns). */
function writeInner(composer: Composer, ids: readonly string[], name: string, value: string): void {
  const choices = writableElements(composer, ids.map((id) => composer.elements.getElement(id)));
  const inputs = choices.map(innerInput).filter((el): el is Element => Boolean(el));
  if (inputs.length === 0) return;
  runTxn(composer, "element-prop-change", () => {
    for (const input of inputs) handleGenericAttributeChange(input, name, value);
  });
}

const ChoiceBody: React.FC<TypeBlockBodyProps> = (props) => {
  const { composer, targetIds, element } = props;
  const [attrs, reread] = useElementRead(
    props,
    (el) => {
      const input = innerInput(el);
      return {
        textId: innerText(el)?.getId?.() ?? element.id,
        name: input?.getAttribute?.("name") ?? "",
        checked: isAttrOn(input?.getAttribute?.("checked")),
        required: isAttrOn(input?.getAttribute?.("required")),
      };
    },
    { textId: element.id, name: "", checked: false, required: false },
  );
  const write = (name: string, value: string) => {
    if (!composer) return;
    writeInner(composer, targetIds, name, value);
    reread();
  };
  return (
    <>
      <EditTextRow composer={composer} elementId={attrs.textId} />
      <InputRow label="Name" value={attrs.name} onChange={(v) => write("name", v)} placeholder="field_name" />
      <CheckRow label="Checked by default" checked={attrs.checked} onChange={(on) => write("checked", on ? "true" : "")} />
      <CheckRow label="Required" checked={attrs.required} onChange={(on) => write("required", on ? "true" : "")} />
    </>
  );
};

export const FORM_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  input: InputBody,
  choice: ChoiceBody,
};
