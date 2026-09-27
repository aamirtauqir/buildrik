/**
 * Type-block bodies — form fields: Input (+ textarea, select, upload) and
 * Choice (checkbox, radio, switch) — boards 14, 15. Lane L2-A replaces these
 * generic W1 bodies (Choice then writes the inner <input>).
 *
 * The rows are the old Advanced rows for these types; input read-only and
 * autocomplete, and textarea max length, moved to Attributes (§17.H).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
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
const REQUIRED: PropertyConfig = { id: "required", label: "Required", type: "checkbox" };
const DISABLED: PropertyConfig = { id: "disabled", label: "Disabled", type: "checkbox" };

/** Board 14: Input type, Name, Placeholder, Default, Required, Disabled. */
const ROWS: Record<string, readonly PropertyConfig[]> = {
  input: [
    { id: "type", label: "Input type", type: "select", options: INPUT_TYPES },
    NAME,
    PLACEHOLDER,
    { id: "value", label: "Default", type: "text" },
    REQUIRED,
    DISABLED,
  ],
  textarea: [NAME, PLACEHOLDER, { id: "value", label: "Default", type: "text" }, { id: "rows", label: "Rows", type: "text", placeholder: "4" }, REQUIRED, DISABLED],
  select: [
    NAME,
    { id: "options", label: "Options (one per line)", type: "textarea", placeholder: "Option 1\nOption 2" },
    REQUIRED,
    DISABLED,
    { id: "multiple", label: "Multiple", type: "checkbox" },
  ],
  upload: [NAME, REQUIRED, DISABLED],
};

const InputBody: React.FC<TypeBlockBodyProps> = ({ composer, element, targetIds }) => (
  <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={ROWS[element.type] ?? ROWS.input} />
);

const ChoiceBody: React.FC<TypeBlockBodyProps> = ({ composer, element }) => (
  <EditTextRow composer={composer} elementId={element.id} />
);

export const FORM_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  input: InputBody,
  choice: ChoiceBody,
};
