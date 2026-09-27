/**
 * Type-block bodies — text family: Heading, Text (+ paragraph), Link, Label,
 * Button (boards 1, 4, 5). Lane L2-A replaces these generic W1 bodies with
 * the board layouts (Level segmented, Text style, Type segmented).
 *
 * W1 carries over the old Advanced rows for these types, minus what the
 * redesign removed (R-DD-9): the content textareas (the text is edited on the
 * canvas — "Edit text on canvas"), and Link/Button "Open In", "Rel" and link
 * "Title" (the Link section owns where a link goes; Attributes owns title).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { EditTextRow } from "../EditTextRow";
import { PropertyRows, type PropertyConfig } from "../PropertyField";

const HEADING_ROWS: readonly PropertyConfig[] = [
  {
    id: "level",
    label: "Level",
    type: "select",
    options: ["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => ({ value: v, label: v.toUpperCase() })),
  },
];

const BUTTON_ROWS: readonly PropertyConfig[] = [
  {
    id: "type",
    label: "Type",
    type: "select",
    options: [
      { value: "button", label: "Button" },
      { value: "submit", label: "Submit" },
      { value: "reset", label: "Reset" },
    ],
  },
  { id: "disabled", label: "Disabled", type: "checkbox" },
];

const TextOnly: React.FC<TypeBlockBodyProps> = ({ composer, element }) => (
  <EditTextRow composer={composer} elementId={element.id} />
);

const Heading: React.FC<TypeBlockBodyProps> = ({ composer, element, targetIds }) => (
  <>
    <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={HEADING_ROWS} />
    <EditTextRow composer={composer} elementId={element.id} />
  </>
);

const ButtonBody: React.FC<TypeBlockBodyProps> = ({ composer, element, targetIds }) => (
  <>
    <EditTextRow composer={composer} elementId={element.id} />
    <PropertyRows composer={composer} element={element} targetIds={targetIds} rows={BUTTON_ROWS} />
  </>
);

export const TEXT_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  heading: Heading,
  text: TextOnly,
  link: TextOnly,
  label: TextOnly,
  button: ButtonBody,
};
