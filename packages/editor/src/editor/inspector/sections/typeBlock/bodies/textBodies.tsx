/**
 * Type-block bodies — text family: Heading, Text (+ paragraph), Link, Label,
 * Button (boards 1, 4, 5).
 *
 *   Heading / Text / Link / Label — Edit text on canvas. A heading's level
 *             is its tag: Content › Semantics (`../../SemanticsSection`).
 *   Button  — Edit text on canvas, Type Button/Submit/Reset segmented,
 *             Disabled (box first, label beside).
 *
 * The block heads Content (2L9 page 04). The Brand "Text style" binding is a
 * style write, so it heads Style › Typography (`typography/TextStyleRow`).
 *
 * The text itself is edited on the canvas, never in a textarea here; Open In,
 * Rel and a link's Title belong to the Link and Attributes sections (R-DD-9).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "@/editor/inspector/config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { ButtonGroup } from "@/editor/inspector/shared/controls";
import { writeAttribute } from "../attributeWriter";
import { isAttrOn, useElementRead } from "../blockRows";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { EditTextRow } from "../EditTextRow";

const BUTTON_TYPES = [
  { value: "button", label: "Button" },
  { value: "submit", label: "Submit" },
  { value: "reset", label: "Reset" },
];

// ============================================================================
// ROWS
// ============================================================================

function ButtonTypeRow(props: TypeBlockBodyProps) {
  const { composer, targetIds } = props;
  const [type, reread] = useElementRead(props, (el) => el.getAttribute?.("type") || "button", "button");
  return (
    <ButtonGroup
      label="Type"
      value={type}
      options={BUTTON_TYPES}
      onChange={(v) => {
        if (!composer) return;
        writeAttribute(composer, targetIds, "type", v);
        reread();
      }}
    />
  );
}

function DisabledRow(props: TypeBlockBodyProps) {
  const { composer, targetIds } = props;
  const [on, reread] = useElementRead(props, (el) => isAttrOn(el.getAttribute?.("disabled")), false);
  return (
    <CheckRow
      label="Disabled"
      checked={on}
      onChange={(checked) => {
        if (!composer) return;
        writeAttribute(composer, targetIds, "disabled", checked ? "true" : "");
        reread();
      }}
    />
  );
}

// ============================================================================
// BODIES
// ============================================================================

const TextBody: React.FC<TypeBlockBodyProps> = (props) => (
  <EditTextRow composer={props.composer} elementId={props.element.id} />
);

const ButtonBody: React.FC<TypeBlockBodyProps> = (props) => (
  <>
    <EditTextRow composer={props.composer} elementId={props.element.id} />
    <ButtonTypeRow {...props} />
    <DisabledRow {...props} />
  </>
);

export const TEXT_BODIES: Partial<Record<TypeBlockId, React.FC<TypeBlockBodyProps>>> = {
  heading: TextBody,
  text: TextBody,
  link: TextBody,
  label: TextBody,
  button: ButtonBody,
};
