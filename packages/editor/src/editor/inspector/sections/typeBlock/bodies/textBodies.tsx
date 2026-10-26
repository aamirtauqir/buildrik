/**
 * Type-block bodies — text family: Heading, Text (+ paragraph), Link, Label,
 * Button (boards 1, 4, 5).
 *
 *   Heading — Level H1–H6 segmented (writes the tag, one Undo), Edit text
 *             on canvas.
 *   Text / Link / Label — Edit text on canvas.
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
import { writableElements } from "@/engine/commands/commandOperations";
import { ButtonGroup } from "@/editor/inspector/shared/controls";
import { runTxn, writeAttribute } from "../attributeWriter";
import { isAttrOn, useElementRead } from "../blockRows";
import { CheckRow } from "@/editor/inspector/shared/controls/CheckRow";
import { EditTextRow } from "../EditTextRow";

const LEVELS = ["h1", "h2", "h3", "h4", "h5", "h6"].map((v) => ({ value: v, label: v.toUpperCase() }));

const BUTTON_TYPES = [
  { value: "button", label: "Button" },
  { value: "submit", label: "Submit" },
  { value: "reset", label: "Reset" },
];

// ============================================================================
// ROWS
// ============================================================================

/** Level — the heading's tag, written on every writable target in ONE
 *  transaction (one Undo, DD-12). */
function LevelRow(props: TypeBlockBodyProps) {
  const { composer, targetIds } = props;
  const [level, reread] = useElementRead(props, (el) => el.getTagName?.()?.toLowerCase() || "h2", "h2");
  const write = (tag: string) => {
    if (!composer) return;
    const targets = writableElements(composer, targetIds.map((id) => composer.elements.getElement(id)));
    if (targets.length === 0) return;
    runTxn(composer, "heading-level", () => {
      for (const el of targets) el.setTagName(tag);
    });
    reread();
  };
  return <ButtonGroup label="Level" value={level} onChange={write} options={LEVELS} />;
}

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

const Heading: React.FC<TypeBlockBodyProps> = (props) => (
  <>
    <LevelRow {...props} />
    <EditTextRow composer={props.composer} elementId={props.element.id} />
  </>
);

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
  heading: Heading,
  text: TextBody,
  link: TextBody,
  label: TextBody,
  button: ButtonBody,
};
