/**
 * Type-block bodies — text family: Heading, Text (+ paragraph), Link, Label,
 * Button (boards 1, 4, 5).
 *
 *   Heading — Level H1–H6 segmented (writes the tag, one Undo), Text style,
 *             Edit text on canvas.
 *   Text / Link / Label — Text style, Edit text on canvas.
 *   Button  — Edit text on canvas, Type Button/Submit/Reset segmented,
 *             Disabled (box first, label beside). No Text style: a button's
 *             type lives in its closed "Text inside" (owner answer 1).
 *
 * The text itself is edited on the canvas, never in a textarea here; Open In,
 * Rel and a link's Title belong to the Link and Attributes sections (R-DD-9).
 *
 * @license BSD-3-Clause
 */

import * as React from "react";
import type { TypeBlockBodyProps } from "../../../config/typeBlocks";
import type { TypeBlockId } from "@/shared/constants/elementCapabilities";
import { writableElements } from "@/engine/commands/commandOperations";
import { ButtonGroup, SelectRow } from "../../../shared/controls";
import { extractVarName, cssVarToTokenId, resolveTokenVar } from "../../../shared/tokenBindingDetection";
import { useTypeRegistry } from "@/editor/design-system/state/TokenRegistryContext";
import { typeStyleRows } from "@/editor/design-system/ui/sections/TypographySection";
import { runTxn, writeAttribute } from "../attributeWriter";
import { isAttrOn, useElementRead } from "../blockRows";
import { CheckRow } from "../../../shared/controls/CheckRow";
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

/**
 * Text style — the Brand type styles are its font-size tokens (F-11), so a
 * style binds `font-size` to that token's var() (owner answer 4). "Custom"
 * unbinds to the size the token stood for, so nothing on the canvas moves.
 */
function TextStyleRow({ styles, onChange }: TypeBlockBodyProps) {
  const { tokens } = useTypeRegistry();
  const options = React.useMemo(
    () =>
      typeStyleRows(tokens).map((row) => ({ value: row.id, label: row.name })),
    [tokens],
  );
  const size = styles["font-size"] ?? "";
  const varName = extractVarName(size);
  const bound = varName ? cssVarToTokenId(varName) : null;
  const value = bound && options.some((o) => o.value === bound) ? bound : "";
  const choose = (id: string) => {
    if (id) {
      const token = tokens.find((t) => t.id === id);
      if (token) onChange("font-size", `var(${token.cssVar})`);
      return;
    }
    if (varName) onChange("font-size", resolveTokenVar(size) || size);
  };
  return <SelectRow label="Text style" value={value} onChange={choose} options={options} placeholder="Custom" property="font-size" />;
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
    <TextStyleRow {...props} />
    <EditTextRow composer={props.composer} elementId={props.element.id} />
  </>
);

const TextBody: React.FC<TypeBlockBodyProps> = (props) => (
  <>
    <TextStyleRow {...props} />
    <EditTextRow composer={props.composer} elementId={props.element.id} />
  </>
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
